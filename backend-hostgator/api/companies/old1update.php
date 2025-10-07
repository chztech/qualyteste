<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT','POST','PATCH'])) {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$auth = requireAuth();
if (!in_array($auth['role'], ['admin'])) {
  jsonResponse(false, null, 403, 'Forbidden');
}

$database = new Database();
$db = $database->getConnection();

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$id       = isset($data['id']) ? trim($data['id']) : '';
$name     = isset($data['name']) ? trim($data['name']) : null;
$address  = isset($data['address']) ? trim($data['address']) : null;
$phone    = isset($data['phone']) ? trim($data['phone']) : null;
$email    = isset($data['email']) ? trim($data['email']) : null;
$notes    = isset($data['notes']) ? trim($data['notes']) : null;
$isActive = isset($data['isActive']) ? (bool)$data['isActive'] : null;
// employees pode vir também; aqui omitimos para brevidade

if ($id === '') {
  jsonResponse(false, null, 422, 'Company id is required');
}

try {
  $db->beginTransaction();

  $fields = [];
  $params = [];

  if ($name !== null) { $fields[] = 'name = ?'; $params[] = $name; }
  if ($address !== null) { $fields[] = 'address = ?'; $params[] = $address; }
  if ($phone !== null) { $fields[] = 'phone = ?'; $params[] = $phone; }
  if ($email !== null) { $fields[] = 'email = ?'; $params[] = $email; }
  if ($notes !== null) { $fields[] = 'notes = ?'; $params[] = $notes; }
  if ($isActive !== null) { $fields[] = 'is_active = ?'; $params[] = $isActive ? 1 : 0; }

  if (!$fields) {
    $db->rollBack();
    jsonResponse(false, null, 400, 'No fields to update');
  }

  $fields[] = 'updated_at = NOW()';
  $params[] = $id;

  $sql = 'UPDATE companies SET ' . implode(', ', $fields) . ' WHERE id = ?';
  $stmt = $db->prepare($sql);
  $stmt->execute($params);

  // Se o e-mail mudou, sincroniza o usuário role=company vinculado
  if ($email !== null) {
    // Garante unicidade de email em users
    $chk = $db->prepare('SELECT id FROM users WHERE email = ? AND role <> "company" LIMIT 1');
    $chk->execute([$email]);
    if ($chk->fetch(PDO::FETCH_ASSOC)) {
      $db->rollBack();
      jsonResponse(false, null, 409, 'Email already used by another user');
    }

    $upUser = $db->prepare('UPDATE users SET email = ?, updated_at = NOW() WHERE role = "company" AND company_id = ?');
    $upUser->execute([$email, $id]);
  }

  $db->commit();
  jsonResponse(true, ['id' => $id]);

} catch (PDOException $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 500, 'Database error: ' . $e->getMessage());
}
