<?php
$allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: 'https://qualycorpore.netlify.app,http://localhost:5173')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin && in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://qualycorpore.netlify.app");
}
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    json_end(200, ['success' => true]); // usa helper do bootstrap
}
