<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_end(405, ['success' => false, 'error' => 'Method not allowed']);
}

$db = (new Database())->getConnection();

$companyId = isset($_GET['companyId']) ? trim($_GET['companyId']) : null; // opcional: via users.company_id
$isActive  = isset($_GET['isActive']) ? $_GET['isActive'] : null;

$sql = "SELECT 
          p.id, p.user_id, p.name, p.email, p.phone, 
          p.specialties, p.working_hours, p.breaks, 
          p.is_active, p.created_at, p.updated_at
        FROM providers p";
$conds = [];
$params = [];

// Se quiser filtrar por empresa, fazemos LEFT JOIN users só para company_id:
if ($companyId !== null && $companyId !== '') {
  $sql = "SELECT 
            p.id, p.user_id, p.name, p.email, p.phone, 
            p.specialties, p.working_hours, p.breaks, 
            p.is_active, p.created_at, p.updated_at
          FROM providers p
          LEFT JOIN users u ON u.id = p.user_id";
  $conds[]  = "u.company_id = ?";
  $params[] = $companyId;
}

if ($isActive !== null && $isActive !== '') {
  $conds[]  = "p.is_active = ?";
  $params[] = (intval($isActive) ? 1 : 0);
}

if ($conds) {
  $sql .= " WHERE " . implode(" AND ", $conds);
}
$sql .= " ORDER BY p.name ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Decodifica JSON e normaliza
foreach ($rows as &$r) {
  foreach (['specialties','working_hours','breaks'] as $j) {
    if (isset($r[$j]) && $r[$j] !== '' && $r[$j] !== null) {
      $dec = json_decode($r[$j], true);
      if (json_last_error() === JSON_ERROR_NONE) $r[$j] = $dec;
    } else {
      $r[$j] = ($j === 'working_hours') ? null : [];
    }
  }
  $r['is_active'] = isset($r['is_active']) ? (bool)intval($r['is_active']) : true;
}

json_end(200, ['success' => true, 'data' => $rows]);
