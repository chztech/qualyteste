<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

$companyToken = isset($data['companyToken']) ? trim((string)$data['companyToken']) : '';
$name = isset($data['name']) ? trim((string)$data['name']) : '';
$phone = array_key_exists('phone', $data) ? trim((string)$data['phone']) : null;
$department = array_key_exists('department', $data) ? trim((string)$data['department']) : null;

if ($companyToken === '' || $name === '') {
  jsonResponse(false, null, 422, 'companyToken and name are required');
}

$employeeIdValue = isset($data['employeeId']) ? trim((string)$data['employeeId']) : '';
$employeeId = $employeeIdValue !== '' ? $employeeIdValue : newId();

if ($phone === '') {
  $phone = null;
}
if ($department === '') {
  $department = null;
}

try {
  $companyId = resolveCompanyId($db, $companyToken);
  if (!$companyId) {
    jsonResponse(false, null, 404, 'Company not found for provided token');
  }

  $existing = $db->prepare('SELECT id FROM company_employees WHERE id = ? AND company_id = ? LIMIT 1');
  $existing->execute([$employeeId, $companyId]);
  $exists = $existing->fetch(PDO::FETCH_ASSOC);

  if ($exists) {
    $update = $db->prepare('UPDATE company_employees SET name = ?, phone = ?, department = ?, updated_at = NOW() WHERE id = ? AND company_id = ?');
    $update->execute([$name, $phone, $department, $employeeId, $companyId]);
  } else {
    $insert = $db->prepare('INSERT INTO company_employees (id, company_id, name, phone, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
    $insert->execute([$employeeId, $companyId, $name, $phone, $department]);
  }

  $select = $db->prepare('SELECT id, company_id, name, phone, department, created_at, updated_at FROM company_employees WHERE id = ? AND company_id = ? LIMIT 1');
  $select->execute([$employeeId, $companyId]);
  $employee = $select->fetch(PDO::FETCH_ASSOC);

  if (!$employee) {
    jsonResponse(false, null, 500, 'Failed to persist employee');
  }

  jsonResponse(true, $employee);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}

function resolveCompanyId(PDO $db, string $token): ?string {
  if ($token === '') {
    return null;
  }

  $stmt = $db->prepare('SELECT id FROM companies WHERE public_token = ? LIMIT 1');
  $stmt->execute([$token]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row && isset($row['id'])) {
    return $row['id'];
  }

  $decoded = base64_decode($token, true);
  if ($decoded !== false && $decoded !== '') {
    $stmt = $db->prepare('SELECT id FROM companies WHERE id = ? LIMIT 1');
    $stmt->execute([$decoded]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row['id'])) {
      return $row['id'];
    }
  }

  $stmt = $db->prepare('SELECT id FROM companies WHERE id = ? LIMIT 1');
  $stmt->execute([$token]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row && isset($row['id'])) {
    return $row['id'];
  }

  return null;
}
