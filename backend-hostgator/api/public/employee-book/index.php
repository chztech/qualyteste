<?php
/**
 * Public endpoint: employee self-booking (no auth).
 * POST /api/public/employee-book
 *
 * Request JSON:
 * {
 *   "public_token": "TOKEN_PUBLICO_DA_EMPRESA",   // obrigatório
 *   "date": "YYYY-MM-DD",                         // obrigatório (data escolhida)
 *   "start_time": "HH:MM" | "HH:MM:SS",           // obrigatório (início)
 *   "end_time": "HH:MM" | "HH:MM:SS",             // obrigatório (fim)
 *   "provider_id": "....",                        // obrigatório (prestador/cadeira)
 *   "service_id": "....",                         // obrigatório (serviço escolhido)
 *   "name": "Nome do funcionário",                // obrigatório
 *   "sector": "Setor/Departamento",               // obrigatório
 *   "phone": "Telefone",                          // obrigatório
 *   "email": "opcional@exemplo.com"               // opcional
 * }
 *
 * Regras:
 * - Resolve a empresa via companies.public_token (is_active = 1).
 * - Upsert de funcionário por (company_id + phone) se possível; se não existir, cria.
 * - Verifica conflito de horário para o mesmo provider_id na data indicada.
 * - Cria o agendamento (appointments) vinculado ao employee_id.
 * - O campo sector será salvo em employees.sector se existir; caso contrário, é anexado em appointments.notes.
 */

// ---------- Helpers mínimos ----------
if (!function_exists('jsonResponse')) {
    function jsonResponse($success, $data=null, $status=200, $message='') {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => (bool)$success,
            'data'    => $data,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
if (!function_exists('readBody')) {
    function readBody(): array {
        $raw = file_get_contents('php://input');
        $d = json_decode($raw, true);
        return is_array($d) ? $d : [];
    }
}
if (!function_exists('getPDO')) {
    $DB_HOST = getenv('DB_HOST') ?: 'localhost';
    $DB_NAME = getenv('DB_NAME') ?: 'qualycorpore';
    $DB_USER = getenv('DB_USER') ?: 'usuario';
    $DB_PASS = getenv('DB_PASS') ?: 'senha';
    $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
    try {
        $GLOBALS['_qc_pdo'] = new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $e) {
        jsonResponse(false, null, 500, 'DB connection failed');
    }
    function getPDO(): PDO { return $GLOBALS['_qc_pdo']; }
}

// CORS
if (file_exists(__DIR__ . '/../../config/cors.php')) {
    require_once __DIR__ . '/../../config/cors.php';
    if (function_exists('qc_apply_cors_headers')) qc_apply_cors_headers();
}

date_default_timezone_set('America/Sao_Paulo');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

// ---------- Parse & validate ----------
$b = readBody();

$required = ['public_token','date','start_time','end_time','provider_id','service_id','name','sector','phone'];
foreach ($required as $k) {
    if (!isset($b[$k]) || $b[$k] === '' || $b[$k] === null) {
        jsonResponse(false, null, 422, "Campo obrigatório ausente: $k");
    }
}

$public_token = trim($b['public_token']);
$date        = trim($b['date']);         // "YYYY-MM-DD"
$start_time  = trim($b['start_time']);   // "HH:MM" ou "HH:MM:SS"
$end_time    = trim($b['end_time']);     // idem
$provider_id = trim($b['provider_id']);
$service_id  = trim($b['service_id']);
$name        = trim($b['name']);
$sector      = trim($b['sector']);
$phone       = trim($b['phone']);
$email       = isset($b['email']) ? trim($b['email']) : '';

// Normaliza HH:MM -> HH:MM:SS
$toHms = function (string $t): string {
    return preg_match('/^\d{2}:\d{2}$/', $t) ? ($t . ':00') : $t;
};
$start_time = $toHms($start_time);
$end_time   = $toHms($end_time);

// ---------- Resolve company ----------
$pdo = getPDO();

$st = $pdo->prepare("SELECT id FROM companies WHERE public_token = ? AND is_active = 1 LIMIT 1");
$st->execute([$public_token]);
$company_id = $st->fetchColumn();
if (!$company_id) {
    jsonResponse(false, null, 404, 'Empresa não encontrada ou inativa');
}

// ---------- Upsert de funcionário por (company_id, phone) ----------
try {
    // Descobre se a coluna sector/department existe
    $hasSector = false;
    $cols = $pdo->query("SHOW COLUMNS FROM employees")->fetchAll();
    foreach ($cols as $c) {
        if (strcasecmp($c['Field'], 'sector') === 0 || strcasecmp($c['Field'], 'department') === 0) {
            $hasSector = $c['Field']; // guarda o nome real da coluna
            break;
        }
    }

    // Tenta encontrar por (company_id, phone)
    $st = $pdo->prepare("SELECT id FROM employees WHERE company_id = ? AND phone = ? LIMIT 1");
    $st->execute([$company_id, $phone]);
    $employee_id = $st->fetchColumn();

    if ($employee_id) {
        // Atualiza dados básicos (nome/email/sector se houver)
        if ($hasSector) {
            $sql = "UPDATE employees SET name = :name, email = :email, {$hasSector} = :sector WHERE id = :id";
            $st = $pdo->prepare($sql);
            $st->execute([':name'=>$name, ':email'=>($email ?: null), ':sector'=>$sector, ':id'=>$employee_id]);
        } else {
            $sql = "UPDATE employees SET name = :name, email = :email WHERE id = :id";
            $st = $pdo->prepare($sql);
            $st->execute([':name'=>$name, ':email'=>($email ?: null), ':id'=>$employee_id]);
        }
    } else {
        // Cria funcionário
        $employee_id = bin2hex(random_bytes(16));
        if ($hasSector) {
            $sql = "INSERT INTO employees (id, company_id, name, email, phone, {$hasSector}, active, created_at)
                    VALUES (:id,:company_id,:name,:email,:phone,:sector,1,NOW())";
            $st = $pdo->prepare($sql);
            $st->execute([
                ':id'=>$employee_id, ':company_id'=>$company_id, ':name'=>$name,
                ':email'=>($email ?: null), ':phone'=>$phone, ':sector'=>$sector
            ]);
        } else {
            $sql = "INSERT INTO employees (id, company_id, name, email, phone, active, created_at)
                    VALUES (:id,:company_id,:name,:email,:phone,1,NOW())";
            $st = $pdo->prepare($sql);
            $st->execute([
                ':id'=>$employee_id, ':company_id'=>$company_id, ':name'=>$name,
                ':email'=>($email ?: null), ':phone'=>$phone
            ]);
        }
    }
} catch (Throwable $e) {
    error_log('employee-book UPSERT employee error: '.$e->getMessage());
    jsonResponse(false, null, 500, 'Erro ao registrar/atualizar funcionário');
}

// ---------- Verifica conflito de horário ----------
try {
    $sql = "SELECT COUNT(*) FROM appointments
             WHERE provider_id = :pid
               AND date = :d
               AND status IN ('scheduled','confirmed')
               AND (start_time < :new_end AND end_time > :new_start)";
    $st = $pdo->prepare($sql);
    $st->execute([
        ':pid' => $provider_id,
        ':d'   => $date,
        ':new_start' => $start_time,
        ':new_end'   => $end_time,
    ]);
    $conflict = (int)$st->fetchColumn();
    if ($conflict > 0) {
        jsonResponse(false, null, 409, 'Horário indisponível');
    }
} catch (Throwable $e) {
    error_log('employee-book CONFLICT check error: '.$e->getMessage());
    jsonResponse(false, null, 500, 'Erro ao validar disponibilidade');
}

// ---------- Resolve service_name (se precisar) ----------
$st = $pdo->prepare("SELECT name FROM services WHERE id = ? LIMIT 1");
$st->execute([$service_id]);
$service_name = $st->fetchColumn() ?: 'Serviço';

// ---------- Monta notes com setor se a tabela de employees não tiver sector ----------
$notes = $b['notes'] ?? '';
if (!$notes && !$hasSector) {
    $notes = "Setor: $sector";
}

// ---------- Insere agendamento ----------
try {
    $appointment_id = bin2hex(random_bytes(16));
    $sql = "INSERT INTO appointments
              (id, company_id, employee_id, provider_id, service_id, date, start_time, end_time, duration, status, notes, service_name)
            VALUES
              (:id,:company_id,:employee_id,:provider_id,:service_id,:date,:start_time,:end_time,:duration,:status,:notes,:service_name)";
    $st = $pdo->prepare($sql);
    $duration = max(0, (int)($b['duration'] ?? 0));
    if ($duration === 0) {
        // fallback de duração (em minutos) a partir do intervalo
        $t1 = strtotime($date.' '.$start_time);
        $t2 = strtotime($date.' '.$end_time);
        $duration = (int) max(15, round(($t2 - $t1) / 60));
    }
    $st->execute([
        ':id'           => $appointment_id,
        ':company_id'   => $company_id,
        ':employee_id'  => $employee_id,
        ':provider_id'  => $provider_id,
        ':service_id'   => $service_id,
        ':date'         => $date,
        ':start_time'   => $start_time,
        ':end_time'     => $end_time,
        ':duration'     => $duration,
        ':status'       => 'scheduled',
        ':notes'        => $notes ?: null,
        ':service_name' => $service_name,
    ]);

    jsonResponse(true, [
        'appointment_id' => $appointment_id,
        'employee_id'    => $employee_id
    ], 201, 'created');
} catch (Throwable $e) {
    error_log('employee-book INSERT appointment error: '.$e->getMessage());
    jsonResponse(false, null, 500, 'Erro ao salvar agendamento');
}
