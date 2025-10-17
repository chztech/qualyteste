<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$database = new Database();
$db = $database->getConnection();

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
if ($id === '') {
  jsonResponse(false, null, 422, 'id is required');
}

try {
  $stmt = $db->prepare("SELECT id, name, address, phone, email, notes, public_token, created_at, updated_at FROM companies WHERE id = ? LIMIT 1");
  $stmt->execute([$id]);
  $company = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$company) jsonResponse(false, null, 404, 'Company not found');

  $emp = $db->prepare("SELECT id, company_id, name, phone, department, created_at, updated_at FROM employees WHERE company_id = ? ORDER BY name ASC");
  $emp->execute([$id]);
  $employees = $emp->fetchAll(PDO::FETCH_ASSOC);

  $company['employees'] = $employees;
  jsonResponse(true, $company);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'DB error: '.$e->getMessage());
}
