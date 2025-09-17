# 🌐 GUIA DE INTEGRAÇÃO COM BACK-END

## 📋 **Sistema Pronto para Back-End**

O sistema QualyCorpore está completamente estruturado para integração com back-end. Aqui está o guia completo:

## 🏗️ **Arquitetura Backend Recomendada**

### **Stack Tecnológica:**
- **Node.js + Express** ou **NestJS** (TypeScript)
- **MySQL** ou **PostgreSQL** (banco principal)
- **Redis** (cache e sessões)
- **JWT** (autenticação)
- **Socket.io** (tempo real)

### **Estrutura de Pastas Backend:**
```
backend/
├── src/
│   ├── controllers/     # Controladores das rotas
│   ├── services/        # Lógica de negócio
│   ├── models/          # Modelos do banco
│   ├── middleware/      # Middlewares
│   ├── routes/          # Definição das rotas
│   ├── utils/           # Utilitários
│   └── types/           # Tipos TypeScript
├── migrations/          # Migrações do banco
├── seeds/              # Dados iniciais
└── tests/              # Testes automatizados
```

## 🗄️ **Estrutura do Banco de Dados**

### **Tabelas Principais:**

#### **users**
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'company', 'provider') NOT NULL,
  company_id VARCHAR(36),
  active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_company (company_id)
);
```

#### **companies**
```sql
CREATE TABLE companies (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  contact_person VARCHAR(255),
  public_token VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_token (public_token),
  INDEX idx_active (active)
);
```

#### **employees**
```sql
CREATE TABLE employees (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  department VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_company (company_id),
  INDEX idx_name (name)
);
```

#### **providers**
```sql
CREATE TABLE providers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  specialties JSON NOT NULL,
  working_hours JSON NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_active (active)
);
```

#### **services**
```sql
CREATE TABLE services (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration INT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_duration (duration),
  INDEX idx_active (active)
);
```

#### **appointments**
```sql
CREATE TABLE appointments (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36),
  employee_id VARCHAR(36),
  provider_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INT NOT NULL,
  service VARCHAR(255) NOT NULL,
  status ENUM('scheduled', 'confirmed', 'cancelled', 'completed') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE RESTRICT,
  
  INDEX idx_date (date),
  INDEX idx_provider_date (provider_id, date),
  INDEX idx_company_date (company_id, date),
  INDEX idx_status (status),
  
  UNIQUE KEY unique_provider_slot (provider_id, date, start_time)
);
```

## 🌐 **Endpoints da API**

### **Autenticação:**
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### **Usuários:**
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
PUT    /api/users/:id/password
```

### **Empresas:**
```
GET    /api/companies
POST   /api/companies
GET    /api/companies/:id
PUT    /api/companies/:id
DELETE /api/companies/:id
GET    /api/companies/:id/employees
POST   /api/companies/:id/employees
PUT    /api/companies/:id/employees/:employeeId
DELETE /api/companies/:id/employees/:employeeId
```

### **Prestadores:**
```
GET    /api/providers
POST   /api/providers
GET    /api/providers/:id
PUT    /api/providers/:id
DELETE /api/providers/:id
GET    /api/providers/:id/availability
```

### **Serviços:**
```
GET    /api/services
POST   /api/services
GET    /api/services/:id
PUT    /api/services/:id
DELETE /api/services/:id
```

### **Agendamentos:**
```
GET    /api/appointments
POST   /api/appointments
POST   /api/appointments/bulk
GET    /api/appointments/:id
PUT    /api/appointments/:id
DELETE /api/appointments/:id
DELETE /api/appointments/company/:companyId
GET    /api/appointments/availability
GET    /api/appointments/available-slots
```

### **Agendamento Público:**
```
GET    /api/public/booking/:token
POST   /api/public/booking/:token
```

### **Relatórios:**
```
GET    /api/reports
GET    /api/reports/export
```

### **Configurações:**
```
GET    /api/settings/logo
PUT    /api/settings/logo
GET    /api/settings/system
PUT    /api/settings/system
```

## 🔧 **Implementação Backend (Exemplo Express)**

### **Controller de Agendamentos:**
```javascript
// controllers/appointmentController.js
const appointmentService = require('../services/appointmentService');

exports.getAppointments = async (req, res) => {
  try {
    const { date, companyId, providerId, status, page = 1, limit = 50 } = req.query;
    
    const appointments = await appointmentService.getAppointments({
      date,
      companyId,
      providerId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: appointments.data,
      pagination: appointments.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createBulkAppointments = async (req, res) => {
  try {
    const { appointments, metadata } = req.body;
    
    const result = await appointmentService.createBulkAppointments(
      appointments,
      metadata
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
```

### **Service de Agendamentos:**
```javascript
// services/appointmentService.js
const Appointment = require('../models/Appointment');
const Provider = require('../models/Provider');

exports.createBulkAppointments = async (appointments, metadata) => {
  const transaction = await db.transaction();
  
  try {
    const created = [];
    const failed = [];
    
    for (const appointmentData of appointments) {
      try {
        // Validar disponibilidade
        const isAvailable = await checkProviderAvailability(
          appointmentData.providerId,
          appointmentData.date,
          appointmentData.startTime,
          appointmentData.duration
        );
        
        if (!isAvailable) {
          failed.push({
            data: appointmentData,
            error: 'Prestador não disponível neste horário'
          });
          continue;
        }
        
        // Criar agendamento
        const appointment = await Appointment.create({
          ...appointmentData,
          endTime: calculateEndTime(appointmentData.startTime, appointmentData.duration)
        }, { transaction });
        
        created.push(appointment);
        
      } catch (error) {
        failed.push({
          data: appointmentData,
          error: error.message
        });
      }
    }
    
    await transaction.commit();
    
    return {
      created: created.length,
      failed: failed.length,
      errors: failed.map(f => f.error),
      appointments: created
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

## 🔄 **Migração do LocalStorage**

### **Passo 1: Configurar Ambiente**
```javascript
// No frontend, alterar configuração
const config = {
  useLocalStorage: false, // Mudar para false
  syncInterval: 30000,    // Sincronizar a cada 30s
  enableOfflineMode: true // Manter cache local
};
```

### **Passo 2: Migrar Dados Existentes**
```javascript
// Hook para migração
const { migrateToBackend } = useBackendIntegration('appointments', [], config);

// Executar migração
await migrateToBackend();
```

### **Passo 3: Configurar Variáveis de Ambiente**
```env
# .env.production
VITE_API_URL=https://api.qualycorpore.com
VITE_DB_HOST=mysql.qualycorpore.com
VITE_DB_NAME=qualycorpore_prod
VITE_DB_USER=qualycorpore_user
VITE_DB_PASS=senha_segura
```

## 🚀 **Deploy Backend**

### **Opções Recomendadas:**
- **Vercel** (Node.js + Serverless)
- **Railway** (Full Stack + Database)
- **DigitalOcean App Platform**
- **AWS ECS** (Containerizado)
- **Google Cloud Run**

### **Docker Configuration:**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📊 **Monitoramento e Logs**

### **Ferramentas Recomendadas:**
- **Sentry** (Error tracking)
- **LogRocket** (Session replay)
- **DataDog** (APM)
- **New Relic** (Performance)

## 🔒 **Segurança**

### **Implementações Necessárias:**
- **Rate Limiting** (express-rate-limit)
- **CORS** configurado
- **Helmet.js** (Security headers)
- **Input Validation** (Joi/Yup)
- **SQL Injection Protection** (Prepared statements)
- **XSS Protection**
- **CSRF Protection**

## 📱 **Tempo Real**

### **WebSocket Implementation:**
```javascript
// Real-time updates
io.on('connection', (socket) => {
  socket.on('join-company', (companyId) => {
    socket.join(`company-${companyId}`);
  });
  
  // Notificar novos agendamentos
  socket.to(`company-${companyId}`).emit('new-appointment', appointmentData);
});
```

**O sistema está 100% pronto para integração com back-end! 🚀**

Todos os tipos, interfaces, serviços e hooks estão estruturados para uma migração suave do localStorage para API real.