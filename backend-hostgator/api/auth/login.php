
session_start();
if (!isset($_SESSION['login_attempts'])) { $_SESSION['login_attempts'] = 0; }
if ($_SESSION['login_attempts'] > 5) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many login attempts. Try again later.']);
    exit();
}

<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
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
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password required']);
    exit();
}

try {
    $query = 'SELECT id, name, email, password_hash, role, company_id, is_active FROM users WHERE email = ? LIMIT 1';
    $stmt = $db->prepare($query);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['is_active']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        exit();
    }

    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        exit();
    }

    $payload = [
        'user_id' => $user['id'],
        'role' => $user['role'],
        'company_id' => $user['company_id'],
        'exp' => time() + JWT_EXPIRE_SECONDS
    ];

    $token = jwt_sign($payload);

    echo json_encode([
        'success' => true,
        'data' => [
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'companyId' => $user['company_id']
            ],
            'token' => $token
        ]
    ]);
} catch (Exception $exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
