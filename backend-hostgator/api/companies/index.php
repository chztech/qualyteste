<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

try {
    $db = (new Database())->getConnection();

    // Autenticação opcional via token
    $payload = null;
    $token = getBearerToken();
    if ($token) {
        $payload = jwt_verify($token);
        if ($payload === false) {
            $payload = null;
        }
    }

    $companyIdFromToken = null;
    if (is_array($payload) && !empty($payload['company_id'])) {
        $companyIdFromToken = $payload['company_id'];
    } elseif (is_array($payload) && (($payload['role'] ?? null) === 'company')) {
        $stmt = $db->prepare('SELECT company_id FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$payload['user_id'] ?? null]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && !empty($row['company_id'])) {
            $companyIdFromToken = $row['company_id'];
        }
    }

    $query = '
        SELECT
            id,
            name,
            address,
            phone,
            email,
            notes,
            public_token,
            is_active,
            settings,
            created_at,
            updated_at
        FROM companies
    ';

    $params = [];
    $where = [];

    if (!empty($_GET['id'])) {
        $where[] = 'id = ?';
        $params[] = $_GET['id'];
    }

    if ($companyIdFromToken) {
        $where[] = 'id = ?';
        $params[] = $companyIdFromToken;
    }

    $where[] = 'is_active = 1';

    if ($where) {
        $query .= ' WHERE ' . implode(' AND ', $where);
    }

    $query .= ' ORDER BY name ASC';

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $includeEmployees = true;
    $employeeStmt = null;
    $result = [];

    foreach ($companies as $company) {
        if (!empty($company['settings'])) {
            $settings = json_decode($company['settings'], true);
            $company['settings'] = json_last_error() === JSON_ERROR_NONE ? $settings : null;
        } else {
            $company['settings'] = null;
        }

        $employees = [];
        if ($includeEmployees) {
            try {
                if ($employeeStmt === null) {
                    $employeeStmt = $db->prepare('
                        SELECT id, name, phone, department, company_id, created_at, updated_at
                        FROM company_employees
                        WHERE company_id = ?
                        ORDER BY name ASC
                    ');
                }

                $employeeStmt->execute([$company['id']]);
                $employees = $employeeStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                if ($e->getCode() === '42S02') {
                    $includeEmployees = false;
                    $employees = [];
                } else {
                    throw $e;
                }
            }
        }

        $result[] = [
            'id'           => $company['id'],
            'name'         => $company['name'],
            'address'      => $company['address'],
            'phone'        => $company['phone'],
            'email'        => $company['email'],
            'notes'        => $company['notes'],
            'public_token' => $company['public_token'],
            'is_active'    => (int) $company['is_active'],
            'settings'     => $company['settings'],
            'employees'    => $employees,
            'created_at'   => $company['created_at'],
            'updated_at'   => $company['updated_at'],
        ];
    }

    jsonResponse(true, $result);
} catch (Throwable $e) {
    error_log('Companies index error: ' . $e->getMessage());
    jsonResponse(false, null, 500, 'Failed to fetch companies: ' . $e->getMessage());
}
