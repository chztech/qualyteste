// 🌐 TIPOS PARA API - ESTRUTURA BACKEND-READY

// 📋 TIPOS BASE
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 👤 USUÁRIOS
export interface UserCreateRequest {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'company' | 'provider';
  companyId?: string;
  password?: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface UserResponse extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'company' | 'provider';
  companyId?: string;
  active: boolean;
  lastLogin?: string;
}

// 🏢 EMPRESAS
export interface CompanyCreateRequest {
  name: string;
  address: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  active?: boolean;
}

export interface CompanyUpdateRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  active?: boolean;
}

export interface CompanyResponse extends BaseEntity {
  name: string;
  address: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  active: boolean;
  employeeCount: number;
  appointmentCount: number;
  publicToken: string;
}

// 👥 COLABORADORES
export interface EmployeeCreateRequest {
  name: string;
  phone: string;
  department: string;
  companyId: string;
  active?: boolean;
}

export interface EmployeeUpdateRequest {
  name?: string;
  phone?: string;
  department?: string;
  active?: boolean;
}

export interface EmployeeResponse extends BaseEntity {
  name: string;
  phone: string;
  department: string;
  companyId: string;
  active: boolean;
  appointmentCount: number;
}

// 👨‍⚕️ PRESTADORES
export interface ProviderCreateRequest {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  workingHours: {
    start: string;
    end: string;
    days: number[];
  };
  active?: boolean;
}

export interface ProviderUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  workingHours?: {
    start: string;
    end: string;
    days: number[];
  };
  active?: boolean;
}

export interface ProviderResponse extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  workingHours: {
    start: string;
    end: string;
    days: number[];
  };
  active: boolean;
  appointmentCount: number;
  rating?: number;
}

// 💆 SERVIÇOS
export interface ServiceCreateRequest {
  name: string;
  duration: number;
  description?: string;
  price?: number;
  active?: boolean;
}

export interface ServiceUpdateRequest {
  name?: string;
  duration?: number;
  description?: string;
  price?: number;
  active?: boolean;
}

export interface ServiceResponse extends BaseEntity {
  name: string;
  duration: number;
  description?: string;
  price?: number;
  active: boolean;
  appointmentCount: number;
}

// 📅 AGENDAMENTOS
export interface AppointmentCreateRequest {
  companyId?: string;
  employeeId?: string;
  providerId: string;
  date: string;
  startTime: string;
  duration: number;
  service: string;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

export interface AppointmentUpdateRequest {
  employeeId?: string;
  providerId?: string;
  date?: string;
  startTime?: string;
  duration?: number;
  service?: string;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

export interface AppointmentResponse extends BaseEntity {
  companyId?: string;
  employeeId?: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  service: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  
  // Dados relacionados (populados pelo backend)
  company?: CompanyResponse;
  employee?: EmployeeResponse;
  provider?: ProviderResponse;
}

// 📋 AGENDAMENTO EM LOTE
export interface BulkAppointmentCreateRequest {
  appointments: AppointmentCreateRequest[];
  metadata?: {
    companyId: string;
    totalSlots: number;
    dateRange: {
      start: string;
      end: string;
    };
    configuration: {
      chairs: number;
      duration: number;
      service: string;
      workingHours: {
        start: string;
        end: string;
      };
      breaks: Array<{
        start: string;
        end: string;
        reason: string;
      }>;
    };
  };
}

export interface BulkAppointmentResponse {
  created: number;
  failed: number;
  errors?: string[];
  appointments: AppointmentResponse[];
}

// 🔍 DISPONIBILIDADE
export interface AvailabilityCheckRequest {
  date: string;
  startTime: string;
  endTime: string;
  providerId?: string;
  companyId?: string;
  excludeAppointmentId?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  conflicts?: AppointmentResponse[];
  suggestions?: {
    time: string;
    provider?: ProviderResponse;
  }[];
}

export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  service: string;
  provider: ProviderResponse;
  available: boolean;
}

// 📊 RELATÓRIOS
export interface ReportRequest {
  startDate: string;
  endDate: string;
  companyId?: string;
  providerId?: string;
  status?: string;
  type: 'summary' | 'detailed' | 'financial';
}

export interface ReportResponse {
  type: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalAppointments: number;
    totalCompanies: number;
    totalProviders: number;
    totalRevenue: number;
    statusBreakdown: {
      scheduled: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
  };
  data: any[];
  generatedAt: string;
}

// 🔗 AGENDAMENTO PÚBLICO
export interface PublicBookingInfoResponse {
  company: CompanyResponse;
  availableSlots: AvailableSlot[];
  services: ServiceResponse[];
  employees: EmployeeResponse[];
}

export interface PublicBookingRequest {
  appointmentId: string;
  employeeData?: {
    name: string;
    phone: string;
    department: string;
  };
  employeeId?: string;
  notes?: string;
}

// 🎨 CONFIGURAÇÕES
export interface LogoConfigRequest {
  login: {
    imageUrl: string;
    width: number;
    height: number;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
    showBackground: boolean;
  };
  public: {
    imageUrl: string;
    width: number;
    height: number;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
    showBackground: boolean;
  };
}

export interface SystemSettingsResponse {
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[];
  timeSlotInterval: number;
  maxAdvanceBookingDays: number;
  allowCancellation: boolean;
  cancellationDeadlineHours: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// 📱 NOTIFICAÇÕES
export interface NotificationResponse extends BaseEntity {
  userId: string;
  type: 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: any;
}

// 🔄 SINCRONIZAÇÃO
export interface SyncResponse {
  lastSync: string;
  changes: {
    appointments: {
      created: AppointmentResponse[];
      updated: AppointmentResponse[];
      deleted: string[];
    };
    companies: {
      created: CompanyResponse[];
      updated: CompanyResponse[];
      deleted: string[];
    };
    providers: {
      created: ProviderResponse[];
      updated: ProviderResponse[];
      deleted: string[];
    };
  };
}

// 🔐 AUTENTICAÇÃO
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ❌ TIPOS DE ERRO
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}