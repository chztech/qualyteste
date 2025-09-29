<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

$payload = requireAuth();
jsonResponse(true, ['user' => $payload]);
?>