<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$auth = requireAuth();
$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    $payload = $_POST;
}

try {
    if ($method === 'GET') {
        $filters = [];
        $params = [];

        if (!empty($_GET['companyId'])) {
            $filters[] = 'a.company_id = ?';
            $params[] = $_GET['companyId'];
        }

        if (!empty($_GET['providerId'])) {
            $filters[] = 'a.provider_id = ?';
            $params[] = $_GET['providerId'];
        }

        if (!empty($_GET['status'])) {
            $filters[] = 'a.status = ?';
            $params[] = $_GET['status'];
        }

        if (!empty($_GET['dateStart'])) {
            $filters[] = 'a.date >= ?';
            $params[] = $_GET['dateStart'];
        }

        if (!empty($_GET['dateEnd'])) {
            $filters[] = 'a.date <= ?';
            $params[] = $_GET['dateEnd'];
        }

        if ($auth['role'] === 'company') {
            $filters[] = 'a.company_id = ?';
            $params[] = $auth['company_id'];
        }

        if ($auth['role'] === 'provider') {
            $filters[] = 'a.provider_id = (SELECT id FROM providers WHERE user_id = ? LIMIT 1)';
            $params[] = $auth['user_id'];
        }

        $query = 'SELECT a.*, ' .
            'c.name AS company_name, ' .
            'p.name AS provider_name, ' .
            's.name AS service_name, ' .
            'emp.name AS employee_name ' .
            'FROM appointments a ' .
            'LEFT JOIN companies c ON a.company_id = c.id ' .
            'LEFT JOIN providers p ON a.provider_id = p.id ' .
            'LEFT JOIN services s ON a.service_id = s.id ' .
            'LEFT JOIN company_employees emp ON a.employee_id = emp.id';

        if ($filters) {
            $query .= ' WHERE ' . implode(' AND ', $filters);
        }

        $query .= ' ORDER BY a.date DESC, a.start_time DESC';

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $appointments);
    }

    if ($method === 'POST') {
        $date = isset($payload['date']) ? trim($payload['date']) : '';
        $startTime = isset($payload['startTime']) ? trim($payload['startTime']) : '';
        $endTime = isset($payload['endTime']) ? trim($payload['endTime']) : '';
        $duration = isset($payload['duration']) ? (int) $payload['duration'] : null;
        $companyId = isset($payload['companyId']) ? trim($payload['companyId']) : null;
        $providerId = isset($payload['providerId']) ? trim($payload['providerId']) : null;
        $serviceId = isset($payload['serviceId']) ? trim($payload['serviceId']) : null;
        $employeeId = isset($payload['employeeId']) ? trim($payload['employeeId']) : null;
        $clientId = isset($payload['clientId']) ? trim($payload['clientId']) : null;
        $status = isset($payload['status']) ? trim($payload['status']) : 'scheduled';
        $notes = isset($payload['notes']) ? trim($payload['notes']) : null;

        if ($date === '' || $startTime === '' || !$duration) {
            jsonResponse(false, null, 422, 'Date, startTime and duration are required');
        }

        if ($endTime === '' && $duration) {
            $startParts = explode(':', $startTime);
            $minutes = ((int) $startParts[0]) * 60 + ((int) $startParts[1]) + $duration;
            $endHour = floor($minutes / 60);
            $endMinute = $minutes % 60;
            $endTime = str_pad($endHour, 2, '0', STR_PAD_LEFT) . ':' . str_pad($endMinute, 2, '0', STR_PAD_LEFT);
        }

        $id = newId();
        $stmt = $db->prepare('INSERT INTO appointments (id, client_id, provider_id, company_id, employee_id, service_id, date, start_time, end_time, duration, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $id,
            $clientId,
            $providerId,
            $companyId,
            $employeeId,
            $serviceId,
            $date,
            $startTime,
            $endTime,
            $duration,
            $status,
            $notes
        ]);

        jsonResponse(true, [
            'id' => $id,
            'date' => $date,
            'startTime' => $startTime,
            'endTime' => $endTime,
            'duration' => $duration,
            'status' => $status
        ], 201);
    }

    jsonResponse(false, null, 405, 'Unsupported method');
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Database error: ' . $exception->getMessage());
}
