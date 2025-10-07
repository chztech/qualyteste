<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if (!in_array($auth['role'], ['admin'])) {
  jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$appName       = isset($data['appName']) ? trim($data['appName']) : null;
$appDesc       = isset($data['appDescription']) ? trim($data['appDescription']) : null;
$logoUrl       = isset($data['logoUrl']) ? trim($data['logoUrl']) : null;
$faviconUrl    = isset($data['faviconUrl']) ? trim($data['faviconUrl']) : null;
$colors        = isset($data['colors']) ? $data['colors'] : null;
$login         = isset($data['login'])  ? $data['login']  : null;
$public        = isset($data['public']) ? $data['public'] : null;

try {
  // garante existência de 1 linha
  $stmt = $db->query('SELECT id FROM branding_settings LIMIT 1');
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row) {
    $id = newId();
    $ins = $db->prepare('INSERT INTO branding_settings (id, app_name, app_desc, updated_at) VALUES (?, NULL, NULL, NOW())');
    $ins->execute([$id]);
  }

  $fields = [];
  $params = [];

  if ($appName !== null)   { $fields[] = 'app_name = ?';   $params[] = $appName; }
  if ($appDesc !== null)   { $fields[] = 'app_desc = ?';   $params[] = $appDesc; }
  if ($logoUrl !== null)   { $fields[] = 'logo_url = ?';   $params[] = $logoUrl; }
  if ($faviconUrl !== null){ $fields[] = 'favicon_url = ?';$params[] = $faviconUrl; }
  if ($colors !== null)    { $fields[] = 'colors_json = ?';$params[] = json_encode($colors, JSON_UNESCAPED_UNICODE); }
  if ($login !== null)     { $fields[] = 'login_json = ?'; $params[] = json_encode($login, JSON_UNESCAPED_UNICODE); }
  if ($public !== null)    { $fields[] = 'public_json = ?';$params[] = json_encode($public, JSON_UNESCAPED_UNICODE); }

  if (!$fields) {
    jsonResponse(false, null, 400, 'No fields to update');
  }

  $sql = 'UPDATE branding_settings SET ' . implode(', ', $fields) . ', updated_at = NOW() LIMIT 1';
  $upd = $db->prepare($sql);
  $upd->execute($params);

  jsonResponse(true, ['message' => 'Branding updated']);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
