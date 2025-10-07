<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if (!in_array($auth['role'], ['admin'])) {
  jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

$login  = isset($data['login'])  && is_array($data['login'])  ? $data['login']  : null;
$public = isset($data['public']) && is_array($data['public']) ? $data['public'] : null;

// Normaliza payload (aplica default e força context correto)
function norm($ctx, $src) {
  $def = [
    'context'        => $ctx,
    'imageUrl'       => '',
    'width'          => 160,
    'height'         => 80,
    'backgroundColor'=> 'transparent',
    'borderRadius'   => 'rounded-none',
    'padding'        => 'p-0',
    'showBackground' => false,
  ];
  if (!$src) return $def;
  return [
    'context'        => $ctx,
    'imageUrl'       => isset($src['imageUrl']) ? (string)$src['imageUrl'] : $def['imageUrl'],
    'width'          => isset($src['width']) ? (int)$src['width'] : $def['width'],
    'height'         => isset($src['height']) ? (int)$src['height'] : $def['height'],
    'backgroundColor'=> isset($src['backgroundColor']) ? (string)$src['backgroundColor'] : $def['backgroundColor'],
    'borderRadius'   => isset($src['borderRadius']) ? (string)$src['borderRadius'] : $def['borderRadius'],
    'padding'        => isset($src['padding']) ? (string)$src['padding'] : $def['padding'],
    'showBackground' => isset($src['showBackground']) ? (bool)$src['showBackground'] : $def['showBackground'],
  ];
}

$login  = norm('login',  $login);
$public = norm('public', $public);

try {
  $db->beginTransaction();

  // UPSERT por contexto
  $upsert = function(PDO $db, array $cfg) {
    // existe?
    $sel = $db->prepare('SELECT id FROM branding WHERE context = ? ORDER BY updated_at DESC LIMIT 1');
    $sel->execute([$cfg['context']]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);

    if ($row) {
      // UPDATE
      $stmt = $db->prepare('
        UPDATE branding
           SET image_url = ?, width = ?, height = ?, background_color = ?,
               border_radius = ?, padding = ?, show_background = ?, updated_at = NOW()
         WHERE id = ?
      ');
      $stmt->execute([
        $cfg['imageUrl'],
        $cfg['width'],
        $cfg['height'],
        $cfg['backgroundColor'],
        $cfg['borderRadius'],
        $cfg['padding'],
        $cfg['showBackground'] ? 1 : 0,
        $row['id'],
      ]);
      $id = $row['id'];
    } else {
      // INSERT
      $id = newId();
      $stmt = $db->prepare('
        INSERT INTO branding
           (id, context, image_url, width, height, background_color, border_radius, padding, show_background, created_at, updated_at)
        VALUES (?,  ?,       ?,         ?,    ?,     ?,                ?,             ?,       ?,               NOW(),     NOW())
      ');
      $stmt->execute([
        $id,
        $cfg['context'],
        $cfg['imageUrl'],
        $cfg['width'],
        $cfg['height'],
        $cfg['backgroundColor'],
        $cfg['borderRadius'],
        $cfg['padding'],
        $cfg['showBackground'] ? 1 : 0,
      ]);
    }

    // devolve objeto formatado
    $out = [
      'id'             => $id,
      'context'        => $cfg['context'],
      'imageUrl'       => $cfg['imageUrl'],
      'width'          => (int)$cfg['width'],
      'height'         => (int)$cfg['height'],
      'backgroundColor'=> $cfg['backgroundColor'],
      'borderRadius'   => $cfg['borderRadius'],
      'padding'        => $cfg['padding'],
      'showBackground' => (bool)$cfg['showBackground'],
    ];
    return $out;
  };

  $savedLogin  = $upsert($db, $login);
  $savedPublic = $upsert($db, $public);

  $db->commit();

  jsonResponse(true, [
    'login'  => $savedLogin,
    'public' => $savedPublic,
  ], 200, 'Branding saved');
} catch (PDOException $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
