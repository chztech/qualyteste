<?php
// backend-hostgator/api/services/index.php
// NADA antes desta linha (sem BOM)
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../helpers/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
  json_end(200, ['success' => true]);
}

if ($method !== 'GET') {
  $auth = requireAuth();
  if (($auth['role'] ?? '') !== 'admin') {
    json_end(403, ['success' => false, 'error' => 'Forbidden']);
  }
}

try {
  $db = (new Database())->getConnection();

  // lê corpo JSON de forma segura
  $raw = file_get_contents('php://input');
  $payload = json_decode($raw, true);
  if (!is_array($payload)) {
    $payload = $_POST;
  }

  if ($method === 'GET') {
    // filtros opcionais
    $isActive = isset($_GET['isActive']) ? $_GET['isActive'] : null;

    $sql = "SELECT id, name, description, duration, price, is_active, created_at, updated_at
            FROM services";
    $params = [];
    if ($isActive !== null && $isActive !== '') {
      $sql .= " WHERE is_active = ?";
      $params[] = (intval($isActive) ? 1 : 0);
    }
    $sql .= " ORDER BY name ASC";

    $st = $db->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    // normalizações
    foreach ($rows as &$r) {
      if (isset($r['duration'])) {
        $r['duration'] = (int)$r['duration'];
      }
      if (isset($r['price']) && $r['price'] !== null) {
        $r['price'] = (float)$r['price'];
      }
      $r['is_active'] = isset($r['is_active']) ? (bool)intval($r['is_active']) : true;
    }

    json_end(200, ['success' => true, 'data' => $rows]);
  }

  if ($method === 'POST') {
    $name        = isset($payload['name']) ? trim($payload['name']) : '';
    $duration    = isset($payload['duration']) ? (int)$payload['duration'] : null;
    $description = isset($payload['description']) ? trim($payload['description']) : null;
    $price       = (isset($payload['price']) && $payload['price'] !== '') ? (float)$payload['price'] : null;
    $isActive    = isset($payload['isActive']) ? (intval($payload['isActive']) ? 1 : 0) : 1;

    if ($name === '' || !$duration) {
      json_end(422, ['success' => false, 'error' => 'Name and duration are required']);
    }

    if (!function_exists('newId')) {
      function newId() { return bin2hex(random_bytes(16)); }
    }
    $id = newId();

    $st = $db->prepare("INSERT INTO services (id, name, description, duration, price, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $st->execute([$id, $name, $description, $duration, $price, $isActive]);

    json_end(201, [
      'success' => true,
      'data' => [
        'id' => $id,
        'name' => $name,
        'description' => $description,
        'duration' => $duration,
        'price' => $price,
        'is_active' => (bool)$isActive
      ]
    ]);
  }

  if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($payload['id']) ? trim($payload['id']) : '';
    if ($id === '') {
      json_end(422, ['success' => false, 'error' => 'Service id is required']);
    }

    $fields = [];
    $values = [];

    if (array_key_exists('name', $payload))        { $fields[] = 'name = ?';        $values[] = trim((string)$payload['name']); }
    if (array_key_exists('description', $payload)) { $fields[] = 'description = ?'; $values[] = ($payload['description'] !== null ? trim((string)$payload['description']) : null); }
    if (array_key_exists('duration', $payload))    { $fields[] = 'duration = ?';    $values[] = ($payload['duration'] !== null ? (int)$payload['duration'] : null); }
    if (array_key_exists('price', $payload))       { $fields[] = 'price = ?';       $values[] = ($payload['price'] !== null && $payload['price'] !== '' ? (float)$payload['price'] : null); }
    if (array_key_exists('isActive', $payload))    { $fields[] = 'is_active = ?';   $values[] = (intval($payload['isActive']) ? 1 : 0); }

    if (!$fields) {
      json_end(400, ['success' => false, 'error' => 'No fields to update']);
    }

    $fields[] = 'updated_at = NOW()';
    $values[] = $id;

    $st = $db->prepare('UPDATE services SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $st->execute($values);

    json_end(200, ['success' => true, 'data' => ['id' => $id]]);
  }

  if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($payload['id']) ? trim($payload['id']) : '');
    if ($id === '') {
      json_end(422, ['success' => false, 'error' => 'Service id is required']);
    }

    $st = $db->prepare('DELETE FROM services WHERE id = ?');
    $st->execute([$id]);

    json_end(200, ['success' => true, 'data' => ['id' => $id]]);
  }

  json_end(405, ['success' => false, 'error' => 'Unsupported method']);
} catch (Throwable $e) {
  error_log("services/index error: " . $e->getMessage());
  json_end(500, ['success' => false, 'error' => 'Internal server error']);
}
