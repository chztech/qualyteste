<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
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

$userId = isset($data['id']) ? trim($data['id']) : '';
if ($userId === '') {
    jsonResponse(false, null, 422, 'User id is required');
}

try {
    $fields = [];
    $values = [];

    $map = [
        'name' => 'name',
        'email' => 'email',
        'phone' => 'phone',
        'role' => 'role',
        'companyId' => 'company_id'
    ];

    foreach ($map as $inputKey => $column) {
        if (isset($data[$inputKey])) {
            $fields[] = $column . ' = ?';
            $values[] = trim((string) $data[$inputKey]);
        }
    }

    if (isset($data['isActive'])) {
        $fields[] = 'is_active = ?';
        $values[] = (bool) $data['isActive'] ? 1 : 0;
    }

    if (isset($data['password']) && $data['password'] !== '') {
        $fields[] = 'password_hash = ?';
        $values[] = password_hash((string) $data['password'], PASSWORD_BCRYPT);
    }

    if (!$fields) {
        jsonResponse(false, null, 400, 'No updatable fields provided');
    }

    $fields[] = 'updated_at = NOW()';
    $values[] = $userId;

    $stmt = $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    jsonResponse(true, ['id' => $userId]);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Failed to update user: ' . $exception->getMessage());
}
