<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/cors.php';
json_end(200, ['success' => true, 'message' => 'pong']);
