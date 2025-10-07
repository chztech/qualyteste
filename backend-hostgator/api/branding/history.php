<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if (!in_array($auth['role'], ['admin'])) {
  jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

try {
  $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
  $stmt = $db->prepare('
    SELECT id, context, image_url AS imageUrl, width, height, background_color AS backgroundColor,
           border_radius AS borderRadius, padding, show_background AS showBackground,
           changed_at AS changedAt, changed_by AS changedBy
    FROM branding_history
    ORDER BY changed_at DESC
    LIMIT ?
  ');
  $stmt->bindValue(1, $limit, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  jsonResponse(true, $rows);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
