<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

requireAuth();
$database = new Database();
$db = $database->getConnection();

$role = isset($_GET['role']) ? trim($_GET['role']) : null;

try {
    $query = 'SELECT id, name, email, phone, role, company_id, is_active, created_at, updated_at FROM users';
    $params = [];
    if ($role) {
        $query .= ' WHERE role = ?';
        $params[] = $role;
    }
    $query .= ' ORDER BY name ASC';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, $users);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Database error: ' . $exception->getMessage());
}
