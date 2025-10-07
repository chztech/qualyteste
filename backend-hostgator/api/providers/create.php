<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_end(405, ['success' => false, 'error' => 'Method not allowed']);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = $_POST;

$name         = trim($body['name'] ?? '');
$email        = trim($body['email'] ?? '');
$phone        = $body['phone'] ?? null;
$specialties  = $body['specialties'] ?? [];
$workingHours = $body['workingHours'] ?? null;
$breaks       = $body['breaks'] ?? [];
$isActive     = isset($body['isActive']) ? (intval($body['isActive']) ? 1 : 0) : 1;

$userId       = $body['userId'] ?? null;       // opcional
$createUser   = !!($body['createUser'] ?? false);
$companyId    = $body['companyId'] ?? null;    // usado só se createUser=true

if ($name === '' || $email === '') {
  json_end(400, ['success' => false, 'error' => 'name and email are required']);
}

$db = (new Database())->getConnection();
$db->beginTransaction();

try {
  if ($createUser && !$userId) {
    // cria um user básico (senha pode ser definida depois via /providers/password.php)
    $chk = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $chk->execute([$email]);
    if ($chk->fetch()) throw new Exception('Email already in use');

    $uid = bin2hex(random_bytes(16));
    $stmt = $db->prepare(
      "INSERT INTO users (id, name, email, phone, role, company_id, password_hash, is_active)
       VALUES (?, ?, ?, ?, 'provider', ?, '', 1)"
    );
    $stmt->execute([$uid, $name, $email, $phone, $companyId]);
    $userId = $uid;
  }

  $pid = bin2hex(random_bytes(16));
  $stmt = $db->prepare(
    "INSERT INTO providers
     (id, user_id, name, email, phone, specialties, working_hours, breaks, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  $stmt->execute([
    $pid,
    $userId,
    $name,
    $email,
    $phone,
    json_encode($specialties, JSON_UNESCAPED_UNICODE),
    $workingHours ? json_encode($workingHours, JSON_UNESCAPED_UNICODE) : null,
    json_encode($breaks, JSON_UNESCAPED_UNICODE),
    $isActive
  ]);

  $db->commit();
  json_end(201, ['success' => true, 'data' => ['id' => $pid, 'userId' => $userId]]);
} catch (Throwable $e) {
  $db->rollBack();
  error_log("providers/create error: ".$e->getMessage());
  json_end(500, ['success' => false, 'error' => 'Could not create provider']);
}
