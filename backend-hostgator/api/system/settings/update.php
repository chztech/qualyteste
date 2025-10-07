<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT','POST','PATCH'])) {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if ($auth['role'] !== 'admin') {
  jsonResponse(false, null, 403, 'Forbidden');
}

$db = (new Database())->getConnection();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) $body = $_POST;

$settings = isset($body['settings']) ? $body['settings'] : null;
if (!is_array($settings) && !is_object($settings)) {
  jsonResponse(false, null, 422, 'settings must be an object');
}

try {
  $json = json_encode($settings, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

  // UPSERT
  $stmt = $db->prepare('
    INSERT INTO system_settings (id, data, updated_by)
    VALUES (1, ?, ?)
    ON DUPLICATE KEY UPDATE data = VALUES(data), updated_by = VALUES(updated_by), updated_at = NOW()
  ');
  $stmt->execute([$json, $auth['id']]);

  jsonResponse(true, ['ok' => true]);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
