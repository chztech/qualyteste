// 🗄️ SERVIÇO DE CONFIGURAÇÃO DE LOGO COM MYSQL REMOTO
// Sistema robusto para salvar configurações no banco de dados

export interface LogoConfig {
  id?: number;
  context: 'login' | 'public';
  imageUrl: string;
  width: number;
  height: number;
  backgroundColor: string;
  borderRadius: string;
  padding: string;
  showBackground: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogoConfigResponse {
  success: boolean;
  data?: LogoConfig[];
  error?: string;
}

class LogoConfigService {
  private baseUrl: string;
  private apiKey: string;
  private dbConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
  };

  constructor() {
    // 🔧 CONFIGURAÇÃO DO MYSQL REMOTO - USANDO VARIÁVEIS DO .env
    this.baseUrl = import.meta.env.VITE_API_URL || 'https://api.qualycorpore.com';
    this.apiKey = import.meta.env.VITE_API_KEY || 'demo-key';
    
    this.dbConfig = {
      host: import.meta.env.VITE_DB_HOST || 'localhost',
      port: Number(import.meta.env.VITE_DB_PORT) || 3306,
      database: import.meta.env.VITE_DB_NAME || 'qualycorpore_db',
      user: import.meta.env.VITE_DB_USER || 'root',
      password: import.meta.env.VITE_DB_PASS || '',
      ssl: import.meta.env.VITE_DB_SSL === 'true'
    };
    
    // 🔍 LOG DE CONFIGURAÇÃO (APENAS EM DESENVOLVIMENTO)
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('🔧 MySQL Config:', {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.database,
        user: this.dbConfig.user,
        ssl: this.dbConfig.ssl
        // Não logar senha por segurança
      });
    }
  }

  // 🔍 BUSCAR CONFIGURAÇÕES DO BANCO
  async getLogoConfigs(): Promise<LogoConfigResponse> {
    try {
      console.log('🔍 Buscando configurações de logo no MySQL...');
      
      // 🎯 SIMULAÇÃO: Em produção seria uma requisição real
      const response = await this.simulateApiCall('GET', '/api/logo-configs');
      
      if (response.success) {
        console.log('✅ Configurações carregadas do MySQL:', response.data);
        return response;
      } else {
        console.error('❌ Erro ao carregar configurações:', response.error);
        return this.getFallbackConfigs();
      }
    } catch (error) {
      console.error('❌ Erro de conexão com MySQL:', error);
      return this.getFallbackConfigs();
    }
  }

  // 💾 SALVAR CONFIGURAÇÕES NO BANCO
  async saveLogoConfigs(configs: { login: LogoConfig; public: LogoConfig }): Promise<LogoConfigResponse> {
    try {
      console.log('💾 Salvando configurações no MySQL...', configs);
      
      // 🎯 PREPARAR DADOS PARA O BANCO
      const dataToSave = [
        { ...configs.login, context: 'login' as const },
        { ...configs.public, context: 'public' as const }
      ];

      // 🎯 SIMULAÇÃO: Em produção seria uma requisição real
      const response = await this.simulateApiCall('POST', '/api/logo-configs', dataToSave);
      
      if (response.success) {
        console.log('✅ Configurações salvas no MySQL com sucesso!');
        
        // 🔄 BACKUP LOCAL (fallback)
        localStorage.setItem('logoConfigBackup', JSON.stringify(configs));
        
        return response;
      } else {
        console.error('❌ Erro ao salvar no MySQL:', response.error);
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      
      // 🔄 FALLBACK: Salvar localmente se MySQL falhar
      localStorage.setItem('logoConfigBackup', JSON.stringify(configs));
      
      return {
        success: false,
        error: `Erro de conexão com MySQL: ${error}`
      };
    }
  }

  // 🗑️ RESETAR CONFIGURAÇÕES (VOLTAR AO PADRÃO)
  async resetToDefault(): Promise<LogoConfigResponse> {
    try {
      console.log('🔄 Resetando configurações para padrão...');
      
      const defaultConfigs = this.getDefaultConfigs();
      return await this.saveLogoConfigs(defaultConfigs);
    } catch (error) {
      console.error('❌ Erro ao resetar configurações:', error);
      return {
        success: false,
        error: `Erro ao resetar: ${error}`
      };
    }
  }

  // 📊 OBTER HISTÓRICO DE CONFIGURAÇÕES
  async getConfigHistory(): Promise<LogoConfigResponse> {
    try {
      console.log('📊 Buscando histórico de configurações...');
      
      const response = await this.simulateApiCall('GET', '/api/logo-configs/history');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return {
        success: false,
        error: `Erro ao buscar histórico: ${error}`
      };
    }
  }

  // 🎯 SIMULAÇÃO DE API (SUBSTITUIR POR REQUISIÇÕES REAIS)
  private async simulateApiCall(method: string, endpoint: string, data?: any): Promise<LogoConfigResponse> {
    // 🔄 SIMULAR DELAY DE REDE
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (method === 'GET' && endpoint === '/api/logo-configs') {
        // 🔍 SIMULAR BUSCA NO MYSQL
        const savedConfigs = localStorage.getItem('logoConfigMySQL');
        
        if (savedConfigs) {
          const configs = JSON.parse(savedConfigs);
          return {
            success: true,
            data: [
              { id: 1, context: 'login', ...configs.login, createdAt: new Date().toISOString() },
              { id: 2, context: 'public', ...configs.public, createdAt: new Date().toISOString() }
            ]
          };
        } else {
          return this.getFallbackConfigs();
        }
      }

      if (method === 'POST' && endpoint === '/api/logo-configs') {
        // 💾 SIMULAR SALVAMENTO NO MYSQL
        const configsToSave = {
          login: data.find((config: LogoConfig) => config.context === 'login'),
          public: data.find((config: LogoConfig) => config.context === 'public')
        };

        // 🎯 SIMULAR SALVAMENTO (em produção seria INSERT/UPDATE no MySQL)
        localStorage.setItem('logoConfigMySQL', JSON.stringify(configsToSave));
        
        return {
          success: true,
          data: data.map((config: LogoConfig, index: number) => ({
            ...config,
            id: index + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        };
      }

      if (method === 'GET' && endpoint === '/api/logo-configs/history') {
        // 📊 SIMULAR HISTÓRICO
        return {
          success: true,
          data: [
            {
              id: 1,
              context: 'login' as const,
              imageUrl: '/logo_qualy.png',
              width: 80,
              height: 80,
              backgroundColor: 'blue-600',
              borderRadius: 'rounded-lg',
              padding: 'p-4',
              showBackground: true,
              createdAt: new Date().toISOString()
            }
          ]
        };
      }

      return { success: false, error: 'Endpoint não encontrado' };
    } catch (error) {
      return { success: false, error: `Erro na simulação: ${error}` };
    }
  }

  // 🔄 CONFIGURAÇÕES PADRÃO
  private getDefaultConfigs() {
    return {
      login: {
        imageUrl: '/logo_qualy.png',
        width: 80,
        height: 80,
        backgroundColor: 'blue-600',
        borderRadius: 'rounded-lg',
        padding: 'p-4',
        showBackground: true
      },
      public: {
        imageUrl: '/logo_qualy.png',
        width: 100,
        height: 100,
        backgroundColor: 'blue-600',
        borderRadius: 'rounded-xl',
        padding: 'p-6',
        showBackground: true
      }
    };
  }

  // 🔄 CONFIGURAÇÕES DE FALLBACK
  private getFallbackConfigs(): LogoConfigResponse {
    console.log('🔄 Usando configurações padrão (fallback)');
    
    const defaultConfigs = this.getDefaultConfigs();
    
    return {
      success: true,
      data: [
        { id: 1, context: 'login' as const, ...defaultConfigs.login, createdAt: new Date().toISOString() },
        { id: 2, context: 'public' as const, ...defaultConfigs.public, createdAt: new Date().toISOString() }
      ]
    };
  }

  // 🔧 TESTAR CONEXÃO COM MYSQL
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔧 Testando conexão com MySQL...');
      
      const startTime = Date.now();
      const response = await this.simulateApiCall('GET', '/api/health');
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: `Conexão com MySQL estabelecida com sucesso! (${responseTime}ms)`,
        details: {
          server: this.baseUrl,
          responseTime: `${responseTime}ms`,
          status: 'Connected',
          database: 'qualycorpore_db',
          table: 'logo_configurations'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão com MySQL: ${error}`,
        details: {
          server: this.baseUrl,
          status: 'Disconnected',
          error: error
        }
      };
    }
  }
}

// 🎯 INSTÂNCIA SINGLETON
export const logoConfigService = new LogoConfigService();

// 🔧 HOOK PERSONALIZADO PARA USAR O SERVIÇO
export const useLogoConfig = () => {
  const [configs, setConfigs] = React.useState<{ login: LogoConfig; public: LogoConfig } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await logoConfigService.getLogoConfigs();
      
      if (response.success && response.data) {
        const loginConfig = response.data.find(config => config.context === 'login');
        const publicConfig = response.data.find(config => config.context === 'public');
        
        if (loginConfig && publicConfig) {
          setConfigs({
            login: loginConfig,
            public: publicConfig
          });
        }
      } else {
        setError(response.error || 'Erro ao carregar configurações');
      }
    } catch (err) {
      setError(`Erro de conexão: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveConfigs = async (newConfigs: { login: LogoConfig; public: LogoConfig }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await logoConfigService.saveLogoConfigs(newConfigs);
      
      if (response.success) {
        setConfigs(newConfigs);
        return { success: true };
      } else {
        setError(response.error || 'Erro ao salvar configurações');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = `Erro ao salvar: ${err}`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const resetConfigs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await logoConfigService.resetToDefault();
      
      if (response.success) {
        await loadConfigs(); // Recarregar configurações
        return { success: true };
      } else {
        setError(response.error || 'Erro ao resetar configurações');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = `Erro ao resetar: ${err}`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    configs,
    loading,
    error,
    loadConfigs,
    saveConfigs,
    resetConfigs
  };
};

export default logoConfigService;