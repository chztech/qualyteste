// src/services/apiService.ts
import {
  Appointment,
  Company,
  Employee,
  Provider,
  ProviderBreak,
  ProviderWorkingHours,
  Service,
  User,
} from "../types";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

function normalizeBaseUrl(u: string): string {
  if (!u) return "";
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function joinUrl(base: string, endpoint: string): string {
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${normalizeBaseUrl(base)}${e}`;
}

function parseJsonSafe(text: string, status: number): { ok: boolean; data?: any; errorText?: string } {
  if (!text || text.trim().length === 0) {
    // corpo vazio (ex.: erro de backend/OPTIONS/etc.)
    return { ok: false, errorText: `Resposta vazia (HTTP ${status})` };
  }
  try {
    const data = JSON.parse(text);
    return { ok: true, data };
  } catch {
    return { ok: false, errorText: text };
  }
}

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
    const url = joinUrl(this.baseUrl, endpoint);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: "include", // mantém cookies/sessão caso use
      mode: "cors",
    };

    // Se body for objeto, transforma em JSON string
    if (fetchOptions.body && typeof fetchOptions.body !== "string" && !(fetchOptions.body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    // Se for FormData, deixa o browser setar o Content-Type
    if (fetchOptions.body instanceof FormData) {
      delete (fetchOptions.headers as Record<string, string>)["Content-Type"];
    }

    // Token Bearer
    if (this.token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const res = await fetch(url, fetchOptions);
      const text = await res.text();

      const tryParse = parseJsonSafe(text, res.status);
      if (!tryParse.ok) {
        // resposta não-JSON ou vazia
        return {
          success: false,
          error: `Resposta não-JSON (${res.status})`,
          message: tryParse.errorText,
        };
      }

      const data = tryParse.data;

      // Convencionalmente suas APIs retornam { success, data, message, error }
      if (!res.ok || data?.success === false) {
        return {
          success: false,
          error: (data?.error || data?.message || `Erro HTTP ${res.status}`),
          message: data?.message,
        };
      }

      // Normaliza para ApiResponse<T>
      return {
        success: true,
        data: (data?.data as T) ?? (data as T) ?? undefined,
        message: data?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Falha de rede",
      };
    }
  }

  // ---- Mapeamentos ---------------------------------------------------------
  private mapUser(record: any): User {
    return {
      id: record.id,
      name: record.name ?? "",
      email: record.email ?? "",
      phone: record.phone ?? null,
      role: record.role,
      companyId: record.companyId ?? record.company_id ?? null,
      createdAt: record.createdAt ?? record.created_at,
      updatedAt: record.updatedAt ?? record.updated_at,
    };
  }

  private mapEmployee(record: any): Employee {
    return {
      id: record.id,
      companyId: record.companyId ?? record.company_id ?? "",
      name: record.name ?? "",
      phone: record.phone ?? null,
      department: record.department ?? null,
      createdAt: record.createdAt ?? record.created_at,
      updatedAt: record.updatedAt ?? record.updated_at,
    };
  }

  private mapCompany(record: any): Company {
    return {
      id: record.id,
      name: record.name ?? "",
      address: record.address ?? null,
      phone: record.phone ?? null,
      email: record.email ?? null,
      notes: record.notes ?? null,
      publicToken: record.publicToken ?? record.public_token ?? null,
      isActive: record.isActive ?? record.is_active ?? true,
      settings: record.settings ?? null,
      createdAt: record.createdAt ?? record.created_at,
      updatedAt: record.updatedAt ?? record.updated_at,
    };
  }

  private mapProvider(record: any): Provider {
    return {
      id: record.id,
      userId: record.userId ?? record.user_id ?? "",
      name: record.name ?? "",
      email: record.email ?? "",
      phone: record.phone ?? null,
      specialties: record.specialties ?? [],
      workingHours: record.workingHours ?? record.working_hours ?? null,
      breaks: record.breaks ?? [],
      isActive: record.isActive ?? record.is_active ?? true,
      createdAt: record.createdAt ?? record.created_at,
      updatedAt: record.updatedAt ?? record.updated_at,
    };
  }

  private mapService(record: any): Service {
    return {
      id: record.id,
      name: record.name ?? "",
      duration: Number(record.duration ?? 0),
      description: record.description ?? null,
      price:
        record.price !== undefined && record.price !== null
          ? Number(record.price)
          : null,
      isActive: record.isActive ?? record.is_active ?? true,
      createdAt: record.createdAt ?? record.created_at,
      updatedAt: record.updatedAt ?? record.updated_at,
    };
  }

  private mapAppointment(record: any): Appointment {
    return {
      id: record.id,
      date: record.date ?? "",
      startTime: record.startTime ?? record.start_time ?? "",
      endTime: record.endTime ?? record.end_time ?? "",
      duration: Number(record.duration ?? 0),
      status: (record.status ?? "scheduled") as Appointment["status"],
      companyId: record.companyId ?? record.company_id ?? null,
      providerId: record.providerId ?? record.provider_id ?? null,
      employeeId: record.employeeId ?? record.employee_id ?? null,
      serviceId: record.serviceId ?? record.service_id ?? null,
      clientId: record.clientId ?? record.client_id ?? null,
      notes: record.notes ?? null,
      createdAt: record.createdAt ?? record.created_at,
      updatedAt: record.updatedAt ?? record.updated_at,
    };
  }

  // ---- Auth ---------------------------------------------------------------
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>("/auth/login.php", {
      method: "POST",
      body: { email, password },
    });
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async register(payload: { name: string; email: string; password: string; phone?: string; companyId?: string | null }) {
    return this.request<{ id: string }>("/auth/register.php", {
      method: "POST",
      body: payload,
    });
  }

  async verify() {
    return this.request<{ user: any }>("/auth/verify.php", { method: "GET" });
  }

  logout() {
    this.clearAuthToken();
  }

  // ---- Companies ----------------------------------------------------------
  async getCompanies() {
    const response = await this.request<any[]>("/companies/index.php", { method: "GET" });
    if (response.success && Array.isArray(response.data)) {
      return { ...response, data: response.data.map((r: any) => this.mapCompany(r)) } as ApiResponse<Company[]>;
    }
    return response as ApiResponse<Company[]>;
  }

  async createCompany(payload: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    notes?: string;
    settings?: Record<string, any> | null;
    employees?: Array<Pick<Employee, "name" | "phone" | "department">>;
  }) {
    return this.request<{ id: string }>("/companies/create.php", {
      method: "POST",
      body: payload,
    });
  }

  async updateCompany(payload: Partial<Company> & { id: string }) {
    return this.request<{ message: string }>("/companies/update.php", {
      method: "PUT",
      body: payload,
    });
  }

  async changeCompanyPassword(companyId: string, password: string) {
    return this.request<{ message: string }>("/companies/password.php", {
      method: "PUT",
      body: { companyId, password },
    });
  }

  // ---- Providers ----------------------------------------------------------
  async getProviders() {
    const response = await this.request<any[]>("/providers/index.php", { method: "GET" });
    if (response.success && Array.isArray(response.data)) {
      return { ...response, data: response.data.map((r: any) => this.mapProvider(r)) } as ApiResponse<Provider[]>;
    }
    return response as ApiResponse<Provider[]>;
  }

  async createProvider(payload: {
    name: string;
    email: string;
    phone?: string;
    specialties?: string[];
    workingHours?: ProviderWorkingHours | null;
    breaks?: ProviderBreak[];
    createUser?: boolean;
    userId?: string;
  }) {
    return this.request<{ id: string }>("/providers/create.php", {
      method: "POST",
      body: payload,
    });
  }

  async updateProvider(payload: Partial<Provider> & { id: string }) {
    return this.request<{ message: string }>("/providers/update.php", {
      method: "PUT",
      body: payload,
    });
  }

  // ---- Services -----------------------------------------------------------
  async getServices() {
    const response = await this.request<any[]>("/services/index.php", { method: "GET" });
    if (response.success && Array.isArray(response.data)) {
      return { ...response, data: response.data.map((r: any) => this.mapService(r)) } as ApiResponse<Service[]>;
    }
    return response as ApiResponse<Service[]>;
  }

  async createService(payload: { name: string; duration: number; description?: string; price?: number | null }) {
    const response = await this.request<any>("/services/index.php", {
      method: "POST",
      body: payload,
    });
    if (response.success && response.data) {
      return { ...response, data: this.mapService(response.data) } as ApiResponse<Service>;
    }
    return response as ApiResponse<Service>;
  }

  async updateService(payload: Partial<Service> & { id: string }) {
    return this.request<{ message: string }>("/services/update.php", {
      method: "PUT",
      body: payload,
    });
  }

  // ---- Appointments -------------------------------------------------------
  async getAppointments(params?: { date?: string; providerId?: string; companyId?: string; status?: Appointment["status"] }) {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.providerId) query.set("providerId", params.providerId);
    if (params?.companyId) query.set("companyId", params.companyId);
    if (params?.status) query.set("status", params.status);

    const response = await this.request<any[]>(`/appointments/index.php${query.toString() ? `?${query.toString()}` : ""}`, {
      method: "GET",
    });
    if (response.success && Array.isArray(response.data)) {
      return { ...response, data: response.data.map((r: any) => this.mapAppointment(r)) } as ApiResponse<Appointment[]>;
    }
    return response as ApiResponse<Appointment[]>;
  }

  async createAppointment(payload: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    serviceId: string;
    providerId: string | null;
    companyId?: string | null;
    employeeId?: string | null;
    clientId?: string | null;
    notes?: string | null;
  }) {
    const response = await this.request<any>("/appointments/create.php", {
      method: "POST",
      body: payload,
    });
    if (response.success && response.data) {
      return { ...response, data: this.mapAppointment(response.data) } as ApiResponse<Appointment>;
    }
    return response as ApiResponse<Appointment>;
  }

  async updateAppointment(payload: Partial<Appointment> & { id: string }) {
    return this.request<{ message: string }>("/appointments/update.php", {
      method: "PUT",
      body: payload,
    });
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.request<{ message: string }>("/appointments/cancel.php", {
      method: "PUT",
      body: { id, reason },
    });
  }
}

const api = new ApiService();
export default api;
