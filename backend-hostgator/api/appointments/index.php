<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../helpers/functions.php';

// ===== Logs =====
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/appointments_error.log');

// ===== Preflight =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// ===== Fallbacks =====
if (!function_exists('jsonResponse')) {
  function jsonResponse($success,$data=null,$status=200,$message=null){
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success'=>$success,'data'=>$data,'message'=>$message], JSON_UNESCAPED_UNICODE);
    exit();
  }
}
if (!function_exists('getBearerToken')) {
  function getBearerToken(){ $h=$_SERVER['HTTP_AUTHORIZATION']??''; return stripos($h,'Bearer ')===0?trim(substr($h,7)):null; }
}

// ===== DB =====
try {
  $database = new Database();
  /** @var PDO $db */
  $db = $database->getConnection();
} catch (Throwable $e) {
  error_log("DB connect error: ".$e->getMessage());
  jsonResponse(false,null,500,'Database connection failed');
}

$method = $_SERVER['REQUEST_METHOD'];

// ===== Utils =====
function readBody(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data) || !$data) $data = $_POST;
  return $data ?: [];
}
function tryAuthOrNull(){
  if (!function_exists('jwt_verify')) return null;
  $t=getBearerToken(); if(!$t) return null;
  $p=jwt_verify($t); return $p?:null;
}
function mapAppointmentRow(array $row): array {
  return [
    'id'=>$row['id'],'date'=>$row['date'],'start_time'=>$row['start_time'],'end_time'=>$row['end_time'],
    'duration'=>isset($row['duration'])?(int)$row['duration']:null,'status'=>$row['status'],
    'company_id'=>$row['company_id']??null,'provider_id'=>$row['provider_id']??null,'client_id'=>$row['client_id']??null,
    'employee_id'=>$row['employee_id']??null,'service_id'=>$row['service_id']??null,'notes'=>$row['notes']??null,
    'company_name'=>$row['company_name']??null,'provider_name'=>$row['provider_name']??null,
    'service_name'=>$row['service_name']??null,'employee_name'=>$row['employee_name']??null,
    'created_at'=>$row['created_at']??null,'updated_at'=>$row['updated_at']??null,
  ];
}
function existsById(PDO $db, string $table, string $id): bool {
  $stmt=$db->prepare("SELECT 1 FROM `$table` WHERE id=? LIMIT 1");
  $stmt->execute([$id]);
  return (bool)$stmt->fetchColumn();
}
function newUuid36(): string {
  if (function_exists('newId')) return newId(); // se você já tiver
  // uuid v4 simples
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// ===== GET =====
if ($method==='GET'){
  $auth = tryAuthOrNull();

  // Enforce auth: público não lista aqui (rota pública é outra)
  if ($auth === null) {
    jsonResponse(false, null, 403, 'Forbidden'); // público não acessa GET /appointments
  }

  // Extrai role e (se existirem) company_id / provider_id do payload do token
  $role        = $auth['role']        ?? null;
  // Ajuste os nomes abaixo se seu JWT usar camelCase (ex.: companyId/providerId)
  $authCompany = $auth['company_id']  ?? ($auth['companyId']  ?? null);
  $authProvider= $auth['provider_id'] ?? ($auth['providerId'] ?? null);

  // Filtros opcionais via querystring (admin pode usá-los)
  $companyId = $_GET['companyId']   ?? null;
  $providerId= $_GET['providerId']  ?? null;
  $status    = $_GET['status']      ?? null;
  $dateFrom  = $_GET['date_from']   ?? null;
  $dateTo    = $_GET['date_to']     ?? null;

  $where=[]; $params=[];

  // Regra de visibilidade por perfil
  if ($role === 'admin') {
    // Admin vê tudo; pode usar filtros da querystring
    if ($companyId){ $where[]='a.company_id = ?';  $params[]=$companyId; }
    if ($providerId){$where[]='a.provider_id = ?'; $params[]=$providerId;}
  } elseif ($role === 'company') {
    // Company vê SOMENTE a própria empresa (ignora companyId da URL)
    if (!$authCompany) jsonResponse(false,null,403,'Forbidden: company_id ausente no token');
    $where[]='a.company_id = ?';  $params[]=$authCompany;
  } elseif ($role === 'provider') {
    // Provider vê SOMENTE os próprios agendamentos (ignora providerId da URL)
    if (!$authProvider) jsonResponse(false,null,403,'Forbidden: provider_id ausente no token');
    $where[]='a.provider_id = ?'; $params[]=$authProvider;
  } else {
    jsonResponse(false,null,403,'Forbidden');
  }

  // Filtros comuns (status / intervalo de datas)
  if ($status){   $where[]='a.status = ?';  $params[]=$status; }
  if ($dateFrom){ $where[]='a.date >= ?';   $params[]=$dateFrom; }
  if ($dateTo){   $where[]='a.date <= ?';   $params[]=$dateTo;   }

  $sql = "SELECT
            a.id,a.date,a.start_time,a.end_time,a.duration,a.status,
            a.company_id,a.provider_id,a.client_id,a.employee_id,a.service_id,a.notes,
            a.created_at,a.updated_at,
            c.name AS company_name,
            p.name AS provider_name,
            s.name AS service_name,
            e.name AS employee_name
          FROM appointments a
          LEFT JOIN companies         c ON c.id = a.company_id
          LEFT JOIN providers         p ON p.id = a.provider_id
          LEFT JOIN services          s ON s.id = a.service_id
          LEFT JOIN company_employees e ON e.id = a.employee_id";

  if ($where) $sql .= " WHERE ".implode(' AND ',$where);
  $sql .= " ORDER BY a.date ASC, a.start_time ASC";

  try{
    $stmt=$db->prepare($sql);
    $stmt->execute($params);
    $rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, array_map('mapAppointmentRow',$rows), 200);
  }catch(PDOException $e){
    error_log('GET SQL error: '.$e->getMessage());
    jsonResponse(false,null,500,'Failed to fetch appointments');
  }
}

// ===== POST =====
if ($method==='POST'){
  if (!function_exists('requireAuth')) jsonResponse(false,null,500,'Auth helper not available');
  $auth = requireAuth();
  if (!isset($auth['role']) || !in_array($auth['role'], ['admin'], true)) {
    jsonResponse(false,null,403,'Forbidden');
  }
  
  $d = readBody();

  $date      = isset($d['date']) ? trim($d['date']) : '';
  $startTime = isset($d['startTime']) ? trim($d['startTime']) : '';
  $duration  = isset($d['duration']) ? (int)$d['duration'] : 0;

  if ($date==='' || $startTime==='' || $duration<=0){
    jsonResponse(false,null,422,'date, startTime and duration are required');
  }
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date))       jsonResponse(false,null,422,'Formato inválido de date (YYYY-MM-DD)');
  if (!preg_match('/^\d{2}:\d{2}$/',$startTime))        jsonResponse(false,null,422,'Formato inválido de startTime (HH:MM)');

  $endTime    = isset($d['endTime']) && $d['endTime']!=='' ? trim($d['endTime']) : '';
  $status     = isset($d['status']) && $d['status']!=='' ? trim($d['status']) : 'scheduled';
  $companyId  = isset($d['companyId']) && $d['companyId']!=='' ? trim($d['companyId']) : null;
  $providerId = isset($d['providerId']) && $d['providerId']!=='' ? trim($d['providerId']) : null;
  $clientId   = isset($d['clientId']) && $d['clientId']!=='' ? trim($d['clientId']) : null;
  $employeeId = isset($d['employeeId']) && $d['employeeId']!=='' ? trim($d['employeeId']) : null;
  $serviceId  = isset($d['serviceId']) && $d['serviceId']!=='' ? trim($d['serviceId']) : null;
  $notes      = isset($d['notes']) ? trim((string)$d['notes']) : null;

  if ($endTime!==''){
    if (!preg_match('/^\d{2}:\d{2}$/',$endTime)) jsonResponse(false,null,422,'Formato inválido de endTime (HH:MM)');
  } else {
    [$h,$m]=array_map('intval', explode(':',$startTime)+[0,0]);
    $tot=$h*60+$m+$duration; $eh=intdiv($tot,60)%24; $em=$tot%60;
    $endTime=sprintf('%02d:%02d',$eh,$em);
  }

  // ===== Valida FKs (users/providers/companies/company_employees/services) =====
  if ($clientId   !== null && !existsById($db,'users',$clientId))                 jsonResponse(false,null,422,'clientId inválido: usuário não encontrado');
  if ($providerId !== null && !existsById($db,'providers',$providerId))           jsonResponse(false,null,422,'providerId inválido');
  if ($companyId  !== null && !existsById($db,'companies',$companyId))            jsonResponse(false,null,422,'companyId inválido');
  if ($employeeId !== null && !existsById($db,'company_employees',$employeeId))   jsonResponse(false,null,422,'employeeId inválido');
  if ($serviceId  !== null && !existsById($db,'services',$serviceId))             jsonResponse(false,null,422,'serviceId inválido');

  try{
    $db->beginTransaction();

    // === Seu schema exige ID varchar(36) (sem auto-inc) ===
    $id = newUuid36(); // compatível com VARCHAR(36)

    $sql = "INSERT INTO appointments
              (id, date, start_time, end_time, duration, status,
               company_id, provider_id, client_id, employee_id, service_id, notes,
               created_at, updated_at)
            VALUES
              (?,  ?,    ?,          ?,        ?,        ?, 
               ?,         ?,          ?,         ?,          ?,         ?, 
               NOW(), NOW())";
    $params = [$id, $date, $startTime, $endTime, $duration, $status,
               $companyId, $providerId, $clientId, $employeeId, $serviceId, $notes];

    $stmt=$db->prepare($sql);
    $stmt->execute($params);

    $db->commit();

    jsonResponse(true, [
      'id'=>$id,'date'=>$date,'start_time'=>$startTime,'end_time'=>$endTime,'duration'=>$duration,'status'=>$status,
      'company_id'=>$companyId,'provider_id'=>$providerId,'client_id'=>$clientId,'employee_id'=>$employeeId,'service_id'=>$serviceId,
      'notes'=>$notes,'created_at'=>date('Y-m-d H:i:s'),'updated_at'=>date('Y-m-d H:i:s'),
    ], 201);

  } catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('POST SQL error: '.$e->getMessage());
    // Trata unique (provider_id, date, start_time)
    if ($e->getCode()==='23000' && stripos($e->getMessage(),'unique_provider_datetime')!==false) {
      jsonResponse(false,null,409,'Conflito de horário: já existe agendamento para este prestador neste dia/hora');
    }
    // Trata violações de FK restantes
    if ($e->getCode()==='23000' && stripos($e->getMessage(),'FOREIGN KEY')!==false) {
      jsonResponse(false,null,422,'Violação de integridade referencial (verifique IDs enviados)');
    }
    jsonResponse(false,null,500,'Failed to create appointment');
  } catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log('POST generic error: '.$e->getMessage());
    jsonResponse(false,null,500,'Internal error');
  }
}

// ===== Métodos não suportados =====
jsonResponse(false,null,405,'Method not allowed');
