<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

// Pré-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$database = new Database();
$db = $database->getConnection();

try {
  // Busca a configuração mais recente de cada contexto
  $sql = "
    SELECT b.*
    FROM branding b
    INNER JOIN (
      SELECT context, MAX(updated_at) AS max_updated
      FROM branding
      GROUP BY context
    ) t ON t.context = b.context AND t.max_updated = b.updated_at
  ";
  $stmt = $db->query($sql);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Normaliza em objeto { login: {...}, public: {...} }
  $result = [
    'login'  => null,
    'public' => null,
  ];

  foreach ($rows as $r) {
    $item = [
      'id'             => $r['id'],
      'context'        => $r['context'],
      'imageUrl'       => $r['image_url'],
      'width'          => (int)$r['width'],
      'height'         => (int)$r['height'],
      'backgroundColor'=> $r['background_color'],
      'borderRadius'   => $r['border_radius'],
      'padding'        => $r['padding'],
      'showBackground' => (bool)$r['show_background'],
      'createdAt'      => $r['created_at'],
      'updatedAt'      => $r['updated_at'],
    ];
    if ($r['context'] === 'login') {
      $result['login'] = $item;
    } elseif ($r['context'] === 'public') {
      $result['public'] = $item;
    }
  }

  // fallback simples se não houver nenhum registro ainda
  if (!$result['login']) {
    $result['login'] = [
      'id' => null,
      'context' => 'login',
      'imageUrl' => '',
      'width' => 160,
      'height' => 80,
      'backgroundColor' => 'transparent',
      'borderRadius' => 'rounded-none',
      'padding' => 'p-0',
      'showBackground' => false,
      'createdAt' => null,
      'updatedAt' => null,
    ];
  }
  if (!$result['public']) {
    $result['public'] = [
      'id' => null,
      'context' => 'public',
      'imageUrl' => '',
      'width' => 160,
      'height' => 80,
      'backgroundColor' => 'transparent',
      'borderRadius' => 'rounded-none',
      'padding' => 'p-0',
      'showBackground' => false,
      'createdAt' => null,
      'updatedAt' => null,
    ];
  }

  jsonResponse(true, $result);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
