<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
// Normalmente só admin cria empresas
if (!in_array($auth['role'], ['admin'])) {
  jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$name       = isset($data['name']) ? trim($data['name']) : '';
$address    = isset($data['address']) ? trim($data['address']) : null;
$phone      = isset($data['phone']) ? trim($data['phone']) : null;
$email      = isset($data['email']) ? trim($data['email']) : null;
$notes      = isset($data['notes']) ? trim($data['notes']) : null;
$employees  = isset($data['employees']) && is_array($data['employees']) ? $data['employees'] : [];
$isActive   = isset($data['isActive']) ? (bool)$data['isActive'] : true;

// (Opcional) permitir que venha uma senha para o usuário-company
$companyUserPassword = isset($data['password']) ? (string)$data['password'] : null;

if ($name === '') {
  jsonResponse(false, null, 422, 'Company name is required');
}

try {
  $db->beginTransaction();

  // Cria empresa
  $companyId = newId();
  $publicToken = bin2hex(random_bytes(12)); // token público para booking
  $stmt = $db->prepare('
    INSERT INTO companies (id, name, address, phone, email, notes, public_token, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  ');
  $stmt->execute([
    $companyId, $name, $address, $phone, $email, $notes, $publicToken, $isActive ? 1 : 0
  ]);

  // Colaboradores (opcional)
  if ($employees) {
    $empStmt = $db->prepare('
      INSERT INTO company_employees (id, company_id, name, phone, department, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ');
    foreach ($employees as $emp) {
      $empId = newId();
      $empStmt->execute([
        $empId,
        $companyId,
        isset($emp['name']) ? trim($emp['name']) : '',
        isset($emp['phone']) ? trim($emp['phone']) : null,
        isset($emp['department']) ? trim($emp['department']) : null
      ]);
    }
  }

  // Usuário da empresa (role=company) usando o e-mail cadastrado
  $temporaryPassword = null;
  if ($email && $email !== '') {
    // Verifica se já existe um usuário com esse email
    $u = $db->prepare('SELECT id, role, company_id FROM users WHERE email = ? LIMIT 1');
    $u->execute([$email]);
    $existing = $u->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
      // Se já existe e é da mesma empresa, apenas garante linkage/ativação
      if ($existing['role'] === 'company') {
        $upd = $db->prepare('UPDATE users SET company_id = ?, is_active = 1, updated_at = NOW() WHERE id = ?');
        $upd->execute([$companyId, $existing['id']]);
      } else {
        // Email já usado por outro tipo de usuário → erro explícito
        $db->rollBack();
        jsonResponse(false, null, 409, 'Email already used by another user');
      }
    } else {
      // Cria usuário novo (role=company)
      if ($companyUserPassword === null || $companyUserPassword === '') {
        $temporaryPassword = bin2hex(random_bytes(6));
      } else {
        $temporaryPassword = $companyUserPassword;
      }
      $hash = password_hash($temporaryPassword, PASSWORD_BCRYPT);

      $userId = newId();
      $ins = $db->prepare('
        INSERT INTO users (id, name, email, phone, role, company_id, password_hash, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, "company", ?, ?, 1, NOW(), NOW())
      ');
      $ins->execute([$userId, $name, $email, $phone, $companyId, $hash]);
    }
  }

  $db->commit();

  jsonResponse(true, [
    'id'           => $companyId,
    'name'         => $name,
    'address'      => $address,
    'phone'        => $phone,
    'email'        => $email,
    'notes'        => $notes,
    'publicToken'  => $publicToken,
    'isActive'     => (bool)$isActive,
    // se foi criado usuário novo: devolve senha temporária para o admin repassar
    'temporaryPassword' => $temporaryPassword
  ], 201);

} catch (PDOException $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
