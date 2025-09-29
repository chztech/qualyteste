<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/config/database.php';


try {
    $db = (new Database())->getConnection();
    echo "Conexão OK!";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
