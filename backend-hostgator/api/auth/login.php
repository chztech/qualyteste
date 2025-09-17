```php
<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("success" => false, "error" => "Method not allowed"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "error" => "Email and password required"));
    exit();
}

try {
    $query = "SELECT id, name, email, password_hash, role, company_id FROM users WHERE email = ? AND is_active = TRUE";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->email]);
    
    if ($stmt->rowCount() == 0) {
        http_response_code(401);
        echo json_encode(array("success" => false, "error" => "Invalid credentials"));
        exit();
    }
    
    $user = $stmt->fetch();
    
    if (!password_verify($data->password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(array("success" => false, "error" => "Invalid credentials"));
        exit();
    }
    
    // Gerar JWT (versão simplificada)
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $user['id'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60) // 24 horas
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, 'sua_chave_secreta_jwt', true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    $jwt = $base64Header . "." . $base64Payload . "." . $base64Signature;
    
    echo json_encode(array(
        "success" => true,
        "data" => array(
            "user" => array(
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $user['role'],
                "companyId" => $user['company_id']
            ),
            "token" => $jwt
        )
    ));
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "error" => "Internal server error"));
}
?>
```