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

$appointmentId = isset($data['appointmentId']) ? trim((string)$data['appointmentId']) : '';
$companyToken = isset($data['companyToken']) ? trim((string)$data['companyToken']) : '';

if ($appointmentId === '' || $companyToken === '') {
  jsonResponse(false, null, 422, 'appointmentId and companyToken are required');
}

$employeeIdProvided = array_key_exists('employeeId', $data);
$employeeId = $employeeIdProvided ? trim((string)$data['employeeId']) : null;
if ($employeeId === '') {
  $employeeId = null;
}

$notesProvided = array_key_exists('notes', $data);
$notes = $notesProvided ? trim((string)$data['notes']) : null;

try {
  $companyId = resolveCompanyId($db, $companyToken);
  if (!$companyId) {
    jsonResponse(false, null, 404, 'Company not found for provided token');
  }

  $stmt = $db->prepare('SELECT id, company_id, status, employee_id FROM appointments WHERE id = ? AND company_id = ? LIMIT 1');
  $stmt->execute([$appointmentId, $companyId]);
  $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$appointment) {
    jsonResponse(false, null, 404, 'Appointment not found for company');
  }

  if ($employeeId !== null) {
    $empStmt = $db->prepare('SELECT id FROM company_employees WHERE id = ? AND company_id = ? LIMIT 1');
    $empStmt->execute([$employeeId, $companyId]);
    if (!$empStmt->fetch(PDO::FETCH_ASSOC)) {
      jsonResponse(false, null, 404, 'Employee not found for company');
    }
  }

  $fields = ['status = ?'];
  $values = ['confirmed'];

  if ($employeeIdProvided) {
    $fields[] = 'employee_id = ?';
    $values[] = $employeeId;
  }

  if ($notesProvided) {
    $fields[] = 'notes = ?';
    $values[] = $notes;
  }

  $fields[] = 'updated_at = NOW()';
  $values[] = $appointmentId;

  $updateSql = 'UPDATE appointments SET ' . implode(', ', $fields) . ' WHERE id = ?';
  $upd = $db->prepare($updateSql);
  $upd->execute($values);

  $select = $db->prepare('
    SELECT
      a.id,
      a.date,
      a.start_time,
      a.end_time,
      a.duration,
      a.status,
      a.company_id,
      a.provider_id,
      a.client_id,
      a.employee_id,
      a.service_id,
      a.notes,
      a.created_at,
      a.updated_at,
      c.name AS company_name,
      p.name AS provider_name,
      s.name AS service_name,
      e.name AS employee_name
    FROM appointments a
    LEFT JOIN companies c ON c.id = a.company_id
    LEFT JOIN providers pr ON pr.id = a.provider_id
    LEFT JOIN users p ON p.id = pr.user_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN company_employees e ON e.id = a.employee_id
    WHERE a.id = ?
    LIMIT 1
  ');
  $select->execute([$appointmentId]);
  $updated = $select->fetch(PDO::FETCH_ASSOC);

  if (!$updated) {
    jsonResponse(true, ['id' => $appointmentId]);
  }

  jsonResponse(true, $updated);
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
