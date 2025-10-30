<?php

$secret = getenv('JWT_SECRET');
if (!$secret) {
    throw new RuntimeException('JWT secret is not configured. Set JWT_SECRET environment variable.');
}

define('JWT_SECRET', $secret);
define('JWT_EXPIRE_SECONDS', getenv('JWT_EXPIRE_SECONDS') ? intval(getenv('JWT_EXPIRE_SECONDS')) : (24 * 60 * 60));

function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data)
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_sign($payloadArray) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payloadArray);
    $base64Header = base64url_encode($header);
    $base64Payload = base64url_encode($payload);
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    $base64Signature = base64url_encode($signature);
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

function jwt_verify($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

    $expectedSignature = base64url_encode(hash_hmac('sha256', $encodedHeader . "." . $encodedPayload, JWT_SECRET, true));

    if (!hash_equals($expectedSignature, $encodedSignature)) {
        return false;
    }

    $payload = json_decode(base64url_decode($encodedPayload), true);
    if (!$payload) return false;

    if (isset($payload['exp']) && $payload['exp'] < time()) return false;
    return $payload;
}

?>
