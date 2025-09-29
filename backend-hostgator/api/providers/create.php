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
$email = isset($data['email']) ? trim($data['email']) : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$specialties = isset($data['specialties']) && is_array($data['specialties']) ? $data['specialties'] : [];
$workingHours = isset($data['workingHours']) && is_array($data['workingHours']) ? $data['workingHours'] : null;
$breaks = isset($data['breaks']) && is_array($data['breaks']) ? $data['breaks'] : [];
$createUser = isset($data['createUser']) ? (bool) $data['createUser'] : false;
$userId = isset($data['userId']) ? trim($data['userId']) : null;

if ($name === '') {
    jsonResponse(false, null, 422, 'Name is required');
}

try {
    $providerId = newId();
    $db->beginTransaction();

    if ($createUser && !$userId) {
        $passwordPlain = bin2hex(random_bytes(6));
        $passwordHash = password_hash($passwordPlain, PASSWORD_BCRYPT);
        $userId = newId();

        $userStmt = $db->prepare('INSERT INTO users (id, name, email, phone, role, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())');
        $userStmt->execute([
            $userId,
            $name,
            $email,
            $phone,
            'provider',
            $passwordHash
        ]);
    }

    $stmt = $db->prepare('INSERT INTO providers (id, user_id, name, email, phone, specialties, working_hours, breaks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
    $stmt->execute([
        $providerId,
        $userId,
        $name,
        $email,
        $phone,
        json_encode($specialties, JSON_UNESCAPED_UNICODE),
        $workingHours ? json_encode($workingHours, JSON_UNESCAPED_UNICODE) : null,
        json_encode($breaks, JSON_UNESCAPED_UNICODE)
    ]);

    $db->commit();

    jsonResponse(true, [
        'id' => $providerId,
        'userId' => $userId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'specialties' => $specialties,
        'workingHours' => $workingHours,
        'breaks' => $breaks
    ], 201);
} catch (Exception $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse(false, null, 500, 'Failed to create provider: ' . $exception->getMessage());
}
