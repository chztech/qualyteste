type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    const envBaseUrl =
      import.meta.env.VITE_API_BASE_URL ??
      "https://qualycorpore.chztech.com.br/api";
    this.baseUrl = envBaseUrl;

    this.token = localStorage.getItem("authToken");
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem("authToken", token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // Log detalhado para depuração
      console.log("--- API Request ---");
      console.log("URL:", url);
      console.log("Headers:", headers);
      console.log("Options:", options);
      if (options.body) console.log("Body:", options.body);

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      const data = await response.json();

      console.log("--- API Response ---");
      console.log(data);

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error("API Request Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão",
      };
    }
  }

  // Login
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>("/auth/login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Registro
  async register(name: string, email: string, password: string) {
    return this.request<{ id: string }>("/auth/register.php", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Verificação JWT
  async verify() {
    return this.request<{ user: any }>("/auth/verify.php", {
      method: "GET",
    });
  }

  // Exemplo de consulta de agendamentos
  async getAppointments(params?: any) {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.request<any[]>(`/appointments.php${queryString}`);
  }

  // Método para log remoto direto no backend (opcional)
  async logRequest(body: any) {
    return this.request<any>("/log_requests.php", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
