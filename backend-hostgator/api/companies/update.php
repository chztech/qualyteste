<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT','POST','PATCH'])) {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();

$database = new Database();
$db = $database->getConnection();

// Lê JSON ou $_POST
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$id = isset($data['id']) ? trim((string)$data['id']) : '';
if ($id === '') {
  jsonResponse(false, null, 422, 'Company id is required');
}

/**
 * Permissões:
 * - admin: pode tudo
 * - company: pode apenas a própria empresa; e só alterar phone, notes, settings e employees
 */
$isAdmin   = ($auth['role'] ?? '') === 'admin';
$isCompany = ($auth['role'] ?? '') === 'company';
if ($isCompany) {
  $authCompanyId = $auth['company_id'] ?? null;
  if (!$authCompanyId || $authCompanyId !== $id) {
    jsonResponse(false, null, 403, 'Forbidden: you can update only your own company');
  }
}

// Campos de entrada (podem vir nulos para limpar, exceto onde indicado)
$name     = array_key_exists('name', $data)     ? ($data['name']     !== null ? trim((string)$data['name']) : null) : null;
$address  = array_key_exists('address', $data)  ? ($data['address']  !== null ? trim((string)$data['address']) : null) : null;
$phone    = array_key_exists('phone', $data)    ? ($data['phone']    !== null ? trim((string)$data['phone']) : null) : null;
$email    = array_key_exists('email', $data)    ? ($data['email']    !== null ? trim((string)$data['email']) : null) : null;
$notes    = array_key_exists('notes', $data)    ? ($data['notes']    !== null ? trim((string)$data['notes']) : null) : null;
$isActive = array_key_exists('isActive', $data) ? (bool)$data['isActive'] : null;
$settings = array_key_exists('settings', $data) ? $data['settings'] : '__NOSET__'; // pode ser null intencionalmente

$employees = array_key_exists('employees', $data) && is_array($data['employees'])
  ? $data['employees']
  : null;

try {
  // Confirma que a empresa existe
  $stmt = $db->prepare('SELECT id, email FROM companies WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $companyRow = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$companyRow) {
    jsonResponse(false, null, 404, 'Company not found');
  }

  $db->beginTransaction();

  // Monta UPDATE dependendo da role
  $fields = [];
  $params = [];

  if ($isAdmin) {
    if ($name !== null)     { $fields[] = 'name = ?';      $params[] = $name; }
    if ($address !== null)  { $fields[] = 'address = ?';   $params[] = $address; }
    if ($phone !== null)    { $fields[] = 'phone = ?';     $params[] = $phone; }
    if ($email !== null)    { $fields[] = 'email = ?';     $params[] = $email; }
    if ($notes !== null)    { $fields[] = 'notes = ?';     $params[] = $notes; }
    if ($isActive !== null) { $fields[] = 'is_active = ?'; $params[] = $isActive ? 1 : 0; }
    if ($settings !== '__NOSET__') {
      if ($settings === null) { $fields[] = 'settings = NULL'; }
      else { $fields[] = 'settings = ?'; $params[] = json_encode($settings, JSON_UNESCAPED_UNICODE); }
    }
  } elseif ($isCompany) {
    // company só pode mexer nesses campos:
    if ($phone !== null)    { $fields[] = 'phone = ?';     $params[] = $phone; }
    if ($notes !== null)    { $fields[] = 'notes = ?';     $params[] = $notes; }
    if ($settings !== '__NOSET__') {
      if ($settings === null) { $fields[] = 'settings = NULL'; }
      else { $fields[] = 'settings = ?'; $params[] = json_encode($settings, JSON_UNESCAPED_UNICODE); }
    }
    // Ignora name/email/isActive/address vindos do payload em role company
  }

  if (!empty($fields)) {
    $fields[] = 'updated_at = NOW()';
    $params[] = $id;
    $sql = 'UPDATE companies SET '.implode(', ', $fields).' WHERE id = ?';
    $up = $db->prepare($sql);
    $up->execute($params);
  }

  // Se ADMIN trocou o email da empresa, sincroniza usuário role=company
  if ($isAdmin && $email !== null) {
    // Verifica se esse email já pertence a outro user que não seja a própria conta company da empresa
    $chk = $db->prepare('SELECT id FROM users WHERE email = ? AND (role <> "company" OR company_id <> ?) LIMIT 1');
    $chk->execute([$email, $id]);
    if ($chk->fetch(PDO::FETCH_ASSOC)) {
      $db->rollBack();
      jsonResponse(false, null, 409, 'Email already used by another user');
    }

    // Atualiza email do user da empresa
    $upUser = $db->prepare('UPDATE users SET email = ?, updated_at = NOW() WHERE role = "company" AND company_id = ?');
    $upUser->execute([$email, $id]);
  }

  // -------- EMPLOYEES UPSERT --------
  $returnedEmployees = [];
  if (is_array($employees)) {
    // Busca IDs atuais
    $stmt = $db->prepare('SELECT id FROM company_employees WHERE company_id = ?');
    $stmt->execute([$id]);
    $currentIds = array_map(fn($r) => $r['id'], $stmt->fetchAll(PDO::FETCH_ASSOC));

    $incomingIds = [];

    $ins = $db->prepare('INSERT INTO company_employees (id, company_id, name, phone, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
    $upd = $db->prepare('UPDATE company_employees SET name = ?, phone = ?, department = ?, updated_at = NOW() WHERE id = ? AND company_id = ?');

    foreach ($employees as $emp) {
      $empId   = isset($emp['id']) && $emp['id'] !== '' ? trim((string)$emp['id']) : null;
      $empName = isset($emp['name']) ? trim((string)$emp['name']) : '';
      $empPhone= isset($emp['phone']) ? ($emp['phone'] !== null ? trim((string)$emp['phone']) : null) : null;
      $empDept = isset($emp['department']) ? ($emp['department'] !== null ? trim((string)$emp['department']) : null) : null;

      if ($empId && in_array($empId, $currentIds, true)) {
        // update
        $upd->execute([$empName, $empPhone, $empDept, $empId, $id]);
        $incomingIds[] = $empId;
      } else {
        // insert
        $newId = $empId ?: newId();
        $ins->execute([$newId, $id, $empName, $empPhone, $empDept]);
        $incomingIds[] = $newId;
      }
    }

    // Remove quem não veio mais (sincronização)
    $toDelete = array_diff($currentIds, $incomingIds);
    if (!empty($toDelete)) {
      $in = implode(',', array_fill(0, count($toDelete), '?'));
      $params = array_merge([$id], array_values($toDelete));
      $del = $db->prepare("DELETE FROM company_employees WHERE company_id = ? AND id IN ($in)");
      $del->execute($params);
    }

    // Retorna lista final
    $stmt = $db->prepare('SELECT id, name, phone, department, company_id, created_at, updated_at FROM company_employees WHERE company_id = ? ORDER BY name ASC');
    $stmt->execute([$id]);
    $returnedEmployees = $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  $db->commit();
  jsonResponse(true, [
    'id' => $id,
    'employees' => $returnedEmployees
  ]);

} catch (PDOException $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Database error: '.$e->getMessage());
}
