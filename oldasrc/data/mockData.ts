import { User, Provider, Company, Appointment, Service } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'admin@admin.com',
    phone: '(11) 99999-9999',
    role: 'admin',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@massaflow.com',
    phone: '(11) 88888-8888',
    role: 'provider',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@empresa.com',
    phone: '(11) 77777-7777',
    role: 'client',
    companyId: '1',
    createdAt: new Date('2024-02-01')
  },
  {
    id: '4',
    name: 'Empresa 01',
    email: 'empresa@empresa1.com',
    phone: '(11) 3333-3333',
    role: 'company',
    companyId: '1',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '5',
    name: 'Empresa 02',
    email: 'contato@empresa2.com',
    phone: '(11) 2222-2222',
    role: 'company',
    companyId: '2',
    createdAt: new Date('2024-01-20')
  }
];

// Mock Providers
export const mockProviders: Provider[] = [
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@massaflow.com',
    phone: '(11) 88888-8888',
    specialties: ['Massagem Relaxante', 'Massagem Desportiva'],
    workingHours: {
      start: '06:00',
      end: '00:00',
      days: [1, 2, 3, 4, 5] // Segunda à Sexta
    },
    breaks: []
  },
  {
    id: '6',
    name: 'Ana Costa',
    email: 'ana@massaflow.com',
    phone: '(11) 66666-6666',
    specialties: ['Quick Massage', 'Massagem Terapêutica'],
    workingHours: {
      start: '06:00',
      end: '00:00',
      days: [1, 2, 3, 4, 5]
    },
    breaks: []
  }
];

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Solutions Ltda',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    phone: '(11) 3333-3333',
    email: 'empresa@techsolutions.com',
    employees: [
      {
        id: '1',
        name: 'Carlos Oliveira',
        phone: '(11) 77777-7777',
        department: 'Desenvolvimento',
        companyId: '1'
      },
      {
        id: '2',
        name: 'Ana Silva',
        phone: '(11) 55555-5555',
        department: 'Marketing',
        companyId: '1'
      },
      {
        id: '3',
        name: 'Pedro Santos',
        phone: '(11) 44444-4444',
        department: 'Vendas',
        companyId: '1'
      }
    ]
  },
  {
    id: '2',
    name: 'Inovação Corp',
    address: 'Rua da Inovação, 500 - São Paulo, SP',
    phone: '(11) 2222-2222',
    email: 'contato@inovacaocorp.com',
    employees: [
      {
        id: '4',
        name: 'Juliana Costa',
        phone: '(11) 33333-3333',
        department: 'RH',
        companyId: '2'
      },
      {
        id: '5',
        name: 'Roberto Lima',
        phone: '(11) 22222-2222',
        department: 'Financeiro',
        companyId: '2'
      }
    ]
  }
];

// Mock Services
export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Quick Massage',
    duration: 15,
    description: 'Massagem rápida para alívio de tensões',
    price: 30,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Massagem Relaxante',
    duration: 60,
    description: 'Massagem completa para relaxamento',
    price: 80,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Massagem Desportiva',
    duration: 45,
    description: 'Massagem focada em músculos específicos',
    price: 70,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '4',
    name: 'Massagem Terapêutica',
    duration: 90,
    description: 'Massagem para tratamento de dores específicas',
    price: 120,
    createdAt: new Date('2024-01-01')
  }
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: '1',
    clientId: '4',
    providerId: '2',
    companyId: '1',
    employeeId: '1',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    service: 'Massagem Relaxante',
    status: 'confirmed',
    notes: 'Cliente solicita foco nas costas',
    createdAt: new Date()
  },
  {
    id: '2',
    clientId: '4',
    providerId: '6',
    companyId: '1',
    employeeId: '2',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:30',
    endTime: '14:45',
    duration: 15,
    service: 'Quick Massage',
    status: 'scheduled',
    createdAt: new Date()
  },
  {
    id: '3',
    clientId: '4',
    providerId: '2',
    companyId: '1',
    employeeId: '3',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '10:15',
    endTime: '11:00',
    duration: 45,
    service: 'Massagem Desportiva',
    status: 'scheduled',
    notes: 'Preparação para competição',
    createdAt: new Date()
  },
  {
    id: '4',
    clientId: '5',
    providerId: '6',
    companyId: '2',
    employeeId: '4',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00',
    endTime: '11:15',
    duration: 15,
    service: 'Quick Massage',
    status: 'confirmed',
    createdAt: new Date()
  }
];