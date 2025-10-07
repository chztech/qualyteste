<?php
// backend-hostgator/api/appointments/index.php
// NADA antes desta linha (sem BOM)
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../helpers/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
  json_end(200, ['success' => true]);
}

// Se quiser exigir auth, descomente:
// $token = getBearerToken();
// $payload = $token ? jwt_verify($token) : false;
// if (!$payload) {
//   json_end(401, ['success' => false, 'error' => 'Unauthorized']);
// }

try {
  $db = (new Database())->getConnection();

  // Corpo (POST/PUT)
  $raw = file_get_contents('php://input');
  $payloadBody = json_decode($raw, true);
  if (!is_array($payloadBody)) { $payloadBody = $_POST; }

  if ($method === 'GET') {
    $filters = [];
    $params  = [];

    // Filtros por querystring
    if (!empty($_GET['companyId'])) { $filters[] = 'a.company_id = ?'; $params[] = $_GET['companyId']; }
    if (!empty($_GET['providerId'])){ $filters[] = 'a.provider_id = ?'; $params[] = $_GET['providerId']; }
    if (!empty($_GET['status']))    { $filters[] = 'a.status = ?';     $params[] = $_GET['status']; }
    if (!empty($_GET['dateStart'])) { $filters[] = 'a.date >= ?';      $params[] = $_GET['dateStart']; }
    if (!empty($_GET['dateEnd']))   { $filters[] = 'a.date <= ?';      $params[] = $_GET['dateEnd']; }

    // Caso queira restringir por token (se habilitar auth acima), exemplo:
    // if ($payload && ($payload['role'] ?? null) === 'company' && !empty($payload['company_id'])) {
    //   $filters[] = 'a.company_id = ?';
    //   $params[]  = $payload['company_id'];
    // }
    // if ($payload && ($payload['role'] ?? null) === 'provider' && !empty($payload['user_id'])) {
    //   $filters[] = 'a.provider_id = (SELECT id FROM providers WHERE user_id = ? LIMIT 1)';
    //   $params[]  = $payload['user_id'];
    // }

    $sql = 'SELECT 
              a.id, a.date, a.start_time, a.end_time, a.duration, a.status,
              a.company_id, a.provider_id, a.employee_id, a.service_id, a.client_id,
              a.notes, a.created_at, a.updated_at,
              c.name AS company_name,
              p.name AS provider_name,
              s.name AS service_name,
              emp.name AS employee_name
            FROM appointments a
            LEFT JOIN companies c ON a.company_id = c.id
            LEFT JOIN providers p ON a.provider_id = p.id
            LEFT JOIN services  s ON a.service_id  = s.id
            LEFT JOIN company_employees emp ON a.employee_id = emp.id';

    if ($filters) { $sql .= ' WHERE ' . implode(' AND ', $filters); }
    $sql .= ' ORDER BY a.date DESC, a.start_time DESC';

    $st = $db->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    // Normalizações
    foreach ($rows as &$r) {
      if (isset($r['duration'])) $r['duration'] = (int)$r['duration'];
      // Mantém start_time/end_time como string HH:MM:SS (ou HH:MM) conforme DB
    }

    json_end(200, ['success' => true, 'data' => $rows]);
  }

  if ($method === 'POST') {
    $date       = isset($payloadBody['date']) ? trim($payloadBody['date']) : '';
    $startTime  = isset($payloadBody['startTime']) ? trim($payloadBody['startTime']) : '';
    $endTime    = isset($payloadBody['endTime']) ? trim($payloadBody['endTime']) : '';
    $duration   = isset($payloadBody['duration']) ? (int)$payloadBody['duration'] : null;
    $companyId  = isset($payloadBody['companyId']) ? trim((string)$payloadBody['companyId']) : null;
    $providerId = isset($payloadBody['providerId']) ? trim((string)$payloadBody['providerId']) : null;
    $serviceId  = isset($payloadBody['serviceId']) ? trim((string)$payloadBody['serviceId']) : null;
    $employeeId = isset($payloadBody['employeeId']) ? trim((string)$payloadBody['employeeId']) : null;
    $clientId   = isset($payloadBody['clientId']) ? trim((string)$payloadBody['clientId']) : null;
    $status     = isset($payloadBody['status']) ? trim((string)$payloadBody['status']) : 'scheduled';
    $notes      = isset($payloadBody['notes']) ? trim((string)$payloadBody['notes']) : null;

    if ($date === '' || $startTime === '' || !$duration) {
      json_end(422, ['success' => false, 'error' => 'Date, startTime and duration are required']);
    }

    // Calcula endTime se não enviado
    if ($endTime === '' && $duration) {
      $parts = explode(':', $startTime);
      $minutes = ((int)$parts[0]) * 60 + ((int)($parts[1] ?? 0)) + (int)$duration;
      $eh = floor($minutes / 60);
      $em = $minutes % 60;
      $endTime = str_pad((string)$eh, 2, '0', STR_PAD_LEFT) . ':' . str_pad((string)$em, 2, '0', STR_PAD_LEFT);
    }

    // newId() de helpers; se não houver, cria local
    if (!function_exists('newId')) {
      function newId() { return bin2hex(random_bytes(16)); }
    }
    $id = newId();

    $st = $db->prepare('INSERT INTO appointments 
      (id, client_id, provider_id, company_id, employee_id, service_id, date, start_time, end_time, duration, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');

    $st->execute([
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

    json_end(201, [
      'success' => true,
      'data' => [
        'id'        => $id,
        'date'      => $date,
        'startTime' => $startTime,
        'endTime'   => $endTime,
        'duration'  => (int)$duration,
        'status'    => $status,
        'companyId' => $companyId,
        'providerId'=> $providerId,
        'serviceId' => $serviceId,
        'employeeId'=> $employeeId,
        'clientId'  => $clientId,
        'notes'     => $notes
      ]
    ]);
  }

  json_end(405, ['success' => false, 'error' => 'Unsupported method']);
} catch (Throwable $e) {
  error_log("appointments/index error: " . $e->getMessage());
  // Não derruba o front; responde estrutura válida p/ listagens
  json_end(200, ['success' => true, 'data' => []]);
}
