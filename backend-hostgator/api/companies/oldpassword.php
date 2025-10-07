<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// Apenas PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
    exit();
}

// Verificar autenticação
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Token required"]);
    exit();
}

require_once '../auth/verify_jwt.php';
$user = verifyJWT($matches[1]);
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "Permission denied"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->companyId) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Company ID and password required"]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Atualizar senha do usuário vinculado à empresa
    $passwordHash = password_hash($data->password, PASSWORD_BCRYPT);

    $query = "UPDATE users SET password_hash = ? WHERE company_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$passwordHash, $data->companyId]);

    echo json_encode(["success" => true, "message" => "Senha alterada com sucesso"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Internal server error"]);
}
?>
