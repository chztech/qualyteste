<?php
require_once '../config/cors.php';
require_once '../helpers/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, 405, 'Method not allowed');
}

requireAuth();
$database = new Database();
$db = $database->getConnection();

$dateStart = isset($_GET['dateStart']) ? trim($_GET['dateStart']) : null;
$dateEnd = isset($_GET['dateEnd']) ? trim($_GET['dateEnd']) : null;

try {
    $filters = [];
    $params = [];

    if ($dateStart) {
        $filters[] = 'date >= ?';
        $params[] = $dateStart;
    }
    if ($dateEnd) {
        $filters[] = 'date <= ?';
        $params[] = $dateEnd;
    }

    $whereClause = $filters ? (' WHERE ' . implode(' AND ', $filters)) : '';

    $totalStmt = $db->prepare('SELECT COUNT(*) as total FROM appointments' . $whereClause);
    $totalStmt->execute($params);
    $totalAppointments = (int) $totalStmt->fetch(PDO::FETCH_ASSOC)['total'];

    $statusStmt = $db->prepare('SELECT status, COUNT(*) as total FROM appointments' . $whereClause . ' GROUP BY status');
    $statusStmt->execute($params);
    $statusCounts = [];
    foreach ($statusStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $statusCounts[$row['status']] = (int) $row['total'];
    }

    $companyStmt = $db->prepare(
        'SELECT c.name, COUNT(*) as total FROM appointments a ' .
        'INNER JOIN companies c ON a.company_id = c.id ' .
        $whereClause .
        ' GROUP BY c.name ORDER BY total DESC LIMIT 5'
    );
    $companyStmt->execute($params);
    $topCompanies = $companyStmt->fetchAll(PDO::FETCH_ASSOC);

    $serviceStmt = $db->prepare(
        'SELECT s.name, COUNT(*) as total FROM appointments a ' .
        'LEFT JOIN services s ON a.service_id = s.id ' .
        $whereClause .
        ' GROUP BY s.name ORDER BY total DESC LIMIT 5'
    );
    $serviceStmt->execute($params);
    $topServices = $serviceStmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, [
        'totalAppointments' => $totalAppointments,
        'statusCounts' => $statusCounts,
        'topCompanies' => $topCompanies,
        'topServices' => $topServices
    ]);
} catch (PDOException $exception) {
    jsonResponse(false, null, 500, 'Failed to generate report: ' . $exception->getMessage());
}
