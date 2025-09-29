<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

requireAuth();
$database = new Database();
$db = $database->getConnection();

$providerId = isset($_GET['id']) ? trim($_GET['id']) : null;

try {
    $query = 'SELECT id, name, email, phone, specialties, working_hours, breaks, user_id, created_at, updated_at FROM providers';
    $params = [];
    if ($providerId) {
        $query .= ' WHERE id = ?';
        $params[] = $providerId;
    }
    $query .= ' ORDER BY name ASC';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $providers = [];
    foreach ($rows as $row) {
        $providers[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'specialties' => $row['specialties'] ? json_decode($row['specialties'], true) : [],
            'workingHours' => $row['working_hours'] ? json_decode($row['working_hours'], true) : null,
            'breaks' => $row['breaks'] ? json_decode($row['breaks'], true) : [],
            'userId' => $row['user_id'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    jsonResponse(true, $providers);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Database error: ' . $exception->getMessage());
}
