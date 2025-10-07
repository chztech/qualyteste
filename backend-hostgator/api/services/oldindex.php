<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$auth = requireAuth();
$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

try {
    if ($method === 'GET') {
        $stmt = $db->query('SELECT id, name, description, duration, price, created_at, updated_at FROM services ORDER BY name ASC');
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(true, $services);
    }

    if ($method === 'POST') {
        $name = isset($payload['name']) ? trim($payload['name']) : '';
        $duration = isset($payload['duration']) ? (int) $payload['duration'] : null;
        $description = isset($payload['description']) ? trim($payload['description']) : null;
        $price = isset($payload['price']) ? (float) $payload['price'] : null;

        if ($name === '' || !$duration) {
            jsonResponse(false, null, 422, 'Name and duration are required');
        }

        $id = newId();
        $stmt = $db->prepare('INSERT INTO services (id, name, description, duration, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([$id, $name, $description, $duration, $price]);

        jsonResponse(true, [
            'id' => $id,
            'name' => $name,
            'description' => $description,
            'duration' => $duration,
            'price' => $price
        ], 201);
    }

    if (in_array($method, ['PUT', 'PATCH'])) {
        $id = isset($payload['id']) ? trim($payload['id']) : '';
        if ($id === '') {
            jsonResponse(false, null, 422, 'Service id is required');
        }

        $fields = [];
        $values = [];

        if (isset($payload['name'])) {
            $fields[] = 'name = ?';
            $values[] = trim($payload['name']);
        }
        if (isset($payload['description'])) {
            $fields[] = 'description = ?';
            $values[] = trim($payload['description']);
        }
        if (isset($payload['duration'])) {
            $fields[] = 'duration = ?';
            $values[] = (int) $payload['duration'];
        }
        if (isset($payload['price'])) {
            $fields[] = 'price = ?';
            $values[] = (float) $payload['price'];
        }

        if (!$fields) {
            jsonResponse(false, null, 400, 'No fields to update');
        }

        $fields[] = 'updated_at = NOW()';
        $values[] = $id;

        $stmt = $db->prepare('UPDATE services SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($values);

        jsonResponse(true, ['id' => $id]);
    }

    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($payload['id']) ? trim($payload['id']) : '');
        if ($id === '') {
            jsonResponse(false, null, 422, 'Service id is required');
        }

        $stmt = $db->prepare('DELETE FROM services WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(true, ['id' => $id]);
    }

    jsonResponse(false, null, 405, 'Unsupported method');
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Database error: ' . $exception->getMessage());
}
