<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../helpers/functions.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    jsonResponse(false, null, 405, 'Método não permitido');
}

try {
    $db = (new Database())->getConnection();
    $auth = requireAuth();

    $rawBody = file_get_contents('php://input');
    $body = json_decode($rawBody, true);
    if (!is_array($body)) {
        $body = $_POST; // fallback para application/x-www-form-urlencoded
    }

    $id = isset($body['id']) ? trim((string)$body['id']) : '';
    if ($id === '') {
        jsonResponse(false, null, 422, 'id é obrigatório');
    }

    $stmt = $db->prepare('SELECT id, company_id, provider_id FROM appointments WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$appointment) {
        jsonResponse(false, null, 404, 'Agendamento não encontrado');
    }

    $role = $auth['role'] ?? null;
    $allowedFields = [];
    $providerIdFromUser = null;

    if ($role === 'admin') {
        $allowedFields = [
            'date',
            'start_time',
            'end_time',
            'duration',
            'status',
            'notes',
            'company_id',
            'employee_id',
            'provider_id',
            'client_id',
            'service_id',
            'service_name',
        ];
    } elseif ($role === 'company') {
        $companyId = $auth['company_id'] ?? null;
        if (!$companyId || $companyId !== $appointment['company_id']) {
            jsonResponse(false, null, 403, 'Sem permissão para atualizar este agendamento');
        }
        $allowedFields = ['status', 'notes', 'employee_id', 'service_id'];
    } elseif ($role === 'provider') {
        $userId = $auth['user_id'] ?? null;
        if (!$userId) {
            jsonResponse(false, null, 403, 'Sem permissão para atualizar este agendamento');
        }
        $providerLookup = $db->prepare('SELECT id FROM providers WHERE user_id = ? LIMIT 1');
        $providerLookup->execute([$userId]);
        $providerIdFromUser = $providerLookup->fetchColumn();
        if (!$providerIdFromUser || $providerIdFromUser !== $appointment['provider_id']) {
            jsonResponse(false, null, 403, 'Sem permissão para atualizar este agendamento');
        }
        $allowedFields = ['status', 'notes'];
    } else {
        jsonResponse(false, null, 403, 'Perfil sem autorização para atualizar agendamentos');
    }

    $allowedStatus = ['scheduled', 'confirmed', 'cancelled', 'completed'];
    $setParts = [];
    $params = [':id' => $id];

    foreach ($allowedFields as $field) {
        if (!array_key_exists($field, $body)) {
            continue;
        }

        $value = $body[$field];

        if ($field === 'status' && $value !== null && !in_array((string)$value, $allowedStatus, true)) {
            jsonResponse(false, null, 422, 'Status inválido');
        }

        $setParts[] = "$field = :$field";
        $params[":$field"] = $value;
    }

    if (!$setParts) {
        jsonResponse(false, null, 400, 'Nenhum campo permitido para atualizar foi informado');
    }

    $sql = 'UPDATE appointments SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = :id';
    if ($role === 'company') {
        $sql .= ' AND company_id = :company_filter';
        $params[':company_filter'] = $appointment['company_id'];
    } elseif ($role === 'provider') {
        $sql .= ' AND provider_id = :provider_filter';
        $params[':provider_filter'] = $providerIdFromUser;
    }

    $update = $db->prepare($sql);
    $update->execute($params);

    $select = $db->prepare('
        SELECT
            id,
            company_id,
            employee_id,
            provider_id,
            client_id,
            service_id,
            date,
            start_time,
            end_time,
            duration,
            status,
            service_name,
            notes,
            created_at,
            updated_at
        FROM appointments
        WHERE id = ?
        LIMIT 1
    ');
    $select->execute([$id]);
    $updated = $select->fetch(PDO::FETCH_ASSOC);

    jsonResponse(true, $updated, 200);
} catch (Throwable $e) {
    error_log('update appointments error: ' . $e->getMessage());
    jsonResponse(false, null, 500, 'Falha ao atualizar agendamento');
}
