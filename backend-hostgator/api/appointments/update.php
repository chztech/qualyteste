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

$id = isset($data['id']) ? trim($data['id']) : '';
if ($id === '') {
    jsonResponse(false, null, 422, 'Appointment id is required');
}

try {
    $fields = [];
    $values = [];

    $map = [
        'date' => 'date',
        'startTime' => 'start_time',
        'endTime' => 'end_time',
        'status' => 'status',
        'notes' => 'notes',
        'companyId' => 'company_id',
        'providerId' => 'provider_id',
        'employeeId' => 'employee_id',
        'serviceId' => 'service_id',
        'clientId' => 'client_id'
    ];

    foreach ($map as $inputKey => $column) {
        if (isset($data[$inputKey])) {
            $value = is_string($data[$inputKey]) ? trim($data[$inputKey]) : $data[$inputKey];
            $fields[] = $column . ' = ?';
            $values[] = $value === '' ? null : $value;
        }
    }

    if (isset($data['duration'])) {
        $fields[] = 'duration = ?';
        $values[] = (int) $data['duration'];
    }

    if (!$fields) {
        jsonResponse(false, null, 400, 'No updatable fields provided');
    }

    $fields[] = 'updated_at = NOW()';
    $values[] = $id;

    $stmt = $db->prepare('UPDATE appointments SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    jsonResponse(true, ['id' => $id]);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Failed to update appointment: ' . $exception->getMessage());
}
