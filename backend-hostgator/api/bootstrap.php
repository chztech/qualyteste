<?php
// NADA antes desta linha (sem BOM, sem espaços)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
if (!is_dir(__DIR__ . '/../logs')) { @mkdir(__DIR__ . '/../logs', 0775, true); }
ini_set('error_log', __DIR__ . '/../logs/php-error.log');

if (function_exists('header')) {
  header('Content-Type: application/json; charset=UTF-8');
}

// Output buffering para evitar lixo fora do JSON
if (ob_get_level() === 0) { ob_start(); }

// Handlers que SEMPRE retornam JSON
set_exception_handler(function ($e) {
  if (ob_get_length() !== false) { @ob_clean(); }
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error'   => 'Internal server error',
    // Em produção, deixe comentado. Descomente provisoriamente para depurar:
    // 'debug'   => ['type' => get_class($e), 'message' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]
  ]);
  exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
  // Converte warnings/notices em Exception para cair no JSON
  throw new ErrorException($message, 0, $severity, $file, $line);
});

// Função util para finalizar resposta JSON sem vazamento
function json_end($status, $payload) {
  if (ob_get_length() !== false) { @ob_clean(); }
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}
