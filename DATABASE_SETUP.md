# 🗄️ CONFIGURAÇÃO DO BANCO MYSQL REMOTO

## 📋 **Passo a Passo para Configurar MySQL**

### **1. 🔧 Configurar Arquivo .env**

Edite o arquivo `.env` na raiz do projeto com seus dados:

```env
# 🗄️ MYSQL DATABASE - SUBSTITUA PELOS SEUS DADOS
VITE_DB_HOST=seu-servidor-mysql.com
VITE_DB_PORT=3306
VITE_DB_NAME=qualycorpore_db
VITE_DB_USER=seu_usuario
VITE_DB_PASS=sua_senha_segura

# 🌐 API BACKEND
VITE_API_URL=https://api.seudominio.com
VITE_API_KEY=sua-chave-api-segura
```

### **2. 🗄️ Criar Tabela no MySQL**

Execute este SQL no seu banco MySQL:

```sql
-- 📊 TABELA PARA CONFIGURAÇÕES DE LOGO
CREATE TABLE logo_configurations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  context ENUM('login', 'public') NOT NULL,
  imageUrl VARCHAR(500),
  width INT NOT NULL DEFAULT 80,
  height INT NOT NULL DEFAULT 80,
  backgroundColor VARCHAR(50) DEFAULT 'blue-600',
  borderRadius VARCHAR(50) DEFAULT 'rounded-lg',
  padding VARCHAR(50) DEFAULT 'p-4',
  showBackground BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 🔍 ÍNDICES PARA PERFORMANCE
  INDEX idx_context (context),
  INDEX idx_created (createdAt)
);

-- 📝 INSERIR CONFIGURAÇÕES PADRÃO
INSERT INTO logo_configurations (context, imageUrl, width, height, backgroundColor, borderRadius, padding, showBackground) VALUES
('login', '/logo_qualy.png', 80, 80, 'blue-600', 'rounded-lg', 'p-4', TRUE),
('public', '/logo_qualy.png', 100, 100, 'blue-600', 'rounded-xl', 'p-6', TRUE);
```

### **3. 🌐 Configurar API Backend (Node.js/Express)**

Crie um endpoint para gerenciar as configurações:

```javascript
// routes/logoConfig.js
const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// 🔧 CONFIGURAÇÃO DO MYSQL
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true'
};

// 🔍 GET - Buscar configurações
router.get('/logo-configs', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM logo_configurations ORDER BY context'
    );
    
    await connection.end();
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 💾 POST - Salvar configurações
router.post('/logo-configs', async (req, res) => {
  try {
    const { login, public: publicConfig } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    
    // 🔄 ATUALIZAR OU INSERIR CONFIGURAÇÃO DE LOGIN
    await connection.execute(`
      INSERT INTO logo_configurations 
      (context, imageUrl, width, height, backgroundColor, borderRadius, padding, showBackground)
      VALUES ('login', ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      imageUrl = VALUES(imageUrl),
      width = VALUES(width),
      height = VALUES(height),
      backgroundColor = VALUES(backgroundColor),
      borderRadius = VALUES(borderRadius),
      padding = VALUES(padding),
      showBackground = VALUES(showBackground),
      updatedAt = CURRENT_TIMESTAMP
    `, [
      login.imageUrl, login.width, login.height,
      login.backgroundColor, login.borderRadius, 
      login.padding, login.showBackground
    ]);
    
    // 🔄 ATUALIZAR OU INSERIR CONFIGURAÇÃO PÚBLICA
    await connection.execute(`
      INSERT INTO logo_configurations 
      (context, imageUrl, width, height, backgroundColor, borderRadius, padding, showBackground)
      VALUES ('public', ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      imageUrl = VALUES(imageUrl),
      width = VALUES(width),
      height = VALUES(height),
      backgroundColor = VALUES(backgroundColor),
      borderRadius = VALUES(borderRadius),
      padding = VALUES(padding),
      showBackground = VALUES(showBackground),
      updatedAt = CURRENT_TIMESTAMP
    `, [
      publicConfig.imageUrl, publicConfig.width, publicConfig.height,
      publicConfig.backgroundColor, publicConfig.borderRadius, 
      publicConfig.padding, publicConfig.showBackground
    ]);
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

### **4. 🔒 Configurações de Segurança**

#### **CORS (Cross-Origin):**
```javascript
// app.js
const cors = require('cors');

app.use(cors({
  origin: ['https://seudominio.com', 'http://localhost:5173'],
  credentials: true
}));
```

#### **Autenticação API:**
```javascript
// middleware/auth.js
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'API Key inválida'
    });
  }
  
  next();
};
```

### **5. 🚀 Provedores de MySQL Recomendados**

#### **Opções Gratuitas:**
- **🌐 PlanetScale**: MySQL serverless gratuito
- **🐘 Railway**: PostgreSQL/MySQL com tier gratuito
- **☁️ Aiven**: MySQL gerenciado com trial gratuito

#### **Opções Pagas:**
- **🌊 DigitalOcean**: MySQL Managed Database
- **☁️ AWS RDS**: Amazon Relational Database Service
- **🔵 Azure Database**: Microsoft MySQL

### **6. 🔧 Exemplo de Configuração Completa**

#### **Arquivo .env de Produção:**
```env
# 🗄️ MYSQL REMOTO (PlanetScale)
VITE_DB_HOST=aws.connect.psdb.cloud
VITE_DB_PORT=3306
VITE_DB_NAME=qualycorpore-main
VITE_DB_USER=seu_usuario_planetscale
VITE_DB_PASS=sua_senha_planetscale
VITE_DB_SSL=true

# 🌐 API BACKEND (Vercel/Netlify Functions)
VITE_API_URL=https://api.qualycorpore.vercel.app
VITE_API_KEY=qc_live_1234567890abcdef
```

### **7. 🧪 Testar Conexão**

No painel administrativo:
1. Vá em **"Personalizar Logo"**
2. Observe o status: **"MySQL Conectado"** 🟢
3. Clique em **"Reconectar"** para testar
4. Faça uma alteração e clique **"Salvar no MySQL"**

### **8. 📊 Monitoramento**

O sistema mostra:
- **Status de Conexão**: Verde/Vermelho/Amarelo
- **Última Atualização**: Timestamp da última sincronização
- **Logs Detalhados**: Console do navegador (modo debug)

---

## 🎯 **Resumo dos Arquivos:**

1. **`.env`** - Configurações do banco (PRINCIPAL)
2. **`DATABASE_SETUP.md`** - Este guia completo
3. **`logoConfigService.ts`** - Serviço de comunicação
4. **`LogoCustomization.tsx`** - Interface de configuração

**Configure o arquivo `.env` com seus dados do MySQL e o sistema estará pronto! 🚀**