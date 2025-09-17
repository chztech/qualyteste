import React, { useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import CalendarHeader from './components/Calendar/CalendarHeader';
import MonthView from './components/Calendar/MonthView';
import WeekView from './components/Calendar/WeekView';
import DayView from './components/Calendar/DayView';
import AppointmentForm from './components/Forms/AppointmentForm';
import AdminCompanyScheduling from './components/Forms/AdminCompanyScheduling';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ProviderManagement from './components/Management/ProviderManagement';
import CompanyManagement from './components/Management/CompanyManagement';
import ServiceManagement from './components/Management/ServiceManagement';
import AdminManagement from './components/Management/AdminManagement';
import ReportsPage from './components/Reports/ReportsPage';
import LogoCustomization from './components/Management/LogoCustomization';
import CompanyDashboard from './components/Company/CompanyDashboard';
import ProviderDashboard from './components/Provider/ProviderDashboard';
import PublicBooking from './components/Company/PublicBooking';
import LoginForm from './components/Auth/LoginForm';
import { logoConfigService } from './services/logoConfigService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { mockUsers, mockProviders, mockCompanies, mockAppointments, mockServices } from './data/mockData';
import { User, ViewMode, Appointment, Provider, Company, Employee, Service } from './types';
import { Building2, Calendar as CalendarIcon } from 'lucide-react';
import TestApi from './Utils/TestApi';



function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Application state
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Data state
  const [users, setUsers] = useLocalStorage('users', mockUsers);
  const [appointments, setAppointments] = useLocalStorage('appointments', mockAppointments);
  const [providers, setProviders] = useLocalStorage('providers', mockProviders);
  const [companies, setCompanies] = useLocalStorage('companies', mockCompanies);
  const [services, setServices] = useLocalStorage('services', mockServices);
  
  // System settings - Simplified time slots
  const [availableTimeSlots] = useState(() => {
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    slots.push('00:00');
    return slots;
  });
  <div className="flex flex-col lg:flex-row gap-4">
  <div className="flex-1">
    <AdminDashboard
      appointments={filteredData.appointments}
      providers={providers}
      companies={companies}
      onUpdateAppointment={handleUpdateAppointment}
      onUpdateMultipleAppointments={handleUpdateMultipleAppointments}
      onDeleteAppointment={handleDeleteAppointment}
      onDeleteMultipleAppointments={handleDeleteMultipleAppointments}
    />
  </div>

  <div className="w-full lg:w-80 p-4 bg-gray-50 rounded shadow">
    <TestApi
      users={users}
      companies={companies}
      providers={providers}
      appointments={appointments}
      services={services}
    />
  </div>
</div>

  
  // Form state
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [isAdminSchedulingOpen, setIsAdminSchedulingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 🎯 SISTEMA: Atualização automática silenciosa
  React.useEffect(() => {
    const checkForUpdates = () => {
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        try {
          const parsedAppointments = JSON.parse(storedAppointments);
          
          // Verificar se há mudanças nos dados
          if (JSON.stringify(parsedAppointments) !== JSON.stringify(appointments)) {
            setAppointments(parsedAppointments);
          }
        } catch (error) {
          console.error('Erro ao verificar atualizações:', error);
        }
      }
    };

    // Verificar atualizações a cada 5 segundos
    const interval = setInterval(checkForUpdates, 5000);

    return () => clearInterval(interval);
  }, [appointments]);

  // Utility functions
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  // 🎯 NOVA FUNÇÃO: Verificar se é página pública de agendamento
  const isPublicBookingPage = () => {
    try {
      const path = window.location.pathname;
      console.log('🔍 Verificando path:', path); // Debug log
      console.log('🌐 URL completa:', window.location.href); // Debug log
      
      // Verificar se é uma rota de agendamento público
      const isBookingRoute = path.startsWith('/agendamento/') && path.length > '/agendamento/'.length;
      
      // Verificar se o token é válido
      if (isBookingRoute) {
        const token = path.split('/agendamento/')[1];
        console.log('🎫 Token extraído da URL:', token); // Debug log
        try {
          const decoded = atob(token);
          // Verificar se é um token válido (deve ser um ID simples)
          const isValidToken = decoded && decoded.length > 0 && !decoded.includes(' ');
          console.log('🎫 Token válido:', isValidToken, decoded);
          return isValidToken;
        } catch {
          console.log('❌ Token inválido:', token);
          return false;
        }
      }
      
      console.log('❌ Não é rota de agendamento:', path);
      return false;
    } catch (error) {
      console.error('Erro ao verificar página pública:', error);
      return false;
    }
  };

  // 🎯 NOVA FUNÇÃO: Obter token da URL
  const getBookingToken = () => {
    try {
      const path = window.location.pathname;
      const token = path.split('/agendamento/')[1];
      console.log('🎫 Token extraído:', token); // Debug log
      return token;
    } catch (error) {
      console.error('Erro ao extrair token:', error);
      return null;
    }
  };

  // Employee management functions for companies
  const handleAddEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString()
    };

    setCompanies(prev => {
      const updatedCompanies = prev.map(company => 
        company.id === employeeData.companyId 
          ? { ...company, employees: [...company.employees, newEmployee] }
          : company
      );
      
      // Salvar no localStorage para persistência
      localStorage.setItem('companies', JSON.stringify(updatedCompanies));
      
      return updatedCompanies;
    });
    
    console.log('✅ Funcionário adicionado:', newEmployee);
  };

  const handleUpdateEmployee = (id: string, employeeData: Partial<Employee>) => {
    setCompanies(prev => {
      const updatedCompanies = prev.map(company => ({
        ...company,
        employees: company.employees.map(emp => 
          emp.id === id ? { ...emp, ...employeeData } : emp
        )
      }));
      
      // Salvar no localStorage para persistência
      localStorage.setItem('companies', JSON.stringify(updatedCompanies));
      
      return updatedCompanies;
    });
    
    console.log('✅ Funcionário atualizado:', id, employeeData);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      setCompanies(prev => {
        const updatedCompanies = prev.map(company => ({
          ...company,
          employees: company.employees.filter(emp => emp.id !== id)
        }));
        
        // Salvar no localStorage para persistência
        localStorage.setItem('companies', JSON.stringify(updatedCompanies));
        
        return updatedCompanies;
      });
      
      console.log('✅ Funcionário excluído:', id);
    }
  };

  const handleLogin = (email: string, password: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.role === 'company') {
        setActiveTab('dashboard');
      } else if (user.role === 'provider') {
        setActiveTab('my-schedule');
      } else {
        setActiveTab('calendar');
      }
    } else {
      alert('Usuário não encontrado. Use um dos acessos de demonstração.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('calendar');
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setViewMode('day');
  };

  // 🎯 NOVA FUNÇÃO: Handle company click no calendário
  const handleCompanyClick = (company: Company, date: string, time?: string) => {
    // Filtrar agendamentos da empresa na data/horário específico
    const companyAppointments = appointments.filter(apt => 
      apt.companyId === company.id && 
      apt.date === date &&
      (!time || apt.startTime === time)
    );

    if (companyAppointments.length > 0) {
      // Mostrar detalhes da empresa e agendamentos
      alert(`🏢 ${company.name}\n📅 ${new Date(date).toLocaleDateString('pt-BR')}\n${time ? `🕐 ${time}\n` : ''}\n📊 ${companyAppointments.length} agendamento(s)\n\n${companyAppointments.map(apt => `• ${apt.startTime} - ${apt.service} (${apt.duration}min)`).join('\n')}`);
    }
  };

  const handleTimeSlotClick = (date?: Date, time?: string) => {
    if (date) setSelectedDate(date);
    if (time) setSelectedTime(time);
    setSelectedAppointment(null);
    setIsAppointmentFormOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentFormOpen(true);
  };

  const handleAppointmentSubmit = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    if (selectedAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...appointmentData, id: selectedAppointment.id, createdAt: selectedAppointment.createdAt }
          : apt
      ));
    } else {
      const newAppointment: Appointment = {
        ...appointmentData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
    
    setSelectedAppointment(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleUpdateAppointment = (id: string, appointmentData: Partial<Appointment>) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, ...appointmentData } : apt
    ));
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => {
      const updatedAppointments = prev.filter(apt => apt.id !== id);
      
      // Salvar no localStorage para sincronização
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      return updatedAppointments;
    });
  };

  // 🎯 NOVA FUNÇÃO: Atualizar múltiplos agendamentos de uma vez
  const handleUpdateMultipleAppointments = (appointmentIds: string[], updateData: Partial<Appointment>) => {
    setAppointments(prev => {
      const updatedAppointments = prev.map(apt => 
        appointmentIds.includes(apt.id) ? { ...apt, ...updateData } : apt
      );
      
      // Salvar no localStorage para sincronização
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      return updatedAppointments;
    });
  };

  // 🎯 NOVA FUNÇÃO: Excluir múltiplos agendamentos de uma vez
  const handleDeleteMultipleAppointments = (appointmentIds: string[]) => {
    setAppointments(prev => {
      const updatedAppointments = prev.filter(apt => !appointmentIds.includes(apt.id));
      
      // Salvar no localStorage para sincronização
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      return updatedAppointments;
    });
  };

  const handleAdminSchedulingSubmit = (scheduleData: any) => {
    const { companyId, date, slots, chairs } = scheduleData;
    
    console.log('🔍 Recebendo dados do agendamento:', scheduleData);
    
    // Criar um appointment para cada slot (cada cadeira em cada horário)
    const newAppointments = slots.map((slot: any, index: number) => {
        const service = services.find(s => s.id === slot.serviceId);
        const endTime = calculateEndTime(slot.time, slot.duration);
        
        return {
          id: `${Date.now()}-${index}-${slot.time}-${slot.chair}`,
          clientId: companyId, 
          providerId: slot.providerId,
          companyId: companyId,
          employeeId: '', // Será preenchido quando o colaborador agendar
          date: date,
          startTime: slot.time,
          endTime: endTime,
          duration: slot.duration,
          service: service?.name || '',
          status: 'scheduled' as const,
          notes: `Agendamento administrativo - Cadeira ${slot.chair}/${chairs} - Prestador: ${providers.find(p => p.id === slot.providerId)?.name}`,
          createdAt: new Date()
        };
      });

    console.log('🔍 Novos agendamentos criados:', newAppointments);

    setAppointments(prev => [...prev, ...newAppointments]);
    
    // Salvar no localStorage para persistência
    const updatedAppointments = [...appointments, ...newAppointments];
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    
    console.log('✅ Agendamentos salvos no localStorage');
  };

  // 🎯 FUNÇÃO: Handle company booking (update existing appointment instead of creating new)
  const handleCompanyBookAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    // Buscar o slot existente que corresponde aos dados
    const existingSlot = appointments.find(apt => 
      apt.companyId === appointmentData.companyId &&
      apt.date === appointmentData.date &&
      apt.startTime === appointmentData.startTime &&
      apt.service === appointmentData.service &&
      (!apt.employeeId || apt.employeeId === '') // Slot ainda não ocupado
    );

    if (existingSlot) {
      // Atualizar o slot existente com o employeeId
      setAppointments(prev => prev.map(apt => 
        apt.id === existingSlot.id 
          ? { 
              ...apt, 
              employeeId: appointmentData.employeeId,
              notes: appointmentData.notes,
              status: appointmentData.status
            }
          : apt
      ));
    } else {
      // Fallback: criar novo appointment se não encontrar slot
      const newAppointment: Appointment = {
        ...appointmentData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
  };

  // 🎯 NOVA FUNÇÃO: Handle public booking (atualizar slot existente)
  const handlePublicBookAppointment = (appointmentData: any) => {
    // appointmentData contém: { id, employeeId, notes }
    setAppointments(prev => {
      const updatedAppointments = prev.map(apt => 
        apt.id === appointmentData.id 
          ? { 
              ...apt, 
              employeeId: appointmentData.employeeId,
              notes: appointmentData.notes,
              status: 'confirmed' as const // Confirmar automaticamente agendamentos públicos
            }
          : apt
      );
      
      // Salvar no localStorage para sincronização
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      return updatedAppointments;
    });
    
    alert('✅ Agendamento realizado com sucesso!\n\nSeu horário foi confirmado. Em caso de dúvidas, entre em contato com a empresa.');
  };

  // 🎯 NOVA FUNÇÃO: Handle add employee from public booking
  const handleAddEmployeeFromPublic = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString()
    };

    // Adicionar à lista de colaboradores da empresa
    setCompanies(prev => prev.map(company => 
      company.id === employeeData.companyId 
        ? { ...company, employees: [...company.employees, newEmployee] }
        : company
    ));

    // Salvar no localStorage para persistência
    const updatedCompanies = companies.map(company => 
      company.id === employeeData.companyId 
        ? { ...company, employees: [...company.employees, newEmployee] }
        : company
    );
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));

    console.log('✅ Novo colaborador adicionado via link público:', newEmployee);
    return newEmployee.id;
  };
  // 🎯 NOVA LÓGICA: Renderizar página pública de agendamento
  if (isPublicBookingPage()) {
    const token = getBookingToken();
    if (token) {
      return (
        <PublicBooking
          companyToken={token}
          companies={companies}
          providers={providers}
          services={services}
          availableTimeSlots={availableTimeSlots}
          appointments={appointments} // 🎯 NOVA PROP: Passar appointments para verificar slots
          onBookAppointment={handlePublicBookAppointment}
          onAddEmployee={handleAddEmployeeFromPublic}
        />
      );
    }
  }

  // Provider management functions
  const handleAddProvider = (providerData: Omit<Provider, 'id'>) => {
    const newProvider: Provider = {
      ...providerData,
      id: Date.now().toString()
    };
    setProviders(prev => [...prev, newProvider]);

    const newUser: User = {
      id: newProvider.id,
      name: providerData.name,
      email: providerData.email,
      phone: providerData.phone,
      role: 'provider',
      createdAt: new Date()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateProvider = (id: string, providerData: Partial<Provider>) => {
    setProviders(prev => prev.map(provider => 
      provider.id === id ? { ...provider, ...providerData } : provider
    ));
    
    setUsers(prev => prev.map(user => 
      user.id === id ? { 
        ...user, 
        name: providerData.name || user.name,
        email: providerData.email || user.email,
        phone: providerData.phone || user.phone
      } : user
    ));
  };

  const handleDeleteProvider = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este prestador?')) {
      setProviders(prev => prev.filter(provider => provider.id !== id));
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  // Company management functions
  const handleAddCompany = (companyData: Omit<Company, 'id'>) => {
    const newCompany: Company = {
      ...companyData,
      id: Date.now().toString()
    };
    setCompanies(prev => [...prev, newCompany]);

    const newUser: User = {
      id: Date.now().toString(),
      name: companyData.name,
      email: companyData.email || '',
      phone: companyData.phone,
      role: 'company',
      companyId: newCompany.id,
      createdAt: new Date()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateCompany = (id: string, companyData: Partial<Company>) => {
    setCompanies(prev => prev.map(company => 
      company.id === id ? { ...company, ...companyData } : company
    ));
  };

  const handleDeleteCompany = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      setCompanies(prev => prev.filter(company => company.id !== id));
      setUsers(prev => prev.filter(user => user.companyId !== id));
    }
  };

  // Service management functions
  const handleAddService = (serviceData: Omit<Service, 'id' | 'createdAt'>) => {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setServices(prev => [...prev, newService]);
  };

  const handleUpdateService = (id: string, serviceData: Partial<Service>) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, ...serviceData } : service
    ));
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      setServices(prev => prev.filter(service => service.id !== id));
    }
  };

  // Admin management functions
  const handleAddAdmin = (adminData: Omit<User, 'id' | 'createdAt'>) => {
    const newAdmin: User = {
      ...adminData,
      id: Date.now().toString(),
      role: 'admin',
      createdAt: new Date()
    };
    setUsers(prev => [...prev, newAdmin]);
  };

  const handleUpdateAdmin = (id: string, adminData: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...adminData } : user
    ));
  };

  const handleDeleteAdmin = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status } : apt
    ));
  };

  const getFilteredData = () => {
    if (!currentUser) return { appointments: [], companies: [], employees: [] };

    switch (currentUser.role) {
      case 'company':
        const userCompany = companies.find(c => c.id === currentUser.companyId);
        return {
          appointments: appointments.filter(apt => apt.companyId === currentUser.companyId),
          companies: userCompany ? [userCompany] : [],
          employees: userCompany ? userCompany.employees : []
        };
      case 'provider':
        return {
          appointments: appointments.filter(apt => apt.providerId === currentUser.id),
          companies,
          employees: companies.flatMap(c => c.employees)
        };
      default:
        return {
          appointments,
          companies,
          employees: companies.flatMap(c => c.employees)
        };
    }
  };

  const renderMainContent = () => {
    if (!currentUser) return null;

    const filteredData = getFilteredData();

    // Company Dashboard
    if (currentUser.role === 'company') {
      const userCompany = companies.find(c => c.id === currentUser.companyId);
      if (!userCompany) return <div>Empresa não encontrada</div>;

      return (
        <CompanyDashboard
          company={userCompany}
          employees={userCompany.employees}
          appointments={filteredData.appointments}
          providers={providers}
          services={services}
          availableTimeSlots={availableTimeSlots}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onBookAppointment={handleCompanyBookAppointment}
          onUpdateAppointment={handleUpdateAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      );
    }

    // Provider Dashboard
    if (currentUser.role === 'provider' && activeTab === 'my-schedule') {
      const provider = providers.find(p => p.id === currentUser.id);
      if (!provider) return <div>Prestador não encontrado</div>;

      return (
        <ProviderDashboard
          provider={provider}
          appointments={filteredData.appointments}
          companies={companies}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onUpdateAppointment={handleUpdateAppointment}
        />
      );
    }

    // Admin views
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="flex flex-col h-full">
            <CalendarHeader
              currentDate={currentDate}
              viewMode={viewMode}
              onDateChange={setCurrentDate}
              onViewModeChange={setViewMode}
              onDeleteMultipleAppointments={handleDeleteMultipleAppointments}
            />
            <div className="flex-1 overflow-hidden">
              {viewMode === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                  onDateClick={handleDateClick}
                  onCompanyClick={handleCompanyClick}
                />
              )}
              {viewMode === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                  onTimeSlotClick={(date, time) => handleTimeSlotClick(date, time)}
                  onCompanyClick={handleCompanyClick}
                />
              )}
              {viewMode === 'day' && (
                <DayView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                  onTimeSlotClick={(time) => handleTimeSlotClick(currentDate, time)}
                  onCompanyClick={handleCompanyClick}
                />
              )}
            </div>
          </div>
        );
      
      case 'providers':
        return (
          <ProviderManagement
            providers={providers}
            onAddProvider={handleAddProvider}
            onUpdateProvider={handleUpdateProvider}
            onDeleteProvider={handleDeleteProvider}
          />
        );
      
      case 'companies':
        return (
          <CompanyManagement
            companies={companies}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        );

      case 'services':
        return (
          <ServiceManagement
            services={services}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
          />
        );

      case 'admins':
        const adminUsers = users.filter(user => user.role === 'admin');
        return (
          <AdminManagement
            admins={adminUsers}
            onAddAdmin={handleAddAdmin}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            currentUserId={currentUser.id}
          />
        );

      case 'reports':
        return (
          <ReportsPage
            appointments={filteredData.appointments}
            providers={providers}
            companies={companies}
          />
        );
      
      case 'logo-customization':
        return (
          <LogoCustomization
            onSave={(config) => {
              // Aplicar configurações no sistema
              console.log('✅ Configurações de logo aplicadas:', config);
            }}
          />
        );
      
      case 'dashboard':
      case 'appointments':
      default:
        return (
          <AdminDashboard
            appointments={filteredData.appointments}
            providers={providers}
            companies={companies}
            onUpdateAppointment={handleUpdateAppointment}
            onUpdateMultipleAppointments={handleUpdateMultipleAppointments}
            onDeleteAppointment={handleDeleteAppointment}
            onDeleteMultipleAppointments={handleDeleteMultipleAppointments}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginForm onLogin={handleLogin} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentUser={currentUser!} 
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={(currentUser!.role === 'admin' || currentUser!.role === 'provider')}
      />
      
      <div className="flex">
        {(currentUser!.role === 'admin' || currentUser!.role === 'provider') && (
          <Sidebar
            userRole={currentUser!.role}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        
        <main className={`flex-1 overflow-hidden ${
          currentUser!.role === 'company' ? '' : 'lg:ml-0'
        }`}>
          <div className="h-full p-3 sm:p-6">
            <div className="bg-white rounded-lg shadow-sm h-full">
              {renderMainContent()}
            </div>
          </div>
        </main>
      </div>

      {currentUser!.role === 'admin' && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col space-y-3 z-40">
          <button
            onClick={() => setIsAdminSchedulingOpen(true)}
            className="bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            title="Agendamento Administrativo"
          >
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}

      {currentUser!.role === 'admin' && (
        <AppointmentForm
          isOpen={isAppointmentFormOpen}
          onClose={() => {
            setIsAppointmentFormOpen(false);
            setSelectedAppointment(null);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          onSubmit={handleAppointmentSubmit}
          initialData={selectedAppointment || undefined}
          providers={providers}
          companies={companies}
          selectedDate={selectedDate || undefined}
          selectedTime={selectedTime || undefined}
        />
      )}

      {currentUser!.role === 'admin' && (
        <AdminCompanyScheduling
          isOpen={isAdminSchedulingOpen}
          onClose={() => setIsAdminSchedulingOpen(false)}
          onSubmit={handleAdminSchedulingSubmit}
          companies={companies}
          providers={providers}
          services={services}
          availableTimeSlots={availableTimeSlots}
        />
      )}
    </div>
  );
}

export default App;
