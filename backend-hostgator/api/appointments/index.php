<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

/**
 * /appointments/index.php
 *
 * GET  (público): lista agendamentos (por padrão, apenas FUTUROS quando não autenticado)
 *      Parâmetros opcionais:
 *        - companyId
 *        - providerId
 *        - status (scheduled|confirmed|completed|cancelled)
 *        - date_from (YYYY-MM-DD)
 *        - date_to   (YYYY-MM-DD)
 *
 * GET (autenticado): se houver token válido, remove a restrição de "apenas futuros".
 *
 * POST (admin): cria novo agendamento
 *      Campos esperados (JSON ou form-data):
 *        - date (YYYY-MM-DD)
 *        - startTime (HH:MM)
 *        - endTime   (HH:MM) [opcional; será calculado se duration informado]
 *        - duration  (minutos)
 *        - status    (default "scheduled")
 *        - companyId (string) [recomendado]
 *        - providerId, clientId, employeeId, serviceId (opcionais)
 *        - notes (opcional)
 */

// Resposta imediata para OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Função auxiliar para ler body JSON/POST
 */
function readBody(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    $data = $_POST;
  }
  return $data;
}

/**
 * Tenta autenticar; se falhar, retorna null (para GET público).
 * Se seu helpers.php não tiver requireAuthOptional, fazemos try/catch simples.
 */
function tryAuthOrNull() {
  try {
    return requireAuth();
  } catch (Throwable $e) {
    return null;
  }
}

/**
 * Mapeia um registro de DB para o payload esperado pelo front
 */
function mapAppointmentRow(array $row): array {
  return [
    'id'            => $row['id'],
    'date'          => $row['date'],
    'start_time'    => $row['start_time'],
    'end_time'      => $row['end_time'],
    'duration'      => (int)$row['duration'],
    'status'        => $row['status'],
    'company_id'    => $row['company_id'] ?? null,
    'provider_id'   => $row['provider_id'] ?? null,
    'client_id'     => $row['client_id'] ?? null,
    'employee_id'   => $row['employee_id'] ?? null,
    'service_id'    => $row['service_id'] ?? null,
    'notes'         => $row['notes'] ?? null,
    'company_name'  => $row['company_name'] ?? null,
    'provider_name' => $row['provider_name'] ?? null,
    'service_name'  => $row['service_name'] ?? null,
    'employee_name' => $row['employee_name'] ?? null,
    'created_at'    => $row['created_at'],
    'updated_at'    => $row['updated_at'],
  ];
}

if ($method === 'GET') {
  // GET pode ser público. Se autenticado, retorna tudo; se não, apenas futuros.
  $auth = tryAuthOrNull();

  $companyId = isset($_GET['companyId']) ? trim($_GET['companyId']) : null;
  $providerId = isset($_GET['providerId']) ? trim($_GET['providerId']) : null;
  $status    = isset($_GET['status']) ? trim($_GET['status']) : null;
  $dateFrom  = isset($_GET['date_from']) ? trim($_GET['date_from']) : null;
  $dateTo    = isset($_GET['date_to']) ? trim($_GET['date_to']) : null;

  $where = [];
  $params = [];

  // Se não autenticado -> restringe a compromissos futuros (hoje em diante)
  if ($auth === null) {
    $where[] = 'a.date >= CURDATE()';
    // opcional: expor apenas status "scheduled" e "confirmed"
    $where[] = "a.status IN ('scheduled','confirmed')";
  }

  if ($companyId) {
    $where[] = 'a.company_id = ?';
    $params[] = $companyId;
  }

  if ($providerId) {
    $where[] = 'a.provider_id = ?';
    $params[] = $providerId;
  }

  if ($status) {
    $where[] = 'a.status = ?';
    $params[] = $status;
  }

  if ($dateFrom) {
    $where[] = 'a.date >= ?';
    $params[] = $dateFrom;
  }

  if ($dateTo) {
    $where[] = 'a.date <= ?';
    $params[] = $dateTo;
  }

  $sql =
    "SELECT
       a.id,
       a.date,
       a.start_time,
       a.end_time,
       a.duration,
       a.status,
       a.company_id,
       a.provider_id,
       a.client_id,
       a.employee_id,
       a.service_id,
       a.notes,
       a.created_at,
       a.updated_at,
       c.name AS company_name,
       p.name AS provider_name,
       s.name AS service_name,
       e.name AS employee_name
     FROM appointments a
     LEFT JOIN companies  c ON c.id = a.company_id
     LEFT JOIN providers  p ON p.id = a.provider_id
     LEFT JOIN services   s ON s.id = a.service_id
     LEFT JOIN employees  e ON e.id = a.employee_id";

  if ($where) {
    $sql .= " WHERE " . implode(' AND ', $where);
  }

  // Ordena por data e hora
  $sql .= " ORDER BY a.date ASC, a.start_time ASC";

  try {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $out = array_map('mapAppointmentRow', $rows);

    jsonResponse(true, $out);
  } catch (PDOException $e) {
    jsonResponse(false, null, 500, 'Failed to fetch appointments: ' . $e->getMessage());
  }
  exit();
}

if ($method === 'POST') {
  // Criar agendamento: apenas admin
  $auth = requireAuth();
  if (!in_array($auth['role'], ['admin'])) {
    jsonResponse(false, null, 403, 'Forbidden');
  }

  $data = readBody();

  $date       = isset($data['date']) ? trim($data['date']) : '';
  $startTime  = isset($data['startTime']) ? trim($data['startTime']) : '';
  $endTime    = isset($data['endTime']) ? trim($data['endTime']) : null;
  $duration   = isset($data['duration']) ? (int)$data['duration'] : 0;
  $status     = isset($data['status']) ? trim($data['status']) : 'scheduled';
  $companyId  = isset($data['companyId']) ? trim($data['companyId']) : null;
  $providerId = isset($data['providerId']) ? trim($data['providerId']) : null;
  $clientId   = isset($data['clientId']) ? trim($data['clientId']) : null;
  $employeeId = isset($data['employeeId']) ? trim($data['employeeId']) : null;
  $serviceId  = isset($data['serviceId']) ? trim($data['serviceId']) : null;
  $notes      = isset($data['notes']) ? trim($data['notes']) : null;

  if ($date === '' || $startTime === '' || $duration <= 0) {
    jsonResponse(false, null, 422, 'date, startTime and duration are required');
  }

  // Calcula endTime se não enviado
  if ($endTime === null || $endTime === '') {
    // $startTime = "HH:MM"
    $parts = explode(':', $startTime);
    $h = (int)$parts[0];
    $m = (int)($parts[1] ?? 0);
    $total = $h * 60 + $m + $duration;
    $eh = floor($total / 60);
    $em = $total % 60;
    $endTime = sprintf('%02d:%02d', $eh, $em);
  }

  try {
    $db->beginTransaction();

    $id = newId();
    $sql = "INSERT INTO appointments
              (id, date, start_time, end_time, duration, status,
               company_id, provider_id, client_id, employee_id, service_id, notes,
               created_at, updated_at)
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $params = [
      $id, $date, $startTime, $endTime, $duration, $status,
      $companyId, $providerId, $clientId, $employeeId, $serviceId, $notes
    ];

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $db->commit();

    // Retorna o objeto criado (com os campos padrão)
    $created = [
      'id'          => $id,
      'date'        => $date,
      'start_time'  => $startTime,
      'end_time'    => $endTime,
      'duration'    => $duration,
      'status'      => $status,
      'company_id'  => $companyId,
      'provider_id' => $providerId,
      'client_id'   => $clientId,
      'employee_id' => $employeeId,
      'service_id'  => $serviceId,
      'notes'       => $notes,
      'created_at'  => date('Y-m-d H:i:s'),
      'updated_at'  => date('Y-m-d H:i:s'),
    ];

    jsonResponse(true, $created, 201);
  } catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    jsonResponse(false, null, 500, 'Failed to create appointment: ' . $e->getMessage());
  }
  exit();
}

// Outros métodos não permitidos aqui (PUT/PATCH/DELETE possuem seus próprios arquivos)
jsonResponse(false, null, 405, 'Method not allowed');
