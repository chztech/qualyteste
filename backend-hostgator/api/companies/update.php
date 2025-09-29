<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
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

$companyId = isset($data['id']) ? trim($data['id']) : '';
if ($companyId === '') {
    jsonResponse(false, null, 422, 'Company id is required');
}

try {
    $columns = [];
    $columnStmt = $db->query('SHOW COLUMNS FROM companies');
    foreach ($columnStmt as $column) {
        $columns[$column['Field']] = true;
    }

    $fields = [];
    $values = [];

    $map = [
        'name' => 'name',
        'address' => 'address',
        'phone' => 'phone',
        'email' => 'email',
        'notes' => 'notes',
        'publicToken' => 'public_token',
        'isActive' => 'is_active'
    ];

    foreach ($map as $inputKey => $columnName) {
        if (array_key_exists($inputKey, $data) && isset($columns[$columnName])) {
            $fields[] = $columnName . ' = ?';
            $value = $data[$inputKey];
            if (is_bool($value)) {
                $values[] = $value ? 1 : 0;
            } elseif ($value === null) {
                $values[] = null;
            } else {
                $values[] = trim((string) $value);
            }
        }
    }

    if (isset($columns['updated_at'])) {
        $fields[] = 'updated_at = NOW()';
    }

    if (!$fields) {
        jsonResponse(false, null, 400, 'No updatable fields provided');
    }

    $values[] = $companyId;

    $sql = 'UPDATE companies SET ' . implode(', ', $fields) . ' WHERE id = ?';

    $db->beginTransaction();
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    $employeesResult = [];
    if (isset($data['employees']) && is_array($data['employees'])) {
        try {
            $db->prepare('DELETE FROM company_employees WHERE company_id = ?')->execute([$companyId]);

            $insertEmployee = $db->prepare('INSERT INTO company_employees (id, company_id, name, phone, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
            foreach ($data['employees'] as $employeeData) {
                if (!is_array($employeeData)) {
                    continue;
                }
                $employeeName = isset($employeeData['name']) ? trim($employeeData['name']) : '';
                if ($employeeName === '') {
                    continue;
                }
                $employeeId = isset($employeeData['id']) && $employeeData['id'] !== '' ? $employeeData['id'] : newId();
                $employeePhone = isset($employeeData['phone']) ? trim($employeeData['phone']) : null;
                $department = isset($employeeData['department']) ? trim($employeeData['department']) : null;

                $insertEmployee->execute([
                    $employeeId,
                    $companyId,
                    $employeeName,
                    $employeePhone,
                    $department
                ]);

                $employeesResult[] = [
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
    }

    $db->commit();

    jsonResponse(true, [
        'id' => $companyId,
        'employees' => $employeesResult
    ]);
} catch (Exception $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse(false, null, 500, 'Failed to update company: ' . $exception->getMessage());
}
