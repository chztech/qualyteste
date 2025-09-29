// 🌐 SERVIÇO DE API - PRONTO PARA BACK-END
// Centralizador de todas as chamadas para o servidor

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('authToken');
  }

  // 🔧 CONFIGURAÇÃO DE AUTENTICAÇÃO
  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // 🌐 MÉTODO BASE PARA REQUISIÇÕES
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
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`
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

  // 🔐 AUTENTICAÇÃO
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.clearAuthToken();
    return result;
  }

  async refreshToken() {
    return this.request<{ token: string }>('/auth/refresh', { method: 'POST' });
  }

  // 👥 USUÁRIOS
  async getUsers(params?: { role?: string; page?: number; limit?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/users${queryString}`);
  }

  async createUser(userData: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // 🏢 EMPRESAS
  async getCompanies(params?: { page?: number; limit?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/companies${queryString}`);
  }

  async createCompany(companyData: any) {
    return this.request<any>('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
  }

  async updateCompany(id: string, companyData: any) {
    return this.request<any>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData)
    });
  }

  async deleteCompany(id: string) {
    return this.request(`/companies/${id}`, { method: 'DELETE' });
  }

  // 👤 COLABORADORES
  async getEmployees(companyId: string) {
    return this.request<any[]>(`/companies/${companyId}/employees`);
  }

  async createEmployee(companyId: string, employeeData: any) {
    return this.request<any>(`/companies/${companyId}/employees`, {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
  }

  async updateEmployee(companyId: string, employeeId: string, employeeData: any) {
    return this.request<any>(`/companies/${companyId}/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData)
    });
  }

  async deleteEmployee(companyId: string, employeeId: string) {
    return this.request(`/companies/${companyId}/employees/${employeeId}`, { 
      method: 'DELETE' 
    });
  }

  // 👨‍⚕️ PRESTADORES
  async getProviders(params?: { specialties?: string[]; available?: boolean }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/providers${queryString}`);
  }

  async createProvider(providerData: any) {
    return this.request<any>('/providers', {
      method: 'POST',
      body: JSON.stringify(providerData)
    });
  }

  async updateProvider(id: string, providerData: any) {
    return this.request<any>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(providerData)
    });
  }

  async deleteProvider(id: string) {
    return this.request(`/providers/${id}`, { method: 'DELETE' });
  }

  // 💆 SERVIÇOS
  async getServices() {
    return this.request<any[]>('/services');
  }

  async createService(serviceData: any) {
    return this.request<any>('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  }

  async updateService(id: string, serviceData: any) {
    return this.request<any>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  }

  async deleteService(id: string) {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // 📅 AGENDAMENTOS
  async getAppointments(params?: { 
    date?: string; 
    companyId?: string; 
    providerId?: string; 
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<any[]>(`/appointments${queryString}`);
  }

  async createAppointment(appointmentData: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  }

  async createBulkAppointments(appointmentsData: any[]) {
    return this.request<any>('/appointments/bulk', {
      method: 'POST',
      body: JSON.stringify({ appointments: appointmentsData })
    });
  }

  async updateAppointment(id: string, appointmentData: any) {
    return this.request<any>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData)
    });
  }

  async deleteAppointment(id: string) {
    return this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  async deleteCompanyAppointments(companyId: string, date?: string) {
    const queryString = date ? `?date=${date}` : '';
    return this.request(`/appointments/company/${companyId}${queryString}`, { 
      method: 'DELETE' 
    });
  }

  // 🔍 DISPONIBILIDADE
  async checkAvailability(params: {
    date: string;
    startTime: string;
    endTime: string;
    providerId?: string;
    companyId?: string;
  }) {
    const queryString = '?' + new URLSearchParams(params as any).toString();
    return this.request<any>(`/appointments/availability${queryString}`);
  }

  async getAvailableSlots(params: {
    companyId: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryString = '?' + new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/appointments/available-slots${queryString}`);
  }

  // 📊 RELATÓRIOS
  async getReports(params: {
    startDate: string;
    endDate: string;
    companyId?: string;
    providerId?: string;
    type?: 'summary' | 'detailed' | 'financial';
  }) {
    const queryString = '?' + new URLSearchParams(params as any).toString();
    return this.request<any>(`/reports${queryString}`);
  }

  async exportReport(params: any, format: 'pdf' | 'excel') {
    const queryString = '?' + new URLSearchParams({ ...params, format }).toString();
    return this.request<{ downloadUrl: string }>(`/reports/export${queryString}`);
  }

  // 🔗 LINKS PÚBLICOS
  async getPublicBookingInfo(token: string) {
    return this.request<any>(`/public/booking/${token}`);
  }

  async createPublicBooking(token: string, bookingData: any) {
    return this.request<any>(`/public/booking/${token}`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  // 🎨 CONFIGURAÇÕES
  async getLogoConfigs() {
    return this.request<any[]>('/settings/logo');
  }

  async saveLogoConfigs(configs: any) {
    return this.request<any>('/settings/logo', {
      method: 'PUT',
      body: JSON.stringify(configs)
    });
  }

  async getSystemSettings() {
    return this.request<any>('/settings/system');
  }

  async updateSystemSettings(settings: any) {
    return this.request<any>('/settings/system', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // 📱 NOTIFICAÇÕES
  async getNotifications(userId: string) {
    return this.request<any[]>(`/notifications/${userId}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
  }

  // 🔄 SINCRONIZAÇÃO
  async syncData(lastSync?: string) {
    const queryString = lastSync ? `?lastSync=${lastSync}` : '';
    return this.request<any>(`/sync${queryString}`);
  }

  // 🏥 HEALTH CHECK
  async healthCheck() {
    return this.request('/health');
  }
}

// 🎯 INSTÂNCIA SINGLETON
export const apiService = new ApiService();

// 🔧 HOOKS PERSONALIZADOS PARA REACT
export const useApi = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const callApi = async <T>(apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      
      if (!result.success) {
        setError(result.error || 'Erro desconhecido');
        return null;
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error };
};

export default apiService;