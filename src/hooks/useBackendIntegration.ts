// 🔗 HOOK PARA INTEGRAÇÃO COM BACK-END
// Facilita a migração do localStorage para API real

import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useLocalStorage } from './useLocalStorage';

interface BackendIntegrationConfig {
  useLocalStorage: boolean; // true = localStorage, false = API
  syncInterval?: number; // intervalo de sincronização em ms
  enableOfflineMode?: boolean; // modo offline com cache
}

export function useBackendIntegration<T>(
  key: string,
  initialData: T[],
  config: BackendIntegrationConfig = { useLocalStorage: false }
) {
  const [localData, setLocalData] = useLocalStorage(key, initialData);
  const [apiData, setApiData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Decidir qual fonte de dados usar
  const data = config.useLocalStorage ? localData : apiData;
  const setData = config.useLocalStorage ? setLocalData : setApiData;

  // 🔄 SINCRONIZAÇÃO AUTOMÁTICA
  useEffect(() => {
    if (!config.useLocalStorage && config.syncInterval) {
      const interval = setInterval(() => {
        syncWithBackend();
      }, config.syncInterval);

      return () => clearInterval(interval);
    }
  }, [config.useLocalStorage, config.syncInterval]);

  // 🌐 SINCRONIZAR COM BACKEND
  const syncWithBackend = async () => {
    if (config.useLocalStorage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.syncData(lastSync?.toISOString());
      
      if (response.success) {
        // Aplicar mudanças do servidor
        const changes = response.data.changes[key];
        if (changes) {
          let updatedData = [...apiData];
          
          // Adicionar novos
          if (changes.created) {
            updatedData = [...updatedData, ...changes.created];
          }
          
          // Atualizar existentes
          if (changes.updated) {
            changes.updated.forEach((updated: any) => {
              const index = updatedData.findIndex(item => (item as any).id === updated.id);
              if (index !== -1) {
                updatedData[index] = updated;
              }
            });
          }
          
          // Remover deletados
          if (changes.deleted) {
            updatedData = updatedData.filter(item => 
              !changes.deleted.includes((item as any).id)
            );
          }
          
          setApiData(updatedData);
        }
        
        setLastSync(new Date());
      } else {
        setError(response.error || 'Erro na sincronização');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // 📝 CRIAR ITEM
  const createItem = async (itemData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (config.useLocalStorage) {
      const newItem = {
        ...itemData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as T;
      
      setLocalData(prev => [...prev, newItem]);
      return { success: true, data: newItem };
    } else {
      setLoading(true);
      try {
        const response = await getApiMethod('create')(itemData);
        if (response.success) {
          setApiData(prev => [...prev, response.data]);
        }
        return response;
      } finally {
        setLoading(false);
      }
    }
  };

  // ✏️ ATUALIZAR ITEM
  const updateItem = async (id: string, itemData: Partial<T>) => {
    if (config.useLocalStorage) {
      setLocalData(prev => prev.map(item => 
        (item as any).id === id 
          ? { ...item, ...itemData, updatedAt: new Date().toISOString() }
          : item
      ));
      return { success: true };
    } else {
      setLoading(true);
      try {
        const response = await getApiMethod('update')(id, itemData);
        if (response.success) {
          setApiData(prev => prev.map(item => 
            (item as any).id === id ? { ...item, ...response.data } : item
          ));
        }
        return response;
      } finally {
        setLoading(false);
      }
    }
  };

  // 🗑️ DELETAR ITEM
  const deleteItem = async (id: string) => {
    if (config.useLocalStorage) {
      setLocalData(prev => prev.filter(item => (item as any).id !== id));
      return { success: true };
    } else {
      setLoading(true);
      try {
        const response = await getApiMethod('delete')(id);
        if (response.success) {
          setApiData(prev => prev.filter(item => (item as any).id !== id));
        }
        return response;
      } finally {
        setLoading(false);
      }
    }
  };

  // 🔍 BUSCAR ITENS
  const fetchItems = async (params?: any) => {
    if (config.useLocalStorage) {
      return { success: true, data: localData };
    } else {
      setLoading(true);
      try {
        const response = await getApiMethod('get')(params);
        if (response.success) {
          setApiData(response.data);
        }
        return response;
      } finally {
        setLoading(false);
      }
    }
  };

  // 🎯 MAPEAR MÉTODOS DA API
  const getApiMethod = (action: 'create' | 'update' | 'delete' | 'get') => {
    const methodMap: Record<string, any> = {
      users: {
        create: apiService.createUser,
        update: apiService.updateUser,
        delete: apiService.deleteUser,
        get: apiService.getUsers
      },
      companies: {
        create: apiService.createCompany,
        update: apiService.updateCompany,
        delete: apiService.deleteCompany,
        get: apiService.getCompanies
      },
      providers: {
        create: apiService.createProvider,
        update: apiService.updateProvider,
        delete: apiService.deleteProvider,
        get: apiService.getProviders
      },
      services: {
        create: apiService.createService,
        update: apiService.updateService,
        delete: apiService.deleteService,
        get: apiService.getServices
      },
      appointments: {
        create: apiService.createAppointment,
        update: apiService.updateAppointment,
        delete: apiService.deleteAppointment,
        get: apiService.getAppointments
      }
    };

    return methodMap[key]?.[action] || (() => Promise.resolve({ success: false, error: 'Método não encontrado' }));
  };

  // 🔄 MIGRAR PARA BACKEND
  const migrateToBackend = async () => {
    if (!config.useLocalStorage) return;

    setLoading(true);
    try {
      // Enviar todos os dados locais para o backend
      for (const item of localData) {
        await getApiMethod('create')(item);
      }
      
      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem(key);
      
      // Mudar para modo API
      config.useLocalStorage = false;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na migração' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    lastSync,
    createItem,
    updateItem,
    deleteItem,
    fetchItems,
    syncWithBackend,
    migrateToBackend,
    isUsingLocalStorage: config.useLocalStorage
  };
}

// 🎯 HOOKS ESPECÍFICOS PARA CADA ENTIDADE
export const useUsers = (config?: BackendIntegrationConfig) => 
  useBackendIntegration('users', [], config);

export const useCompanies = (config?: BackendIntegrationConfig) => 
  useBackendIntegration('companies', [], config);

export const useProviders = (config?: BackendIntegrationConfig) => 
  useBackendIntegration('providers', [], config);

export const useServices = (config?: BackendIntegrationConfig) => 
  useBackendIntegration('services', [], config);

export const useAppointments = (config?: BackendIntegrationConfig) => 
  useBackendIntegration('appointments', [], config);
