```typescript
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // URL da API na HostGator
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://qulycorpore.chztech.com.br/api' 
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