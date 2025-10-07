<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';

try {
  $db = (new Database())->getConnection();
  $ok = $db ? true : false;
  json_end(200, ['success' => $ok, 'driver' => 'mysql', 'message' => $ok ? 'DB OK' : 'DB fail']);
} catch (Throwable $e) {
  json_end(500, ['success' => false, 'error' => 'DB connect failed']); // detalhe no log
}
