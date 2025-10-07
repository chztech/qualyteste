<?php
// backend-hostgator/api/companies/index.php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_end(405, ['success' => false, 'error' => 'Method not allowed']);
}

try {
    $db = (new Database())->getConnection();

    // --- Autenticação opcional via Bearer token ---
    $payload = null;
    $token = getBearerToken();
    if ($token) {
        $payload = jwt_verify($token); // retorna array ou false
        if ($payload === false) {
            // Token inválido => trata como não autenticado (público)
            $payload = null;
        }
    }

    // companyId do token (se houver)
    $companyIdFromToken = null;
    if (is_array($payload) && !empty($payload['company_id'])) {
        $companyIdFromToken = $payload['company_id'];
    } elseif (is_array($payload) && ($payload['role'] ?? null) === 'company') {
        // fallback: buscar no users.company_id
        $stmt = $db->prepare('SELECT company_id FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$payload['user_id'] ?? null]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && $row['company_id']) {
            $companyIdFromToken = $row['company_id'];
        }
    }

    // --- Monta query base ---
    $query = 'SELECT id, name, address, phone, email, public_token, is_active, settings, created_at, updated_at FROM companies';
    $params = [];
    $where  = [];

    // Filtro por id específico (querystring)
    if (!empty($_GET['id'])) {
        $where[] = 'id = ?';
        $params[] = $_GET['id'];
    }

    // Se veio empresa no token, restringe a ela
    if ($companyIdFromToken) {
        $where[] = 'id = ?';
        $params[] = $companyIdFromToken;
    }

    // Somente ativas para contexto público
    $where[] = 'is_active = 1';

    if ($where) {
        $query .= ' WHERE ' . implode(' AND ', $where);
    }
    $query .= ' ORDER BY name ASC';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Incluir employees se a tabela existir
    $includeEmployees = true;
    $employeeStmt = null;
    $out = [];

    foreach ($companies as $c) {
        // Decodifica settings JSON (se existir)
        if (isset($c['settings']) && $c['settings'] !== '' && $c['settings'] !== null) {
            $dec = json_decode($c['settings'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $c['settings'] = $dec;
            } else {
                $c['settings'] = null;
            }
        } else {
            $c['settings'] = null;
        }

        // Employees
        $employees = [];
        if ($includeEmployees) {
            try {
                if ($employeeStmt === null) {
                    $employeeStmt = $db->prepare('SELECT id, name, phone, department, company_id, created_at, updated_at FROM company_employees WHERE company_id = ? ORDER BY name ASC');
                }
                $employeeStmt->execute([$c['id']]);
                $employees = $employeeStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                // Tabela não existe => ignora de forma silenciosa
                if ($e->getCode() === '42S02') { // Base table or view not found
                    $includeEmployees = false;
                    $employees = []; // não inclui mais
                } else {
                    throw $e; // outro erro real
                }
            }
        }

        $out[] = [
            'id'          => $c['id'],
            'name'        => $c['name'],
            'address'     => $c['address'],
            'phone'       => $c['phone'],
            'email'       => $c['email'],
