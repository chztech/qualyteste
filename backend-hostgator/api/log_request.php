<?php
// Caminho do arquivo de log
$logFile = __DIR__ . '/request_log.txt';

// Captura data e hora
$log = "==== Requisição em " . date('Y-m-d H:i:s') . " ====\n";

// Captura método HTTP
$log .= "Método: " . $_SERVER['REQUEST_METHOD'] . "\n";

// Captura URL
$log .= "URL: " . $_SERVER['REQUEST_URI'] . "\n";

// Captura headers
$log .= "Headers:\n";
foreach (getallheaders() as $name => $value) {
    $log .= "  $name: $value\n";
}

// Captura corpo da requisição
$body = file_get_contents("php://input");
$log .= "Corpo:\n$body\n";

// Separador
$log .= "============================\n\n";

// Grava no arquivo
file_put_contents($logFile, $log, FILE_APPEND);

// Retorno simples para teste
echo json_encode([
    'success' => true,
    'message' => 'Requisição registrada no log'
]);
?>
