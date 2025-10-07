<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
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

$ids = [];
if (isset($data['ids']) && is_array($data['ids'])) {
    $ids = array_filter(array_map('trim', $data['ids']));
}

if (!$ids && isset($data['id'])) {
    $ids = [trim($data['id'])];
}

if (!$ids && isset($_GET['id'])) {
    $ids = [trim($_GET['id'])];
}

$ids = array_values(array_filter($ids));

if (!$ids) {
    jsonResponse(false, null, 422, 'At least one appointment id is required');
}

try {
    $placeholders = implode(', ', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare('DELETE FROM appointments WHERE id IN (' . $placeholders . ')');
    $stmt->execute($ids);

    jsonResponse(true, ['ids' => $ids]);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Failed to delete appointments: ' . $exception->getMessage());
}
