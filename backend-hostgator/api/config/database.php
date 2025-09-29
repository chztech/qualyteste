<?php
class Database {
    private $host = "localhost";
    private $db_name; // Substitua pelo nome real do seu banco
    private $username; // Substitua pelo usuário real
    private $password; // Substitua pela senha real
    public $conn;

    public function __construct() {
        $this->db_name = getenv('DB_NAME') ?: 'chztec51_qualycorpore';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') ?: '';
    }


    public function getConnection() {
        $this->conn = null;
        
        try {
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
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode(array("success" => false, "error" => "Database connection failed"));
            exit();
        }
        
        return $this->conn;
    }
}
?>
