<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth(); // deve retornar pelo menos: ['id' => ..., 'role' => ..., 'company_id' => ...?]

$database = new Database();
$db = $database->getConnection();

// Lê corpo JSON ou x-www-form-urlencoded
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

// Coleta IDs
$ids = [];
if (isset($data['ids']) && is_array($data['ids'])) {
  $ids = array_filter(array_map('trim', $data['ids']));
}
if (!$ids && isset($data['id'])) {
  $ids = [trim($data['id'])];
}
if (!$ids && isset($_GET['id'])) {
  $ids = [trim($_GET['id'])];
}
$ids = array_values(array_filter($ids));

if (!$ids) {
  jsonResponse(false, null, 422, 'At least one appointment id is required');
}

try {
  $db->beginTransaction();

  // Monta placeholders
  $placeholders = implode(',', array_fill(0, count($ids), '?'));
  $params = $ids;

  // Regras por papel
  $extraWhere = '';
  if ($auth['role'] === 'admin') {
    // sem restrição extra
  } elseif ($auth['role'] === 'company') {
    if (empty($auth['company_id'])) {
      $db->rollBack();
      jsonResponse(false, null, 403, 'Company user without company_id');
    }
    $extraWhere = ' AND company_id = ?';
    $params[] = $auth['company_id'];
  } elseif ($auth['role'] === 'provider') {
    $extraWhere = ' AND provider_id = ?';
    $params[] = $auth['id'];
  } else {
    $db->rollBack();
    jsonResponse(false, null, 403, 'Forbidden');
  }

  // Seleciona quais IDs o usuário tem permissão de excluir
  $sel = $db->prepare("SELECT id FROM appointments WHERE id IN ($placeholders) $extraWhere");
  $sel->execute($params);
  $allowedIds = $sel->fetchAll(PDO::FETCH_COLUMN);

  if (empty($allowedIds)) {
    $db->rollBack();
    jsonResponse(false, null, 404, 'No matching appointments to delete');
  }

  // Deleta somente os permitidos
  $place2 = implode(',', array_fill(0, count($allowedIds), '?'));
  $del = $db->prepare("DELETE FROM appointments WHERE id IN ($place2)");
  $del->execute($allowedIds);

  $db->commit();

  jsonResponse(true, ['ids' => $allowedIds], 200);

} catch (PDOException $exception) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Failed to delete appointments: ' . $exception->getMessage());
}
