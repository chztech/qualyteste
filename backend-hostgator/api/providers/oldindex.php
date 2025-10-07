<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_end(405, ['success' => false, 'error' => 'Method not allowed']);
}

$db = (new Database())->getConnection();

$companyId = isset($_GET['companyId']) ? trim($_GET['companyId']) : null;
$isActive  = isset($_GET['isActive']) ? $_GET['isActive'] : null;

$sql = "SELECT p.id, p.user_id, u.name, u.email, u.phone, u.role, u.company_id, u.is_active, 
               p.specialties, p.working_hours, p.breaks, p.created_at, p.updated_at
        FROM providers p
        JOIN users u ON u.id = p.user_id";
$conds = [];
$params = [];

if ($companyId !== null && $companyId !== '') {
    $conds[] = "u.company_id = ?";
    $params[] = $companyId;
}
if ($isActive !== null && $isActive !== '') {
    $conds[] = "u.is_active = ?";
    $params[] = (intval($isActive) ? 1 : 0);
}
if ($conds) {
    $sql .= " WHERE " . implode(" AND ", $conds);
}
$sql .= " ORDER BY u.name ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as &$r) {
    foreach (['specialties','working_hours','breaks'] as $j) {
        if (isset($r[$j]) && $r[$j] !== null && $r[$j] !== '') {
            $decoded = json_decode($r[$j], true);
            if ($decoded !== null) $r[$j] = $decoded;
        }
    }
}

json_end(200, ['success' => true, 'data' => $rows]);
