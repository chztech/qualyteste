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
if (!in_array($auth['role'], ['admin'])) {
  jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

// Lê JSON puro ou fallback para $_POST
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

$name     = isset($data['name'])      ? trim($data['name'])      : '';
$address  = isset($data['address'])   ? trim($data['address'])   : null;
$phone    = isset($data['phone'])     ? trim($data['phone'])     : null;
$email    = isset($data['email'])     ? trim($data['email'])     : null;
$notes    = isset($data['notes'])     ? trim($data['notes'])     : null;
$settings = isset($data['settings'])  ? $data['settings']        : null; // pode ser array/objeto
$employees= (isset($data['employees']) && is_array($data['employees'])) ? $data['employees'] : [];

if ($name === '') {
  jsonResponse(false, null, 422, 'Campo "name" é obrigatório');
}

try {
  $db->beginTransaction();

  $id = newId();
  $publicToken = bin2hex(random_bytes(12));
  $settingsJson = null;

  if (is_array($settings) || is_object($settings)) {
    $settingsJson = json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  } elseif (is_string($settings) && $settings !== '') {
    // Se já veio string JSON, tenta validar rapidamente
    json_decode($settings);
    $settingsJson = (json_last_error() === JSON_ERROR_NONE) ? $settings : null;
  }

  // Insere empresa
  $stmt = $db->prepare('
    INSERT INTO companies (id, name, address, phone, email, notes, public_token, settings, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
  ');
  $stmt->execute([$id, $name, $address, $phone, $email, $notes, $publicToken, $settingsJson]);

  // Insere funcionários, se enviados
  if (!empty($employees)) {
    $empStmt = $db->prepare('
      INSERT INTO company_employees (id, name, phone, department, company_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ');
    foreach ($employees as $emp) {
      $empId = newId();
      $empName = isset($emp['name']) ? trim($emp['name']) : '';
      $empPhone = isset($emp['phone']) ? trim($emp['phone']) : null;
      $empDept  = isset($emp['department']) ? trim($emp['department']) : null;

      if ($empName !== '') {
        $empStmt->execute([$empId, $empName, $empPhone, $empDept, $id]);
      }
    }
  }

  $db->commit();

  // Retorna objeto no formato esperado pelo front
  jsonResponse(true, [
    'id'          => $id,
    'name'        => $name,
    'address'     => $address,
    'phone'       => $phone,
    'email'       => $email,
    'notes'       => $notes,
    'public_token'=> $publicToken,
    'created_at'  => date('Y-m-d H:i:s'),
    'updated_at'  => date('Y-m-d H:i:s'),
  ], 201);

} catch (PDOException $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
} catch (Throwable $t) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Internal error: ' . $t->getMessage());
}
