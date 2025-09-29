<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

requireAuth();
$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$role = isset($data['role']) ? trim($data['role']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$companyId = isset($data['companyId']) ? trim($data['companyId']) : null;
$password = isset($data['password']) ? (string) $data['password'] : null;
$isActive = isset($data['isActive']) ? (bool) $data['isActive'] : true;

if ($name === '' || $email === '' || $role === '') {
    jsonResponse(false, null, 422, 'Name, email and role are required');
}

try {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, 409, 'Email already registered');
    }

    if ($password === null || $password === '') {
        $password = bin2hex(random_bytes(6));
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $userId = newId();

    $stmt = $db->prepare('INSERT INTO users (id, name, email, phone, role, company_id, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
    $stmt->execute([
        $userId,
        $name,
        $email,
        $phone,
        $role,
        $companyId,
        $passwordHash,
        $isActive ? 1 : 0
    ]);

    jsonResponse(true, [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'role' => $role,
        'companyId' => $companyId,
        'isActive' => $isActive,
        'temporaryPassword' => $password
    ], 201);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Failed to create user: ' . $exception->getMessage());
}
