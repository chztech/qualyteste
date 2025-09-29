<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

requireAuth();
$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$address = isset($data['address']) ? trim($data['address']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$notes = isset($data['notes']) ? trim($data['notes']) : null;
$employeesPayload = isset($data['employees']) && is_array($data['employees']) ? $data['employees'] : [];

if ($name === '') {
    jsonResponse(false, null, 422, 'Name is required');
}

try {
    $columns = [];
    $columnStmt = $db->query('SHOW COLUMNS FROM companies');
    foreach ($columnStmt as $column) {
        $columns[$column['Field']] = true;
    }

    $companyId = newId();
    $publicToken = isset($data['publicToken']) ? trim($data['publicToken']) : rtrim(strtr(base64_encode($companyId), '+/', '-_'), '=');

    $fields = ['id', 'name'];
    $placeholders = ['?', '?'];
    $values = [$companyId, $name];

    if (isset($columns['address'])) {
        $fields[] = 'address';
        $placeholders[] = '?';
        $values[] = $address;
    }

    if (isset($columns['phone'])) {
        $fields[] = 'phone';
        $placeholders[] = '?';
        $values[] = $phone;
    }

    if (isset($columns['email'])) {
        $fields[] = 'email';
        $placeholders[] = '?';
        $values[] = $email;
    }

    if (isset($columns['notes'])) {
        $fields[] = 'notes';
        $placeholders[] = '?';
        $values[] = $notes;
    }

    if (isset($columns['public_token'])) {
        $fields[] = 'public_token';
        $placeholders[] = '?';
        $values[] = $publicToken;
    }

    if (isset($columns['created_at'])) {
        $fields[] = 'created_at';
        $placeholders[] = 'NOW()';
    }

    if (isset($columns['updated_at'])) {
        $fields[] = 'updated_at';
        $placeholders[] = 'NOW()';
    }

    $insertSql = 'INSERT INTO companies (' . implode(', ', $fields) . ') VALUES (' . implode(', ', $placeholders) . ')';

    $db->beginTransaction();
    $stmt = $db->prepare($insertSql);
    $stmt->execute($values);

    $employees = [];
    try {
        $employeeColumns = [];
        $employeeColumnStmt = $db->query('SHOW COLUMNS FROM company_employees');
        foreach ($employeeColumnStmt as $column) {
            $employeeColumns[$column['Field']] = true;
        }

        $employeeInsert = $db->prepare(
            'INSERT INTO company_employees (id, company_id, name, phone, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())'
        );

        foreach ($employeesPayload as $employeeData) {
            if (!is_array($employeeData)) {
                continue;
            }
            $employeeName = isset($employeeData['name']) ? trim($employeeData['name']) : '';
            if ($employeeName === '') {
                continue;
            }
            $employeeId = newId();
            $employeePhone = isset($employeeData['phone']) ? trim($employeeData['phone']) : null;
            $department = isset($employeeData['department']) ? trim($employeeData['department']) : null;

            if (!$employeeColumns) {
                break;
            }

            $employeeInsert->execute([
                $employeeId,
                $companyId,
                $employeeName,
                $employeePhone,
                $department
            ]);

            $employees[] = [
                'id' => $employeeId,
                'name' => $employeeName,
                'phone' => $employeePhone,
                'department' => $department,
                'companyId' => $companyId
            ];
        }
    } catch (PDOException $employeeException) {
        if ($employeeException->getCode() !== '42S02') {
            throw $employeeException;
        }
    }

    $db->commit();

    jsonResponse(true, [
        'id' => $companyId,
        'name' => $name,
        'address' => $address,
        'phone' => $phone,
        'email' => $email,
        'notes' => $notes,
        'publicToken' => $publicToken,
        'employees' => $employees
    ], 201);
} catch (Exception $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse(false, null, 500, 'Failed to create company: ' . $exception->getMessage());
}
