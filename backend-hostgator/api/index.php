<?php
require_once 'config/cors.php';
require_once 'config/database.php';


$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$path = substr($uri, strlen($base));
$path = trim($path, '/');

if ($path === '' || $path === 'index.php') {
    echo json_encode(['success' => true, 'message' => 'QualyCorpore API OK']);
    exit();
}

$segments = explode('/', $path);
$target = __DIR__ . '/' . implode('/', $segments) . '.php';

if (file_exists($target)) {
    require $target;
    exit();
}

$targetIndex = __DIR__ . '/' . $segments[0] . '/index.php';
if (file_exists($targetIndex)) {
    require $targetIndex;
    exit();
}

http_response_code(404);
echo json_encode(['success' => false, 'error' => 'Not found']);
exit();
?>