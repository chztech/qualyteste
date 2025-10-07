<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if ($auth['role'] !== 'admin') {
  jsonResponse(false, null, 403, 'Forbidden');
}

$db = (new Database())->getConnection();

$stmt = $db->query('SELECT data FROM system_settings WHERE id = 1 LIMIT 1');
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$settings = $row ? json_decode($row['data'], true) : [];

jsonResponse(true, ['settings' => $settings]);
