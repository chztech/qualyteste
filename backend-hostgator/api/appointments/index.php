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

/**
 * Resolve o company_id quando o usuário é 'company' e o token não trouxe ou veio nulo.
 */
function resolveCompanyIdForCompanyRole(PDO $db, array $auth): ?string {
    if (!isset($auth['role']) || $auth['role'] !== 'company') {
        return null;
    }
    if (!empty($auth['company_id'])) {
        return $auth['company_id'];
    }
    if (empty($auth['user_id'])) {
        return null;
    }
    $stmt = $db->prepare('SELECT company_id FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$auth['user_id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row && !empty($row['company_id']) ? $row['company_id'] : null;
}

/**
 * Resolve o provider_id a partir do user_id quando o usuário é 'provider'.
 */
function resolveProviderIdForProviderRole(PDO $db, array $auth): ?string {
    if (!isset($auth['role']) || $auth['role'] !== 'provider') {
        return null;
    }
    if (!empty($auth['provider_id'])) {
        return $auth['provider_id'];
    }
    if (empty($auth['user_id'])) {
        return null;
    }
    $stmt = $db->prepare('SELECT id FROM providers WHERE user_id = ? LIMIT 1');
    $stmt->execute([$auth['user_id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row && !empty($row['id']) ? $row['id'] : null;
}

try {
    if ($method === 'GET') {
        $filters = [];
        $params  = [];

        // Filtros de querystring
        if (!empty($_GET['companyId'])) {
            $filters[] = 'a.company_id = ?';
            $params[]  = $_GET['companyId'];
        }
        if (!empty($_GET['providerId'])) {
            $filters[] = 'a.provider_id = ?';
            $params[]  = $_GET['providerId'];
        }
        if (!empty($_GET['status'])) {
            $filters[] = 'a.status = ?';
            $params[]  = $_GET['status'];
        }
        if (!empty($_GET['dateStart'])) {
            $filters[] = 'a.date >= ?';
            $params[]  = $_GET['dateStart'];
        }
        if (!empty($_GET['dateEnd'])) {
            $filters[] = 'a.date <= ?';
            $params[]  = $_GET['dateEnd'];
        }

        // Restrições por papel
        $resolvedCompanyId  = resolveCompanyIdForCompanyRole($db, $auth);
        $resolvedProviderId = resolveProviderIdForProviderRole($db, $auth);

        if ($auth['role'] === 'company' && $resolvedCompanyId) {
            $filters[] = 'a.company_id = ?';
            $params[]  = $resolvedCompanyId;
        }

        if ($auth['role'] === 'provider' && $resolvedProviderId) {
            $filters[] = 'a.provider_id = ?';
            $params[]  = $resolvedProviderId;
        }

        $query = 'SELECT a.*,
                    c.name  AS company_name,
                    p.name  AS provider_name,
                    s.name  AS service_name,
                    emp.name AS employee_name
                  FROM appointments a
                  LEFT JOIN companies c        ON a.company_id  = c.id
                  LEFT JOIN providers p        ON a.provider_id = p.id
                  LEFT JOIN services s         ON a.service_id  = s.id
                  LEFT JOIN company_employees emp ON a.employee_id = emp.id';

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
        $date       = isset($payload['date']) ? trim($payload['date']) : '';
        $startTime  = isset($payload['startTime']) ? trim($payload['startTime']) : '';
        $endTime    = isset($payload['endTime']) ? trim($payload['endTime']) : '';
        $duration   = isset($payload['duration']) ? (int)$payload['duration'] : null;
        $companyId  = isset($payload['companyId']) ? trim((string)$payload['companyId']) : null;
        $providerId = isset($payload['providerId']) ? trim((string)$payload['providerId']) : null;
        $serviceId  = isset($payload['serviceId']) ? trim((string)$payload['serviceId']) : null;
        $employeeId = isset($payload['employeeId']) ? trim((string)$payload['employeeId']) : null;
        $clientId   = isset($payload['clientId']) ? trim((string)$payload['clientId']) : null;
        $status     = isset($payload['status']) ? trim($payload['status']) : 'scheduled';
        $notes      = isset($payload['notes']) ? trim($payload['notes']) : null;

        if ($date === '' || $startTime === '' || !$duration) {
            jsonResponse(false, null, 422, 'Date, startTime and duration are required');
        }

        // Calcula endTime se não vier
        if ($endTime === '' && $duration) {
            $startParts   = explode(':', $startTime);
            $minutesTotal = ((int)$startParts[0]) * 60 + ((int)$startParts[1]) + (int)$duration;
            $endHour      = floor($minutesTotal / 60);
            $endMinute    = $minutesTotal % 60;
            $endTime      = str_pad((string)$endHour, 2, '0', STR_PAD_LEFT) . ':' . str_pad((string)$endMinute, 2, '0', STR_PAD_LEFT);
        }

        $id = newId();
        $stmt = $db->prepare('INSERT INTO appointments
            (id, client_id, provider_id, company_id, employee_id, service_id, date, start_time, end_time, duration, status, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
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
            'id'         => $id,
            'date'       => $date,
            'startTime'  => $startTime,
            'endTime'    => $endTime,
            'duration'   => (int)$duration,
            'status'     => $status,
            'companyId'  => $companyId,
            'providerId' => $providerId,
            'serviceId'  => $serviceId,
            'employeeId' => $employeeId,
            'notes'      => $notes
        ], 201);
    }

    jsonResponse(false, null, 405, 'Unsupported method');
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Database error: ' . $exception->getMessage());
}
