<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
$database = new Database();
$db = $database->getConnection();

$companyIdFromToken = null;
if (isset($auth['company_id']) && $auth['company_id']) {
    $companyIdFromToken = $auth['company_id'];
}

if ($companyIdFromToken === null && $auth['role'] === 'company') {
    try {
        $stmt = $db->prepare('SELECT company_id FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$auth['user_id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && $row['company_id']) {
            $companyIdFromToken = $row['company_id'];
        }
    } catch (Exception $exception) {
        jsonResponse(false, null, 500, 'Failed to resolve company context');
    }
}

try {
    $query = 'SELECT id, name, address, phone, email, public_token, created_at, updated_at FROM companies';
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

    $employeeStmt = null;
    $includeEmployees = true;
    $companiesWithEmployees = [];

    foreach ($companies as $company) {
        $employees = [];
        if ($includeEmployees) {
            try {
                if ($employeeStmt === null) {
                    $employeeStmt = $db->prepare('SELECT id, name, phone, department, company_id, created_at, updated_at FROM company_employees WHERE company_id = ? ORDER BY name ASC');
                }
                $employeeStmt->execute([$company['id']]);
                $employees = $employeeStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $exception) {
                if ($exception->getCode() === '42S02') {
                    $includeEmployees = false;
                } else {
                    throw $exception;
                }
            }
        }

        $companiesWithEmployees[] = [
            'id' => $company['id'],
            'name' => $company['name'],
            'address' => $company['address'],
            'phone' => $company['phone'],
            'email' => $company['email'],
            'publicToken' => $company['public_token'],
            'createdAt' => $company['created_at'],
            'updatedAt' => $company['updated_at'],
            'employees' => $employees
        ];
    }

    jsonResponse(true, $companiesWithEmployees);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Database error: ' . $exception->getMessage());
}
