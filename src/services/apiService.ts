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
      import.meta.env.VITE_API_BASE_URL ?? "https://qualycorpore.chztech.com.br/api";
    this.baseUrl = envBaseUrl;

    this.token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      sessionStorage.getItem("authToken") ||
      null;

    console.log("🔐 ApiService inicializado com token:", this.token ? "SIM ✅" : "NÃO ❌");
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem("authToken", token);
    localStorage.setItem("token", token);
    console.log("🔐 Token definido:", token ? "SIM ✅" : "NÃO ❌");
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    console.log("🔐 Token limpo");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/${endpoint}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      const fetchOptions: RequestInit = {
        ...options,
        headers,
        credentials: "include",
      };

      // Corpo → JSON (quando necessário)
      if (fetchOptions.body instanceof FormData) {
        delete (fetchOptions.headers as Record<string, string>)["Content-Type"];
      } else if (
        fetchOptions.body &&
        typeof fetchOptions.body !== "string" &&
        !(fetchOptions.body instanceof ArrayBuffer)
      ) {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
      }

      // Bearer token
      if (this.token) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${this.token}`,
        };
      } else {
        const tokenAgora =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("jwt");
        if (tokenAgora) {
          this.token = tokenAgora;
          fetchOptions.headers = {
            ...fetchOptions.headers,
            Authorization: `Bearer ${tokenAgora}`,
          };
          console.log("🔐 Token encontrado em runtime:", tokenAgora.substring(0, 20) + "...");
        } else {
          console.warn("⚠️ Requisição sem token para:", endpoint);
        }
      }

      console.log("📤 Requisição:", options.method || "GET", url);

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Erro na resposta:", response.status, data);
        return {
          success: false,
          error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
          message: data?.message,
        } as ApiResponse<T>;
      }

      console.log("✅ Resposta OK:", url);
      return {
        success: true,
        data: (data && data.data !== undefined ? data.data : data) as T,
        message: data?.message,
      };
    } catch (error) {
      console.error("❌ API Request Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão",
      } as ApiResponse<T>;
    }
  }

  // --------- Mappers ---------
  private mapEmployee(record: any): Employee {
    return {
      id: record.id,
      companyId: record.companyId ?? record.companyid ?? null,
      name: record.name ?? "",
      phone: record.phone ?? null,
      department: record.department ?? null,
      createdAt: record.createdAt ?? record.createdat ?? null,
      updatedAt: record.updatedAt ?? record.updatedat ?? null,
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
      publicToken: record.publicToken ?? record.publictoken ?? null,
      employees: Array.isArray(record.employees)
        ? record.employees.map((employee: any) => this.mapEmployee(employee))
        : [],
      createdAt: record.createdAt ?? record.createdat ?? null,
      updatedAt: record.updatedAt ?? record.updatedat ?? null,
    };
  }

  private parseJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (Array.isArray(value) || typeof value === "object") return value as T;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  private mapProvider(record: any): Provider {
    const specialties = this.parseJson<string[]>(record.specialties, []);
    const workingHours = this.parseJson<ProviderWorkingHours | null>(
      record.workingHours ?? record.workinghours,
      null
    );
    const breaks = this.parseJson<ProviderBreak[] | null>(record.breaks, []);

    return {
      id: record.id,
      userId: record.userId ?? record.userid ?? null,
      name: record.name ?? "",
      email: record.email ?? "",
      phone: record.phone ?? null,
      specialties,
      workingHours,
      breaks: breaks ?? [],
      isActive: record.isActive ?? record.isactive ?? true,
      createdAt: record.createdAt ?? record.createdat ?? null,
      updatedAt: record.updatedAt ?? record.updatedat ?? null,
    };
  }

  private mapService(record: any): Service {
    return {
      id: record.id,
      name: record.name ?? "",
      duration: Number(record.duration) ?? 0,
      description: record.description ?? null,
      price:
        record.price !== undefined && record.price !== null ? Number(record.price) : null,
      isActive: record.isActive ?? record.isactive ?? true,
      createdAt: record.createdAt ?? record.createdat ?? null,
      updatedAt: record.updatedAt ?? record.updatedat ?? null,
    };
  }

  private mapAppointment(record: any): Appointment {
    return {
      id: record.id,
      date: record.date ?? "",
      startTime: record.startTime ?? record.start_time ?? record.starttime ?? "",
      endTime: record.endTime ?? record.end_time ?? record.endtime ?? "",
      duration: Number(record.duration) ?? 0,
      status: (record.status ?? "scheduled") as Appointment["status"],
      companyId: record.companyId ?? record.company_id ?? record.companyid ?? null,
      providerId: record.providerId ?? record.provider_id ?? record.providerid ?? null,
      clientId: record.clientId ?? record.client_id ?? record.clientid ?? null,
      employeeId: record.employeeId ?? record.employee_id ?? record.employeeid ?? null,
      serviceId: record.serviceId ?? record.service_id ?? record.serviceid ?? null,
      notes: record.notes ?? null,
      companyName: record.companyName ?? record.company_name ?? record.companyname ?? null,
      providerName:
        record.providerName ?? record.provider_name ?? record.providername ?? null,
      serviceName: record.serviceName ?? record.service_name ?? record.servicename ?? null,
      employeeName:
        record.employeeName ?? record.employee_name ?? record.employeename ?? null,
      createdAt: record.createdAt ?? record.created_at ?? record.createdat ?? null,
      updatedAt: record.updatedAt ?? record.updated_at ?? record.updatedat ?? null,
    };
  }

  private mapUser(record: any): User {
    return {
      id: record.id,
      name: record.name ?? "",
      email: record.email ?? "",
      phone: record.phone ?? null,
      role: record.role ?? "client",
      companyId: record.companyId ?? record.company_id ?? record.companyid ?? null,
      isActive: record.isActive ?? record.isactive ?? true,
      createdAt: record.createdAt ?? record.created_at ?? record.createdat ?? null,
      updatedAt: record.updatedAt ?? record.updated_at ?? record.updatedat ?? null,
    };
  }

  // --------- Auth ---------
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>("auth/login.php", {
      method: "POST",
      body: { email, password },
    });
  }

  async verify() {
    return this.request<{ user: any }>("auth/verify.php", { method: "GET" });
  }

  // --------- Companies ---------
  async getCompanies() {
    const response = await this.request<any>("companies/index.php", { method: "GET" });
    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((record: any) => this.mapCompany(record)),
      } as ApiResponse<Company[]>;
    }
    return response as ApiResponse<Company[]>;
  }

  async createCompany(payload: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    notes?: string;
    employees?: Array<Pick<Employee, "name" | "phone" | "department">>;
  }) {
    const response = await this.request<any>("companies/create.php", {
      method: "POST",
      body: {
        name: payload.name,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        notes: payload.notes,
        employees: (payload.employees ?? []).map((employee) => ({
          name: employee.name,
          phone: employee.phone,
          department: employee.department,
        })),
      },
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.mapCompany(response.data),
      } as ApiResponse<Company>;
    }
    return response as ApiResponse<Company>;
  }

  async updateCompany(id: string, payload: Partial<Company> & { password?: string }) {
    const employeesBody = Array.isArray(payload.employees)
      ? payload.employees.map((employee) => ({
          id: employee.id,
          name: employee.name,
          phone: employee.phone,
          department: employee.department,
        }))
      : undefined;

    const body: Record<string, any> = {
      id,
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      notes: payload.notes,
      isActive: typeof payload.isActive === "boolean" ? payload.isActive : undefined,
      password: (payload as any).password,
      settings: (payload as any)?.settings,
      publicToken: (payload as any)?.publicToken,
      employees: employeesBody,
    };

    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    const response = await this.request<any>("companies/update.php", {
      method: "POST",
      body,
    });
    return response as ApiResponse<{ id: string; employees?: Employee[] }>;
  }

  async changeCompanyPassword(companyId: string, password: string) {
    return this.request<{ message: string }>("companies/password.php", {
      method: "PUT",
      body: { companyId, password },
    });
  }

  // --------- Providers ---------
  async getProviders() {
    const response = await this.request<any>("providers/index.php", { method: "GET" });
    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((record: any) => this.mapProvider(record)),
      } as ApiResponse<Provider[]>;
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
    const response = await this.request<any>("providers/create.php", {
      method: "POST",
      body: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        specialties: payload.specialties ?? [],
        workingHours: payload.workingHours ?? null,
        breaks: payload.breaks ?? [],
        createUser: payload.createUser ?? false,
        userId: payload.userId ?? null,
      },
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.mapProvider(response.data),
      } as ApiResponse<Provider>;
    }
    return response as ApiResponse<Provider>;
  }

  async updateProvider(id: string, payload: Partial<Provider>) {
    const response = await this.request<any>("providers/update.php", {
      method: "POST",
      body: {
        id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        specialties: payload.specialties,
        workingHours: payload.workingHours,
        breaks: payload.breaks,
        userId: payload.userId,
      },
    });
    return response as ApiResponse<{ id: string }>;
  }

  // --------- Services ---------
  async getServices() {
    const response = await this.request<any>("services/index.php", { method: "GET" });
    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((record: any) => this.mapService(record)),
      } as ApiResponse<Service[]>;
    }
    return response as ApiResponse<Service[]>;
  }

  async updateProviderPassword(providerId: string, password: string) {
    return this.request<{ success: boolean; message?: string }>("providers/password.php", {
      method: "PUT",
      body: { providerId, password },
    });
  }

  async createService(payload: {
    name: string;
    duration: number;
    description?: string;
    price?: number | null;
  }) {
    const response = await this.request<any>("services/index.php", {
      method: "POST",
      body: payload,
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.mapService(response.data),
      } as ApiResponse<Service>;
    }
    return response as ApiResponse<Service>;
  }

  async updateService(id: string, payload: Partial<Service>) {
    const response = await this.request<any>("services/index.php", {
      method: "PUT",
      body: { id, ...payload },
    });
    return response as ApiResponse<{ id: string }>;
  }

  async deleteService(id: string) {
    return this.request<{ id: string }>(`services/index.php?id=${id}`, {
      method: "DELETE",
    });
  }

  // --------- Appointments ---------
  async getAppointments(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await this.request<any>(`appointments/public.php${queryString}`, {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((record: any) => this.mapAppointment(record)),
      } as ApiResponse<Appointment[]>;
    }
    return response as ApiResponse<Appointment[]>;
  }

  async createAppointment(payload: {
    date: string;
    startTime: string;
    endTime: string; // requerido pelo backend
    duration?: number;
    status?: Appointment["status"];
    companyId?: string | null;
    providerId?: string | null;
    clientId?: string | null;
    employeeId?: string | null;
    serviceId?: string | null;
    notes?: string | null;
  }) {
    // Envia snake_case ao backend
    const bodySnake: any = {
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      provider_id: payload.providerId,
      service_id: payload.serviceId,
      company_id: payload.companyId ?? null,
      employee_id: payload.employeeId ?? null,
      client_id: payload.clientId ?? payload.companyId ?? null,
      duration: payload.duration,
      status: payload.status ?? "scheduled",
      notes: payload.notes ?? null,
    };

    Object.keys(bodySnake).forEach((k) => bodySnake[k] === undefined && delete bodySnake[k]);

    const response = await this.request<any>("appointments/index.php", {
      method: "POST",
      body: bodySnake,
    });

    // API retorna sempre data: array → usamos o primeiro item
    if (response.success && Array.isArray(response.data) && response.data.length) {
      return {
        ...response,
        data: this.mapAppointment(response.data[0]),
      } as ApiResponse<Appointment>;
    }
    return response as ApiResponse<Appointment>;
  }

  async updateAppointment(id: string, payload: Partial<Appointment>) {
    // Apenas campos permitidos (snake_case)
    const body: Record<string, any> = { id };
    if (payload.date !== undefined) body.date = payload.date;
    if (payload.startTime !== undefined) body.start_time = payload.startTime;
    if (payload.endTime !== undefined) body.end_time = payload.endTime;
    if (payload.duration !== undefined) body.duration = payload.duration;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.companyId !== undefined) body.company_id = payload.companyId;
    if (payload.providerId !== undefined) body.provider_id = payload.providerId;
    if (payload.clientId !== undefined) body.client_id = payload.clientId;
    if (payload.employeeId !== undefined) body.employee_id = payload.employeeId;
    if (payload.serviceId !== undefined) body.service_id = payload.serviceId;
    if (payload.notes !== undefined) body.notes = payload.notes;

    const response = await this.request<any>("appointments/update.php", {
      method: "PUT",
      body,
    });

    if (response.success && Array.isArray(response.data) && response.data.length) {
      return { ...response, data: { id: response.data[0].id } } as ApiResponse<{ id: string }>;
    }
    return response as ApiResponse<{ id: string }>;
  }

  async confirmPublicAppointment(payload: {
    appointmentId: string;
    employeeId?: string | null;
    notes?: string | null;
  }) {
    const body: Record<string, any> = { id: payload.appointmentId };
    if (payload.employeeId !== undefined) body.employee_id = payload.employeeId;
    if (payload.notes !== undefined) body.notes = payload.notes;

    const response = await this.request<any>("appointments/public-confirm.php", {
      method: "POST",
      body,
    });

    if (response.success && Array.isArray(response.data) && response.data.length) {
      return {
        ...response,
        data: this.mapAppointment(response.data[0]),
      } as ApiResponse<Appointment>;
    }
    return response as ApiResponse<Appointment>;
  }

  async deleteAppointments(ids: string[]) {
    return this.request<{ ids: string[] }>("appointments/delete.php", {
      method: "DELETE",
      body: { ids },
    });
  }

  // --------- Users ---------
  async getUsers(role?: string) {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    const response = await this.request<any>(`users/index.php${query}`, {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((record: any) => this.mapUser(record)),
      } as ApiResponse<User[]>;
    }
    return response as ApiResponse<User[]>;
  }

  async createUser(payload: {
    name: string;
    email: string;
    password?: string;
    role: User["role"];
    phone?: string;
    companyId?: string;
  }) {
    const response = await this.request<any>("users/create.php", {
      method: "POST",
      body: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        phone: payload.phone,
        companyId: payload.companyId,
      },
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.mapUser(response.data),
      } as ApiResponse<User>;
    }
    return response as ApiResponse<User>;
  }

  async updateUser(id: string, payload: Partial<User> & { password?: string }) {
    return this.request<{ id: string }>("users/update.php", {
      method: "POST",
      body: {
        id,
        ...payload,
      },
    });
  }
}

export const apiService = new ApiService();
export default apiService;
