<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

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

try {
  $db->beginTransaction();

  // Apaga tudo e recria defaults (ajuste os defaults como quiser)
  $db->exec('DELETE FROM branding');

  $ins = $db->prepare('INSERT INTO branding (id, context, image_url, width, height, background_color, border_radius, padding, show_background, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)');

  $defaults = [
    'login' => [
      'image_url' => 'https://via.placeholder.com/160x60?text=Logo',
      'width' => 160, 'height' => 60,
      'background_color' => '#ffffff',
      'border_radius' => 'rounded-none',
      'padding' => 'p-0',
      'show_background' => 0,
    ],
    'public' => [
      'image_url' => 'https://via.placeholder.com/200x80?text=Logo',
      'width' => 200, 'height' => 80,
      'background_color' => '#ffffff',
      'border_radius' => 'rounded-none',
      'padding' => 'p-0',
      'show_background' => 0,
    ],
  ];

  foreach ($defaults as $ctx => $d) {
    $ins->execute([
      newId(), $ctx, $d['image_url'], $d['width'], $d['height'],
      $d['background_color'], $d['border_radius'], $d['padding'],
      $d['show_background'], $auth['id']
    ]);
  }

  $db->commit();

  jsonResponse(true, ['reset' => true], 200, 'Branding reset to default');
} catch (PDOException $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
