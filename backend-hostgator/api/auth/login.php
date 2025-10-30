<?php
// === NÃO COLOQUE NADA ANTES DESTA LINHA (nem espaço, nem BOM) ===
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Iniciar buffering o mais cedo possível para capturar qualquer saída indevida
if (ob_get_level() === 0) { ob_start(); }

session_start();
if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = 0;
}
if ($_SESSION['login_attempts'] > 5) {
    // Limpa qualquer lixo antes de responder
    if (ob_get_length() !== false) { ob_clean(); }
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many login attempts. Try again later.']);
    exit;
}
require_once dirname(__DIR__) . '/bootstrap.php';
require_once dirname(__DIR__) . '/config/cors.php';
require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/jwt.php';

// Garante o Content-Type (caso cors.php não tenha definido)
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Limpa e responde vazio para o preflight
    if (ob_get_length() !== false) { ob_clean(); }
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (ob_get_length() !== false) { ob_clean(); }
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? (string) $data['password'] : '';

if ($email === '' || $password === '') {
    if (ob_get_length() !== false) { ob_clean(); }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password required']);
    exit;
}

try {
    $stmt = $db->prepare('SELECT id, name, email, password_hash, role, company_id, is_active FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['is_active'] || !password_verify($password, $user['password_hash'])) {
        $_SESSION['login_attempts']++;
        if (ob_get_length() !== false) { ob_clean(); }
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        exit;
    }

    $_SESSION['login_attempts'] = 0;

    $payload = [
        'user_id'    => $user['id'],
        'role'       => $user['role'],
        'company_id' => $user['company_id'],
        'exp'        => time() + (defined('JWT_EXPIRE_SECONDS') ? JWT_EXPIRE_SECONDS : 3600)
    ];
    $token = jwt_sign($payload);

    // Antes de enviar: limpa qualquer byte que tenha vazado
    if (ob_get_length() !== false) { ob_clean(); }
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'user' => [
                'id'        => $user['id'],
                'name'      => $user['name'],
                'email'     => $user['email'],
                'role'      => $user['role'],
                'companyId' => $user['company_id']
            ],
            'token' => $token
        ]
    ]);
    exit;
} catch (Throwable $e) {
    if (ob_get_length() !== false) { ob_clean(); }
    http_response_code(500);
    error_log('Auth login fatal: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'debug' => $e->getMessage()
    ]);
    exit;
}
