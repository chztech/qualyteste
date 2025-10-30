<?php
$defaultAllowed = [
    'https://qualycorpore.netlify.app',
    'https://qualycorpore.chztech.com.br', // <-- ADICIONE ESTA
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

$allowedEnv = getenv('ALLOWED_ORIGINS');
$allowedList = $defaultAllowed;

if ($allowedEnv !== false && trim($allowedEnv) !== '') {
    foreach (explode(',', $allowedEnv) as $item) {
        $item = trim($item);
        if ($item !== '') {
            $allowedList[] = $item;
        }
    }
}

$normalizedToOriginal = [];
foreach ($allowedList as $item) {
    $normalized = rtrim($item, '/');
    if (!isset($normalizedToOriginal[$normalized])) {
        $normalizedToOriginal[$normalized] = $item;
    }
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$normalizedOrigin = rtrim($origin, '/');

if ($origin && $normalizedOrigin !== '' && isset($normalizedToOriginal[$normalizedOrigin])) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    $firstAllowed = reset($normalizedToOriginal) ?: 'https://qualycorpore.netlify.app';
    header("Access-Control-Allow-Origin: $firstAllowed");
}

header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
