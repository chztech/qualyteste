<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

// Trata preflight de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

// Autorização: somente admin cria usuários
$auth = requireAuth();
if (!in_array($auth['role'], ['admin'])) {
    jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

// Lê JSON puro ou $_POST
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$name      = isset($data['name'])      ? trim($data['name'])      : '';
$email     = isset($data['email'])     ? trim($data['email'])     : '';
$role      = isset($data['role'])      ? trim($data['role'])      : '';
$phone     = isset($data['phone'])     ? trim($data['phone'])     : null;
$companyId = isset($data['companyId']) ? trim($data['companyId']) : null;
$password  = isset($data['password'])  ? (string)$data['password'] : null;
$isActive  = isset($data['isActive'])  ? (bool)$data['isActive']   : true;

if ($name === '' || $email === '' || $role === '') {
    jsonResponse(false, null, 422, 'Name, email and role are required');
}

// (Opcional) valida roles aceitos
$allowedRoles = ['admin','company','provider','client'];
if (!in_array($role, $allowedRoles, true)) {
    jsonResponse(false, null, 422, 'Invalid role');
}

// Company user deve vir com companyId
if ($role === 'company' && (!$companyId || $companyId === '')) {
    jsonResponse(false, null, 422, 'companyId is required for company role');
}

try {
    // E-mail único
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
        jsonResponse(false, null, 409, 'Email already registered');
    }

    // Gera senha se não enviada
    if ($password === null || $password === '') {
        $password = bin2hex(random_bytes(6));
    }
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $userId = newId();

    $stmt = $db->prepare('
        INSERT INTO users (id, name, email, phone, role, company_id, password_hash, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    $stmt->execute([
        $userId,
        $name,
        $email,
        $phone,
        $role,
        $companyId,
        $passwordHash,
        $isActive ? 1 : 0
    ]);

    // Retorna nos campos que o front espera (sem expor hash)
    jsonResponse(true, [
        'id'                => $userId,
        'name'              => $name,
        'email'             => $email,
        'phone'             => $phone,
        'role'              => $role,
        'companyId'         => $companyId,
        'isActive'          => (bool)$isActive,
        // útil quando o admin cria e precisa repassar a senha
        'temporaryPassword' => $password
    ], 201);

} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Failed to create user: ' . $exception->getMessage());
}
