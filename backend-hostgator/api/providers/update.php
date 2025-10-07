<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_end(405, ['success' => false, 'error' => 'Method not allowed']);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = $_POST;

$id = $body['id'] ?? null;
if (!$id) json_end(400, ['success' => false, 'error' => 'id is required']);

$fields = [];
$params = [];

foreach (['name','email','phone'] as $f) {
  if (array_key_exists($f, $body)) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
}
if (array_key_exists('specialties', $body))   { $fields[] = "specialties = ?";    $params[] = json_encode($body['specialties'], JSON_UNESCAPED_UNICODE); }
if (array_key_exists('workingHours', $body))  { $fields[] = "working_hours = ?";  $params[] = $body['workingHours'] !== null ? json_encode($body['workingHours'], JSON_UNESCAPED_UNICODE) : null; }
if (array_key_exists('breaks', $body))        { $fields[] = "breaks = ?";         $params[] = json_encode($body['breaks'], JSON_UNESCAPED_UNICODE); }
if (array_key_exists('isActive', $body))      { $fields[] = "is_active = ?";      $params[] = (intval($body['isActive']) ? 1 : 0); }

if (empty($fields)) {
  json_end(400, ['success' => false, 'error' => 'No updatable fields provided']);
}

$params[] = $id;

$db = (new Database())->getConnection();
$sql = "UPDATE providers SET " . implode(", ", $fields) . " WHERE id = ?";
$stmt = $db->prepare($sql);
$stmt->execute($params);

json_end(200, ['success' => true, 'message' => 'Provider updated']);
