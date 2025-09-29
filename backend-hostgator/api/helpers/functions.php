<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

function jsonResponse($success, $data = null, $status = 200, $error = null) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $payload = ['success' => $success];
    if ($success && $data !== null) $payload['data'] = $data;
    if (!$success && $error !== null) $payload['error'] = $error;
    echo json_encode($payload);
    exit();
}

function getBearerToken() {
    $headers = function_exists('getallheaders') ? getallheaders() : $_SERVER;
    $authHeader = '';
    if (isset($headers['Authorization'])) $authHeader = $headers['Authorization'];
    elseif (isset($headers['authorization'])) $authHeader = $headers['authorization'];
    if (!$authHeader) return null;
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) return $matches[1];
    return null;
}

function requireAuth() {
    $token = getBearerToken();
    if (!$token) jsonResponse(false, null, 401, 'Token required');
    $payload = jwt_verify($token);
    if (!$payload) jsonResponse(false, null, 401, 'Invalid token');
    return $payload;
}

function newId() {
    return bin2hex(random_bytes(16));
}
?>