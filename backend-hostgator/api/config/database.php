<?php

class Database {
    private $host = "localhost";
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->db_name = getenv('DB_NAME') ?: null;
        $this->username = getenv('DB_USER') ?: null;
        $this->password = getenv('DB_PASS') ?: null;
    }

    public function getConnection() {
        $this->conn = null;

        try {
            if (!$this->db_name || !$this->username || $this->password === null) {
                throw new RuntimeException('Database credentials are not configured. Set DB_NAME, DB_USER and DB_PASS environment variables.');
            }

            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                )
            );
        } catch (Throwable $exception) {
            error_log("Connection error: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode(array("success" => false, "error" => "Database connection failed"));
            exit();
        }

        return $this->conn;
    }
}

?>
