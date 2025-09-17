# 🚀 INTEGRAÇÃO HOSTGATOR MYSQL + NETLIFY - GUIA COMPLETO

## 📋 VISÃO GERAL

Este guia detalha como integrar o sistema QualyCorpore com MySQL da HostGator e hospedar o frontend no Netlify, criando uma solução robusta e econômica.

---

## 🏗️ ARQUITETURA PROPOSTA

### **Estrutura Completa:**
```
Frontend (Netlify)    Backend (HostGator)     Database (HostGator)
┌─────────────────┐   ┌─────────────────┐    ┌─────────────────┐
│ React + TS      │   │ PHP/Node.js API │    │ MySQL Database  │
│ Build: Static   │◄──┤ REST Endpoints  │◄───┤ cPanel MySQL    │
│ Deploy: Auto    │   │ JWT Auth        │    │ phpMyAdmin      │
│ CDN Global      │   │ CORS Headers    │    │ Backups Auto    │
└─────────────────┘   └─────────────────┘    └─────────────────┘
```

---

## 🗄️ PARTE 1: CONFIGURAÇÃO DO MYSQL NA HOSTGATOR

### **1.1 Criar Banco de Dados**

#### **Via cPanel:**
1. Acesse o **cPanel** da HostGator
2. Vá em **"Bancos de Dados MySQL"**
3. Crie um novo banco: `qualycorpore`
4. Crie um usuário: `qualycorpore_user`
5. Defina uma senha forte
6. Associe o usuário ao banco com **"Todos os privilégios"**

#### **Informações de Conexão:**
```
Host: localhost (ou IP fornecido pela HostGator)
Database: cpanel_user_qualycorpore
Username: cpanel_user_qualycorpore_user
Password: sua_senha_forte
Port: 3306
```

### **1.2 Schema do Banco de Dados**

#### **Executar via phpMyAdmin:**
```sql
-- =============================================
-- QUALYCORPORE - MYSQL SCHEMA HOSTGATOR
-- =============================================

-- Configurações iniciais
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- 1. USUÁRIOS
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'client', 'provider', 'company') NOT NULL,
    company_id VARCHAR(36) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. EMPRESAS
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    public_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_public_token (public_token),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. COLABORADORES
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRESTADORES
CREATE TABLE providers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    specialties JSON,
    working_hours JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SERVIÇOS
CREATE TABLE services (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration INT NOT NULL, -- em minutos
    description TEXT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AGENDAMENTOS
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36),
    employee_id VARCHAR(36),
    service_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INT NOT NULL, -- em minutos
    status ENUM('scheduled', 'confirmed', 'cancelled', 'completed') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    
    INDEX idx_date (date),
    INDEX idx_provider_date (provider_id, date),
    INDEX idx_company_date (company_id, date),
    INDEX idx_status (status),
    
    UNIQUE KEY unique_provider_datetime (provider_id, date, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LOGS DE AUDITORIA
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(255),
    record_id VARCHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Usuário administrador padrão
INSERT INTO users (id, name, email, password_hash, role) VALUES 
(UUID(), 'Administrador', 'admin@admin.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Serviços padrão
INSERT INTO services (id, name, duration, description, price) VALUES 
(UUID(), 'Quick Massage', 15, 'Massagem rápida para alívio de tensões', 30.00),
(UUID(), 'Massagem Relaxante', 60, 'Massagem completa para relaxamento', 80.00),
(UUID(), 'Massagem Desportiva', 45, 'Massagem focada em músculos específicos', 70.00),
(UUID(), 'Massagem Terapêutica', 90, 'Massagem para tratamento de dores específicas', 120.00);

-- Empresas de exemplo
INSERT INTO companies (id, name, address, phone, email, public_token) VALUES 
(UUID(), 'Tech Solutions Ltda', 'Av. Paulista, 1000 - São Paulo, SP', '(11) 3333-3333', 'empresa@techsolutions.com', 'tech_solutions_token'),
(UUID(), 'Inovação Corp', 'Rua da Inovação, 500 - São Paulo, SP', '(11) 2222-2222', 'contato@inovacaocorp.com', 'inovacao_corp_token');

SET FOREIGN_KEY_CHECKS = 1;
```

---

## 🔧 PARTE 2: BACKEND API NA HOSTGATOR

### **2.1 Estrutura do Backend PHP**

#### **Estrutura de Arquivos:**
```
public_html/
├── api/
│   ├── config/
│   │   ├── database.php
│   │   └── cors.php
│   ├── auth/
│   │   ├── login.php
│   │   ├── register.php
│   │   └── verify.php
│   ├── users/
│   │   ├── index.php
│   │   ├── create.php
│   │   └── update.php
│   ├── companies/
│   │   ├── index.php
│   │   ├── create.php
│   │   └── update.php
│   ├── providers/
│   │   ├── index.php
│   │   ├── create.php
│   │   └── update.php
│   ├── appointments/
│   │   ├── index.php
│   │   ├── create.php
│   │   ├── update.php
│   │   └── delete.php
│   ├── reports/
│   │   └── index.php
│   └── .htaccess
```

### **2.2 Configuração da API**

#### **api/config/database.php**
```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "cpanel_user_qualycorpore";
    private $username = "cpanel_user_qualycorpore_user";
    private $password = "sua_senha_forte";
    public $conn;

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
```

#### **api/config/cors.php**
```php
<?php
// Headers CORS para permitir requisições do Netlify
header("Access-Control-Allow-Origin: https://seu-site.netlify.app");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Responder a requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
```

#### **api/.htaccess**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Headers de segurança
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Permitir CORS
Header always set Access-Control-Allow-Origin "https://seu-site.netlify.app"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
```

### **2.3 Endpoints Principais**

#### **api/auth/login.php**
```php
<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("success" => false, "error" => "Method not allowed"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "error" => "Email and password required"));
    exit();
}

try {
    $query = "SELECT id, name, email, password_hash, role, company_id FROM users WHERE email = ? AND is_active = TRUE";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->email]);
    
    if ($stmt->rowCount() == 0) {
        http_response_code(401);
        echo json_encode(array("success" => false, "error" => "Invalid credentials"));
        exit();
    }
    
    $user = $stmt->fetch();
    
    if (!password_verify($data->password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(array("success" => false, "error" => "Invalid credentials"));
        exit();
    }
    
    // Gerar JWT (versão simplificada)
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $user['id'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60) // 24 horas
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, 'sua_chave_secreta_jwt', true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    $jwt = $base64Header . "." . $base64Payload . "." . $base64Signature;
    
    echo json_encode(array(
        "success" => true,
        "data" => array(
            "user" => array(
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $user['role'],
                "companyId" => $user['company_id']
            ),
            "token" => $jwt
        )
    ));
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("success" => false, "error" => "Internal server error"));
}
?>
```

#### **api/appointments/index.php**
```php
<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// Função para verificar JWT
function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
    $signature = $parts[2];
    
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
        base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], 'sua_chave_secreta_jwt', true))
    );
    
    if ($signature !== $expectedSignature) return false;
    
    $payloadData = json_decode($payload, true);
    if ($payloadData['exp'] < time()) return false;
    
    return $payloadData;
}

// Verificar autenticação
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(array("success" => false, "error" => "Token required"));
    exit();
}

$user = verifyJWT($matches[1]);
if (!$user) {
    http_response_code(401);
    echo json_encode(array("success" => false, "error" => "Invalid token"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "
            SELECT a.*, u.name as client_name, p.name as provider_name, 
                   c.name as company_name, e.name as employee_name, s.name as service_name
            FROM appointments a
            LEFT JOIN users u ON a.client_id = u.id
            LEFT JOIN providers p ON a.provider_id = p.id
            LEFT JOIN companies c ON a.company_id = c.id
            LEFT JOIN employees e ON a.employee_id = e.id
            LEFT JOIN services s ON a.service_id = s.id
        ";
        
        $params = [];
        
        // Filtros baseados no role
        if ($user['role'] === 'company') {
            $query .= " WHERE a.company_id = ?";
            $params[] = $user['company_id'];
        } elseif ($user['role'] === 'provider') {
            $query .= " WHERE a.provider_id = (SELECT id FROM providers WHERE user_id = ?)";
            $params[] = $user['user_id'];
        }
        
        $query .= " ORDER BY a.date DESC, a.start_time DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll();
        
        echo json_encode(array("success" => true, "data" => $appointments));
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "error" => "Internal server error"));
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    try {
        $id = bin2hex(random_bytes(16)); // Gerar UUID simples
        
        $query = "INSERT INTO appointments (id, client_id, provider_id, company_id, employee_id, service_id, date, start_time, end_time, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            $id,
            $data->clientId,
            $data->providerId,
            $data->companyId,
            $data->employeeId,
            $data->serviceId,
            $data->date,
            $data->startTime,
            $data->endTime,
            $data->duration,
            $data->notes
        ]);
        
        echo json_encode(array("success" => true, "data" => array("id" => $id)));
        
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("success" => false, "error" => "Internal server error"));
    }
}
?>
```

---

## 🌐 PARTE 3: CONFIGURAÇÃO DO FRONTEND NO NETLIFY

### **3.1 Ajustes no Frontend**

#### **src/services/apiService.ts**
```typescript
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // URL da API na HostGator
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://seudominio.com.br/api' 
      : 'http://localhost/qualycorpore/api';
    
    this.token = localStorage.getItem('authToken');
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Para cookies se necessário
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão'
      };
    }
  }

  // Métodos da API permanecem os mesmos...
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getAppointments(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any[]>(`/appointments${queryString}`);
  }

  // ... outros métodos
}

export const apiService = new ApiService();
export default apiService;
```

### **3.2 Variáveis de Ambiente**

#### **.env.production**
```env
VITE_API_URL=https://seudominio.com.br/api
VITE_APP_NAME=QualyCorpore
```

#### **.env.development**
```env
VITE_API_URL=http://localhost/qualycorpore/api
VITE_APP_NAME=QualyCorpore Dev
```

### **3.3 Configuração do Netlify**

#### **netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_URL = "https://seudominio.com.br/api"

[context.deploy-preview.environment]
  VITE_API_URL = "https://seudominio.com.br/api"
```

---

## 🚀 PARTE 4: DEPLOY E CONFIGURAÇÃO

### **4.1 Deploy do Backend na HostGator**

#### **Via cPanel File Manager:**
1. Acesse o **cPanel**
2. Vá em **"Gerenciador de Arquivos"**
3. Navegue até `public_html`
4. Crie a pasta `api`
5. Faça upload dos arquivos PHP
6. Configure as permissões (755 para pastas, 644 para arquivos)

#### **Via FTP:**
```bash
# Usando FileZilla ou similar
# Host: ftp.seudominio.com.br
# Usuário: seu_usuario_cpanel
# Senha: sua_senha_cpanel
# Porta: 21
```

### **4.2 Deploy do Frontend no Netlify**

#### **Método 1: GitHub Integration (Recomendado)**
```bash
# 1. Commit e push para GitHub
git add .
git commit -m "Add HostGator MySQL integration"
git push origin main

# 2. No Netlify Dashboard:
# - New site from Git
# - Connect to GitHub
# - Select repository
# - Build command: npm run build
# - Publish directory: dist
# - Deploy site
```

#### **Método 2: Netlify CLI**
```bash
# Instalar CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### **4.3 Configurações de Segurança**

#### **HostGator - Configurações PHP:**
```php
// php.ini ou .htaccess
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/error.log');

// Limitar tamanho de upload
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');

// Timeout
ini_set('max_execution_time', 30);
```

#### **Netlify - Headers de Segurança:**
```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://seudominio.com.br"
```

---

## 📊 MONITORAMENTO E MANUTENÇÃO

### **5.1 Logs e Debugging**

#### **HostGator - Logs PHP:**
```php
// Adicionar em cada endpoint
error_log("API Call: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);
error_log("User: " . json_encode($user));
error_log("Data: " . file_get_contents("php://input"));
```

#### **Frontend - Error Tracking:**
```typescript
// src/utils/errorTracking.ts
export const logError = (error: any, context: string) => {
  console.error(`[${context}]`, error);
  
  // Enviar para serviço de monitoramento se necessário
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, etc.
  }
};
```

### **5.2 Backup e Segurança**

#### **Backup Automático MySQL:**
```bash
# Script para backup (executar via cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h localhost -u usuario -psenha qualycorpore > backup_$DATE.sql
```

#### **Monitoramento de Performance:**
```php
// Adicionar em endpoints críticos
$start_time = microtime(true);

// ... código da API ...

$end_time = microtime(true);
$execution_time = ($end_time - $start_time) * 1000; // em ms

if ($execution_time > 1000) { // Log se > 1 segundo
    error_log("Slow query detected: " . $execution_time . "ms");
}
```

---

## 💡 OTIMIZAÇÕES E MELHORIAS

### **6.1 Performance**

#### **MySQL - Índices e Otimizações:**
```sql
-- Adicionar índices para consultas frequentes
CREATE INDEX idx_appointments_date_provider ON appointments(date, provider_id);
CREATE INDEX idx_appointments_company_date ON appointments(company_id, date);

-- Otimizar consultas
ANALYZE TABLE appointments;
OPTIMIZE TABLE appointments;
```

#### **PHP - Cache e Otimizações:**
```php
// Implementar cache simples
class SimpleCache {
    private $cacheDir = '/tmp/api_cache/';
    
    public function get($key) {
        $file = $this->cacheDir . md5($key) . '.cache';
        if (file_exists($file) && (time() - filemtime($file)) < 300) { // 5 min
            return json_decode(file_get_contents($file), true);
        }
        return null;
    }
    
    public function set($key, $data) {
        if (!is_dir($this->cacheDir)) mkdir($this->cacheDir, 0755, true);
        file_put_contents($this->cacheDir . md5($key) . '.cache', json_encode($data));
    }
}
```

### **6.2 Segurança Avançada**

#### **Rate Limiting:**
```php
// Implementar rate limiting simples
function checkRateLimit($ip, $limit = 100, $window = 3600) {
    $file = '/tmp/rate_limit_' . md5($ip);
    $requests = file_exists($file
