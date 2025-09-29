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

$providerId = isset($data['id']) ? trim($data['id']) : '';
if ($providerId === '') {
    jsonResponse(false, null, 422, 'Provider id is required');
}

$name = isset($data['name']) ? trim($data['name']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$phone = isset($data['phone']) ? trim($data['phone']) : null;
$specialties = isset($data['specialties']) && is_array($data['specialties']) ? $data['specialties'] : null;
$workingHours = isset($data['workingHours']) && is_array($data['workingHours']) ? $data['workingHours'] : null;
$breaks = isset($data['breaks']) && is_array($data['breaks']) ? $data['breaks'] : null;
$userId = isset($data['userId']) ? trim($data['userId']) : null;

try {
    $fields = [];
    $values = [];

    if ($name !== null) {
        $fields[] = 'name = ?';
        $values[] = $name;
    }
    if ($email !== null) {
        $fields[] = 'email = ?';
        $values[] = $email;
    }
    if ($phone !== null) {
        $fields[] = 'phone = ?';
        $values[] = $phone;
    }
    if ($specialties !== null) {
        $fields[] = 'specialties = ?';
        $values[] = json_encode($specialties, JSON_UNESCAPED_UNICODE);
    }
    if ($workingHours !== null) {
        $fields[] = 'working_hours = ?';
        $values[] = json_encode($workingHours, JSON_UNESCAPED_UNICODE);
    }
    if ($breaks !== null) {
        $fields[] = 'breaks = ?';
        $values[] = json_encode($breaks, JSON_UNESCAPED_UNICODE);
    }

    $fields[] = 'updated_at = NOW()';

    if (!$fields) {
        jsonResponse(false, null, 400, 'No updatable fields provided');
    }

    $values[] = $providerId;

    $db->beginTransaction();

    $stmt = $db->prepare('UPDATE providers SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    if ($userId && ($name !== null || $email !== null || $phone !== null)) {
        $userFields = [];
        $userValues = [];
        if ($name !== null) {
            $userFields[] = 'name = ?';
            $userValues[] = $name;
        }
        if ($email !== null) {
            $userFields[] = 'email = ?';
            $userValues[] = $email;
        }
        if ($phone !== null) {
            $userFields[] = 'phone = ?';
            $userValues[] = $phone;
        }
        if ($userFields) {
            $userFields[] = 'updated_at = NOW()';
            $userValues[] = $userId;
            $userStmt = $db->prepare('UPDATE users SET ' . implode(', ', $userFields) . ' WHERE id = ?');
            $userStmt->execute($userValues);
        }
    }

    $db->commit();

    jsonResponse(true, [
        'id' => $providerId
    ]);
} catch (Exception $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse(false, null, 500, 'Failed to update provider: ' . $exception->getMessage());
}
