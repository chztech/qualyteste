<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

$method = $_SERVER['REQUEST_METHOD'];

// Preflight CORS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Aceita PUT (e POST opcionalmente)
if (!in_array($method, ['PUT', 'POST'], true)) {
    jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
// Se quiser travar para admins apenas, descomente:
// if (!isset($auth['role']) || $auth['role'] !== 'admin') {
//     jsonResponse(false, null, 403, 'Forbidden');
// }

$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$companyId = isset($payload['companyId']) ? trim($payload['companyId']) : '';
$password = isset($payload['password']) ? (string)$payload['password'] : '';

if ($companyId === '' || $password === '') {
    jsonResponse(false, null, 422, 'Company id and password are required');
}

try {
    // Confere se a empresa existe e pega o e-mail cadastrado
    $cStmt = $db->prepare('SELECT id, name, email, phone FROM companies WHERE id = ? LIMIT 1');
    $cStmt->execute([$companyId]);
    $company = $cStmt->fetch(PDO::FETCH_ASSOC);
    if (!$company) {
        jsonResponse(false, null, 404, 'Company not found');
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    // 1) Tenta atualizar pelo company_id
    $uStmt = $db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW()
                           WHERE role = "company" AND company_id = ?');
    $uStmt->execute([$passwordHash, $companyId]);

    // 2) Se não atualizou ninguém, tenta pelo e-mail da empresa
    if ($uStmt->rowCount() === 0 && !empty($company['email'])) {
        $uStmt2 = $db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW()
                                WHERE role = "company" AND email = ?');
        $uStmt2->execute([$passwordHash, $company['email']]);

        // 3) Se ainda não existe usuário da empresa, cria um agora
        if ($uStmt2->rowCount() === 0) {
            $userId = newId();
            $ins = $db->prepare('INSERT INTO users
                (id, name, email, phone, role, company_id, password_hash, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, "company", ?, ?, 1, NOW(), NOW())');

            $ins->execute([
                $userId,
                $company['name'] ?: 'Empresa',
                $company['email'],
                $company['phone'],
                $companyId,
                $passwordHash
            ]);
        }
    }

    jsonResponse(true, ['companyId' => $companyId, 'message' => 'Password updated']);
} catch (PDOException $e) {
    jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
