<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->name) || !isset($data->email) || !isset($data->password)) {
    jsonResponse(false, null, 400, 'Name, email and password required');
}

try {
    $db = (new Database())->getConnection();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data->email]);
    if ($stmt->rowCount() > 0) jsonResponse(false, null, 409, 'Email already registered');

    $id = newId();
    $passwordHash = password_hash($data->password, PASSWORD_BCRYPT);
    $role = 'client';
    $stmt = $db->prepare("INSERT INTO users (id, name, email, password_hash, phone, role, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $data->name, $data->email, $passwordHash, $data->phone ?? null, $role, $data->companyId ?? null]);

    jsonResponse(true, ['id' => $id], 201);
} catch (Exception $e) {
    jsonResponse(false, null, 500, 'Internal server error');
}
?>