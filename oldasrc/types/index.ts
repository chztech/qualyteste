export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'client' | 'provider' | 'company';
  companyId?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  publicToken?: string | null;
  employees: Employee[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  phone?: string | null;
  department?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderWorkingHours {
  start: string;
  end: string;
  days: number[];
}

export interface ProviderBreak {
  id?: string;
  providerId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface Provider {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  specialties: string[];
  workingHours?: ProviderWorkingHours | null;
  breaks?: ProviderBreak[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  description?: string | null;
  price?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  companyId?: string | null;
  providerId?: string | null;
  clientId?: string | null;
  employeeId?: string | null;
  serviceId?: string | null;
  service?: string | null;
  notes?: string | null;
  companyName?: string | null;
  providerName?: string | null;
  serviceName?: string | null;
  employeeName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
}

export interface SystemSettings {
  availableTimeSlots: string[];
  serviceDurations: {
    [key: string]: number[];
  };
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
}

export type ViewMode = 'month' | 'week' | 'day';
export type UserRole = 'admin' | 'client' | 'provider' | 'company';
