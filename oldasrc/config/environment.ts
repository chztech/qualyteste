// 🌐 CONFIGURAÇÃO DE AMBIENTE - BACKEND READY

export interface EnvironmentConfig {
  // 🌐 API
  apiUrl: string;
  apiTimeout: number;
  apiRetries: number;
  
  // 🔐 AUTENTICAÇÃO
  jwtSecret?: string;
  tokenExpiration: number;
  refreshTokenExpiration: number;
  
  // 🗄️ BANCO DE DADOS
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    connectionLimit: number;
  };
  
  // 📧 EMAIL
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    apiKey?: string;
    from: string;
  };
  
  // 📱 SMS
  sms: {
    provider: 'twilio' | 'nexmo' | 'aws-sns';
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    from: string;
  };
  
  // 📁 STORAGE
  storage: {
    provider: 'local' | 's3' | 'cloudinary';
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    publicUrl?: string;
  };
  
  // 🔄 CACHE
  cache: {
    provider: 'memory' | 'redis';
    host?: string;
    port?: number;
    password?: string;
    ttl: number;
  };
  
  // 📊 LOGS
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file: boolean;
    console: boolean;
    database: boolean;
  };
  
  // 🔒 SEGURANÇA
  security: {
    corsOrigins: string[];
    rateLimitWindow: number;
    rateLimitMax: number;
    encryptionKey: string;
  };
  
  // 🎯 FEATURES
  features: {
    realTimeUpdates: boolean;
    offlineMode: boolean;
    multiTenant: boolean;
    analytics: boolean;
    notifications: boolean;
  };
}

// 🌍 CONFIGURAÇÕES POR AMBIENTE
const environments: Record<string, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    apiTimeout: 10000,
    apiRetries: 3,
    
    tokenExpiration: 24 * 60 * 60, // 24 horas
    refreshTokenExpiration: 7 * 24 * 60 * 60, // 7 dias
    
    database: {
      host: 'localhost',
      port: 3306,
      name: 'qualycorpore_dev',
      user: 'root',
      password: '',
      ssl: false,
      connectionLimit: 10
    },
    
    email: {
      provider: 'smtp',
      host: 'localhost',
      port: 1025,
      user: '',
      password: '',
      from: 'noreply@qualycorpore.local'
    },
    
    sms: {
      provider: 'twilio',
      from: '+1234567890'
    },
    
    storage: {
      provider: 'local',
      publicUrl: 'http://localhost:3001/uploads'
    },
    
    cache: {
      provider: 'memory',
      ttl: 300 // 5 minutos
    },
    
    logging: {
      level: 'debug',
      file: true,
      console: true,
      database: false
    },
    
    security: {
      corsOrigins: ['http://localhost:5173', 'http://localhost:3000'],
      rateLimitWindow: 15 * 60 * 1000, // 15 minutos
      rateLimitMax: 100,
      encryptionKey: 'dev-encryption-key-change-in-production'
    },
    
    features: {
      realTimeUpdates: true,
      offlineMode: true,
      multiTenant: false,
      analytics: false,
      notifications: true
    }
  },
  
  production: {
    apiUrl: process.env.VITE_API_URL || 'https://api.qualycorpore.com',
    apiTimeout: 30000,
    apiRetries: 5,
    
    tokenExpiration: 8 * 60 * 60, // 8 horas
    refreshTokenExpiration: 30 * 24 * 60 * 60, // 30 dias
    
    database: {
      host: process.env.VITE_DB_HOST || 'localhost',
      port: Number(process.env.VITE_DB_PORT) || 3306,
      name: process.env.VITE_DB_NAME || 'qualycorpore_prod',
      user: process.env.VITE_DB_USER || 'root',
      password: process.env.VITE_DB_PASS || '',
      ssl: process.env.VITE_DB_SSL === 'true',
      connectionLimit: 50
    },
    
    email: {
      provider: 'sendgrid',
      apiKey: process.env.VITE_SENDGRID_API_KEY || '',
      from: 'noreply@qualycorpore.com'
    },
    
    sms: {
      provider: 'twilio',
      accountSid: process.env.VITE_TWILIO_ACCOUNT_SID || '',
      authToken: process.env.VITE_TWILIO_AUTH_TOKEN || '',
      from: process.env.VITE_TWILIO_PHONE || ''
    },
    
    storage: {
      provider: 's3',
      bucket: process.env.VITE_S3_BUCKET || '',
      region: process.env.VITE_S3_REGION || 'us-east-1',
      accessKey: process.env.VITE_S3_ACCESS_KEY || '',
      secretKey: process.env.VITE_S3_SECRET_KEY || '',
      publicUrl: process.env.VITE_S3_PUBLIC_URL || ''
    },
    
    cache: {
      provider: 'redis',
      host: process.env.VITE_REDIS_HOST || 'localhost',
      port: Number(process.env.VITE_REDIS_PORT) || 6379,
      password: process.env.VITE_REDIS_PASSWORD || '',
      ttl: 3600 // 1 hora
    },
    
    logging: {
      level: 'info',
      file: true,
      console: false,
      database: true
    },
    
    security: {
      corsOrigins: [
        'https://qualycorpore.com',
        'https://app.qualycorpore.com',
        'https://admin.qualycorpore.com'
      ],
      rateLimitWindow: 15 * 60 * 1000,
      rateLimitMax: 1000,
      encryptionKey: process.env.VITE_ENCRYPTION_KEY || ''
    },
    
    features: {
      realTimeUpdates: true,
      offlineMode: true,
      multiTenant: true,
      analytics: true,
      notifications: true
    }
  }
};

// 🎯 OBTER CONFIGURAÇÃO ATUAL
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.MODE || 'development';
  return environments[env] || environments.development;
};

// 🔧 VALIDAR CONFIGURAÇÃO
export const validateEnvironmentConfig = (config: EnvironmentConfig): string[] => {
  const errors: string[] = [];
  
  // Validar API
  if (!config.apiUrl) {
    errors.push('API URL é obrigatória');
  }
  
  // Validar Database
  if (!config.database.host || !config.database.name) {
    errors.push('Configurações de banco de dados são obrigatórias');
  }
  
  // Validar Segurança
  if (!config.security.encryptionKey) {
    errors.push('Chave de criptografia é obrigatória');
  }
  
  // Validar Email (se notificações estão ativas)
  if (config.features.notifications && !config.email.from) {
    errors.push('Configuração de email é obrigatória quando notificações estão ativas');
  }
  
  return errors;
};

// 🌐 CONFIGURAÇÃO ATUAL
export const config = getEnvironmentConfig();

// 🔍 VALIDAÇÃO INICIAL
const configErrors = validateEnvironmentConfig(config);
if (configErrors.length > 0) {
  console.error('❌ Erros de configuração:', configErrors);
}

export default config;
// Use VITE_API_BASE_URL no .env para configurar a URL do backend
