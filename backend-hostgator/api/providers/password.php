<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_end(405, ['success' => false, 'error' => 'Method not allowed']);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = $_POST;

$providerId  = $body['providerId'] ?? null;
$userId      = $body['userId'] ?? null;
$newPassword = (string)($body['password'] ?? '');

if ($newPassword === '') {
  json_end(400, ['success' => false, 'error' => 'password is required']);
}

$db = (new Database())->getConnection();

try {
  if (!$userId) {
    if (!$providerId) json_end(400, ['success' => false, 'error' => 'userId or providerId is required']);
    $stmt = $db->prepare("SELECT user_id FROM providers WHERE id = ? LIMIT 1");
    $stmt->execute([$providerId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !$row['user_id']) json_end(404, ['success' => false, 'error' => 'Provider not found or no linked user']);
    $userId = $row['user_id'];
  }

  $hash = password_hash($newPassword, PASSWORD_BCRYPT);
  $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
  $stmt->execute([$hash, $userId]);

  if ($stmt->rowCount() === 0) {
    json_end(404, ['success' => false, 'error' => 'User not found or not updated']);
  }

  json_end(200, ['success' => true, 'message' => 'Password updated']);
} catch (Throwable $e) {
  error_log("providers/password error: ".$e->getMessage());
  json_end(500, ['success' => false, 'error' => 'Could not update password']);
}
