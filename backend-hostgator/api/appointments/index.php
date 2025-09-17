```php
<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// Função para verificar JWT
function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
    $signature = $parts[2];
    
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
        base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], 'sua_chave_secreta_jwt', true))
    );
    
    if ($signature !== $expectedSignature) return false;
    
    $payloadData = json_decode($payload, true);
    if ($payloadData['exp'] < time()) return false;
    
    return $payloadData;
}

// Verificar autenticação
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(array("success" => false, "error" => "Token required"));
    exit();
}

$user = verifyJWT($matches[1]);
if (!$user) {
    http_response_code(401);
    echo json_encode(array("success" => false, "error" => "Invalid token"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "
            SELECT a.*, u.name as client_name, p.name as provider_name, 
                   c.name as company_name, e.name as employee_name, s.name as service_name
            FROM appointments a
            LEFT JOIN users u ON a.client_id = u.id
            LEFT JOIN providers p ON a.provider_id = p.id
            LEFT JOIN companies c ON a.company_id = c.id
            LEFT JOIN employees e ON a.employee_id = e.id
            LEFT JOIN services s ON a.service_id = s.id
        ";
        
        $params = [];
        
        // Filtros baseados no role
        if ($user['role'] === 'company') {
            $query .= " WHERE a.company_id = ?";
            $params[] = $user['company_id'];
        } elseif ($user['role'] === 'provider') {
            $query .= " WHERE a.provider_id = (SELECT id FROM providers WHERE user_id = ?)";
            $params[] = $user['user_id'];
        }
        
        $query .= " ORDER BY a.date DESC, a.start_time DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll();
        
        echo json_encode(array("success" => true, "data" => $appointments));
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "error" => "Internal server error"));
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    try {
        $id = bin2hex(random_bytes(16)); // Gerar UUID simples
        
        $query = "INSERT INTO appointments (id, client_id, provider_id, company_id, employee_id, service_id, date, start_time, end_time, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            $id,
            $data->clientId,
            $data->providerId,
            $data->companyId,
            $data->employeeId,
            $data->serviceId,
            $data->date,
            $data->startTime,
            $data->endTime,
            $data->duration,
            $data->notes
        ]);
        
        echo json_encode(array("success" => true, "data" => array("id" => $id)));
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "error" => "Internal server error"));
    }
}
?>
```