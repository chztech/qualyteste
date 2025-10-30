<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$database = new Database();
$db = $database->getConnection();

$companyIdParam = isset($_GET['companyId']) ? trim((string)$_GET['companyId']) : '';
$companyToken = isset($_GET['companyToken']) ? trim((string)$_GET['companyToken']) : '';

if (!function_exists('resolveCompanyId')) {
  function resolveCompanyId(PDO $db, string $token): ?string {
    if ($token === '') {
      return null;
    }

    $stmt = $db->prepare('SELECT id FROM companies WHERE public_token = ? LIMIT 1');
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row['id'])) {
      return $row['id'];
    }

    $decoded = base64_decode($token, true);
    if ($decoded !== false && $decoded !== '') {
      $stmt = $db->prepare('SELECT id FROM companies WHERE id = ? LIMIT 1');
      $stmt->execute([$decoded]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($row && isset($row['id'])) {
        return $row['id'];
      }
    }

    $stmt = $db->prepare('SELECT id FROM companies WHERE id = ? LIMIT 1');
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && isset($row['id'])) {
      return $row['id'];
    }

    return null;
  }
}

$companyId = null;
if ($companyToken !== '') {
  $companyId = resolveCompanyId($db, $companyToken);
} elseif ($companyIdParam !== '') {
  $companyId = $companyIdParam;
}

if (!$companyId) {
  jsonResponse(false, null, 404, 'Company not found for provided token');
}

try {
  // slots da empresa que ainda NÃO têm colaborador, no futuro
  $sql = "
    SELECT
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
      s.name AS service_name,
      p.name AS provider_name
    FROM appointments a
    LEFT JOIN services s   ON s.id = a.service_id
    LEFT JOIN providers pr ON pr.id = a.provider_id
    LEFT JOIN users p      ON p.id = pr.user_id
    WHERE a.company_id = ?
      AND (a.employee_id IS NULL OR a.employee_id = '')
      AND a.status IN ('scheduled', 'confirmed')
      AND CONCAT(a.date, ' ', a.start_time) >= NOW()
    ORDER BY a.date ASC, a.start_time ASC
  ";
  $stmt = $db->prepare($sql);
  $stmt->execute([$companyId]);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  jsonResponse(true, $rows);
} catch (PDOException $e) {
  jsonResponse(false, null, 500, 'DB error: '.$e->getMessage());
}
