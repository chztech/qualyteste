export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'client' | 'provider' | 'company';
  companyId?: string;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  employees: Employee[];
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  department: string;
  companyId: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  workingHours: {
    start: string;
    end: string;
    days: number[]; // 0-6 (Sun-Sat)
  };
  breaks: Break[];
}

export interface Break {
  id: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  description?: string;
  price?: number;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  clientId: string;
  providerId: string;
  companyId?: string;
  employeeId?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  service: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
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