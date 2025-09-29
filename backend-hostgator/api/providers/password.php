<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if (!isset($auth['role']) || $auth['role'] !== 'admin') {
    jsonResponse(false, null, 403, 'Permission denied');
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$providerId = isset($data['providerId']) ? trim($data['providerId']) : '';
$password = isset($data['password']) ? (string) $data['password'] : '';

if ($providerId === '' || $password === '') {
    jsonResponse(false, null, 422, 'Provider id and password are required');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare('SELECT id, user_id, email, name, phone FROM providers WHERE id = ? LIMIT 1');
    $stmt->execute([$providerId]);
    $provider = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$provider) {
        jsonResponse(false, null, 404, 'Provider not found');
    }

    $userId = $provider['user_id'];
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    if ($userId) {
        $updateStmt = $db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
        $updateStmt->execute([$passwordHash, $userId]);
    } else {
        $db->beginTransaction();

        $existingUserStmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $existingUserStmt->execute([$provider['email']]);
        $existingUser = $existingUserStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingUser) {
            $userId = $existingUser['id'];
            $updateStmt = $db->prepare('UPDATE users SET password_hash = ?, role = ?, phone = ?, updated_at = NOW() WHERE id = ?');
            $updateStmt->execute([$passwordHash, 'provider', $provider['phone'], $userId]);
        } else {
            $userId = newId();
            $insertStmt = $db->prepare('INSERT INTO users (id, name, email, phone, role, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())');
            $insertStmt->execute([
                $userId,
                $provider['name'],
                $provider['email'],
                $provider['phone'],
                'provider',
                $passwordHash
            ]);
        }

        $updateProviderStmt = $db->prepare('UPDATE providers SET user_id = ?, updated_at = NOW() WHERE id = ?');
        $updateProviderStmt->execute([$userId, $providerId]);

        $db->commit();
    }

    jsonResponse(true, ['message' => 'Senha atualizada com sucesso']);
} catch (Exception $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse(false, null, 500, 'Failed to update password: ' . $exception->getMessage());
}
