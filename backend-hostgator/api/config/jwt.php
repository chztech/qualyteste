<?php
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'TroqueEstaChavePorUmaMuitoForte!');
define('JWT_EXPIRE_SECONDS', getenv('JWT_EXPIRE_SECONDS') ? intval(getenv('JWT_EXPIRE_SECONDS')) : (24 * 60 * 60));

function jwt_sign($payloadArray) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payloadArray);
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

function jwt_verify($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
        base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true))
    );
    if (!hash_equals($expectedSignature, $parts[2])) return false;
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
    if (!$payload) return false;
    if (isset($payload['exp']) && $payload['exp'] < time()) return false;
    return $payload;
}
?>