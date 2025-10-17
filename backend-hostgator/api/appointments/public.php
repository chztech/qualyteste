<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 405, 'Method not allowed');
}

$database = new Database();
$db = $database->getConnection();

$companyId = isset($_GET['companyId']) ? trim($_GET['companyId']) : '';
if ($companyId === '') {
  jsonResponse(false, null, 422, 'companyId is required');
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
