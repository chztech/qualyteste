import React, { useEffect, useState } from "react";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import CalendarHeader from "./components/Calendar/CalendarHeader";
import MonthView from "./components/Calendar/MonthView";
import WeekView from "./components/Calendar/WeekView";
import DayView from "./components/Calendar/DayView";
import AppointmentForm from "./components/Forms/AppointmentForm";
import AdminCompanyScheduling from "./components/Forms/AdminCompanyScheduling";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import ProviderManagement from "./components/Management/ProviderManagement";
import CompanyManagement from "./components/Management/CompanyManagement";
import ServiceManagement from "./components/Management/ServiceManagement";
import AdminManagement from "./components/Management/AdminManagement";
import ReportsPage from "./components/Reports/ReportsPage";
import LogoCustomization from "./components/Management/LogoCustomization";
import CompanyDashboard from "./components/Company/CompanyDashboard";
import ProviderDashboard from "./components/Provider/ProviderDashboard";
import PublicBooking from "./components/Company/PublicBooking";
import LoginForm from "./components/Auth/LoginForm";
import apiService from "./services/apiService";
import {
  User,
  ViewMode,
  Appointment,
  Provider,
  Company,
  Employee,
  Service,
} from "./types";
import { Building2 } from "lucide-react";

// util: string YYYY-MM-DD da data atual (timezone-safe)
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Application state
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const generateId = React.useCallback(
    () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Date.now().toString(),
    []
  );

  const loadInitialData = React.useCallback(
    async (options?: { roleOverride?: User["role"]; silent?: boolean }) => {
      const roleOverride = options?.roleOverride;
      const silent = options?.silent ?? false;

      if (!silent) {
        setIsBootstrapping(true);
      }
      setDataError(null);
      try {
        const effectiveRole = roleOverride ?? currentUser?.role;

        const hasAuth = apiService.hasAuthToken() && !!effectiveRole;

        const [
          companiesRes,
          providersRes,
          servicesRes,
          appointmentsRes,
          usersRes,
        ] = await Promise.all([
          apiService.getCompanies(),
          apiService.getProviders(),
          apiService.getServices(),
          hasAuth
            ? apiService.getAppointments()
            : Promise.resolve({ success: true, data: [] }),
          hasAuth && effectiveRole === "admin"
            ? apiService.getUsers()
            : Promise.resolve({ success: true, data: [] }),
        ]);

        if (companiesRes.success && companiesRes.data) {
          setCompanies(companiesRes.data);
        } else {
          setCompanies([]);
        }

        if (providersRes.success && providersRes.data) {
          setProviders(providersRes.data);
        } else {
          setProviders([]);
        }

        if (servicesRes.success && servicesRes.data) {
          setServices(servicesRes.data);
        } else {
          setServices([]);
        }

        if (appointmentsRes.success && appointmentsRes.data) {
          setAppointments(appointmentsRes.data);
        } else {
          setAppointments([]);
        }

        if (effectiveRole === "admin") {
          if (usersRes.success && usersRes.data) {
            setUsers(usersRes.data as User[]);
          } else {
            setUsers([]);
          }
        } else {
          setUsers([]);
        }

        if (effectiveRole === "company" && !currentUser?.companyId) {
          const inferredCompany =
            companiesRes.success && companiesRes.data
              ? companiesRes.data.find((company: Company) =>
                  (currentUser?.companyId && company.id === currentUser.companyId) ||
                  (currentUser?.email &&
                    company.email &&
                    company.email.toLowerCase() === currentUser.email.toLowerCase())
                ) ?? (companiesRes.data.length === 1 ? companiesRes.data[0] : undefined)
              : undefined;

          if (inferredCompany) {
            setCurrentUser((prev) =>
              prev ? { ...prev, companyId: inferredCompany.id } : prev
            );
          }
        }

        if (effectiveRole === "provider" && !currentUser?.providerId) {
          const inferredProvider =
            providersRes.success && providersRes.data
              ? providersRes.data.find((provider: Provider) =>
                  provider.userId === currentUser?.id ||
                  (currentUser?.providerId && provider.id === currentUser.providerId) ||
                  (currentUser?.email &&
                    provider.email &&
                    provider.email.toLowerCase() === currentUser.email.toLowerCase())
                )
              : undefined;

          if (inferredProvider) {
            setCurrentUser((prev) =>
              prev ? { ...prev, providerId: inferredProvider.id } : prev
            );
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        setDataError("N�o foi poss�vel carregar os dados do sistema.");
      } finally {
        if (!silent) {
          setIsBootstrapping(false);
        }
      }
    },
    [currentUser?.role]
  );

  // System settings - Simplified time slots
  const [availableTimeSlots] = useState(() => {
    const slots: string[] = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(time);
      }
    }
    slots.push("00:00");
    return slots;
  });

  // Form state
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [isAdminSchedulingOpen, setIsAdminSchedulingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Utility functions
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;

    return `${endHours.toString().padStart(2, "0")}:${remainingMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  const sanitizeClientId = (value?: string | null) => {
    if (typeof value !== "string") {
      return value ?? null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  // 🎯 Identificar página pública
  const isPublicBookingPage = React.useCallback(() => {
    try {
      const path = window.location.pathname;
      if (!path.startsWith("/agendamento/")) {
        return false;
      }
      const token = path.split("/agendamento/")[1] ?? "";
      return token.trim().length > 0;
    } catch (error) {
      console.error("Erro ao verificar p�gina p�blica:", error);
      return false;
    }
  }, []);

  // 🎯 Obter token da URL
  const getBookingToken = React.useCallback(() => {
    try {
      const path = window.location.pathname;
      const rawToken = path.split("/agendamento/")[1];
      return rawToken ? rawToken.trim() : null;
    } catch (error) {
      console.error("Erro ao extrair token:", error);
      return null;
    }
  }, []);

  const fetchPublicData = React.useCallback(async () => {
    if (!isPublicBookingPage()) {
      return;
    }

    const token = getBookingToken();
    if (!token) {
      setDataError("Link de agendamento inv�lido.");
      setCompanies([]);
      setProviders([]);
      setServices([]);
      setAppointments([]);
      return;
    }

    setIsBootstrapping(true);
    setDataError(null);

    try {
      const [companiesRes, providersRes, servicesRes, appointmentsRes] =
        await Promise.all([
          apiService.getCompanies(),
          apiService.getProviders(),
          apiService.getServices(),
          apiService.getPublicAppointments(token),
        ]);

      setCompanies(companiesRes.success ? companiesRes.data ?? [] : []);
      setProviders(providersRes.success ? providersRes.data ?? [] : []);
      setServices(servicesRes.success ? servicesRes.data ?? [] : []);
      setAppointments(
        appointmentsRes.success ? appointmentsRes.data ?? [] : []
      );
    } catch (error) {
      console.error("Falha ao carregar dados p�blicos:", error);
      setDataError("N�o foi poss�vel carregar os dados p�blicos.");
    } finally {
      setIsBootstrapping(false);
    }
  }, [getBookingToken, isPublicBookingPage]);

  // ?Y"" Carregar dados p�blicos sem exigir login (GETs)
  useEffect(() => {
    if (isPublicBookingPage()) {
      fetchPublicData();
    }
  }, [isPublicBookingPage, fetchPublicData]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isSyncing = false;

    const syncData = async () => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        await loadInitialData({ roleOverride: currentUser?.role, silent: true });
      } finally {
        isSyncing = false;
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void syncData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    const intervalId = window.setInterval(() => {
      void syncData();
    }, 15000);

    void syncData();

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, currentUser?.role, loadInitialData]);

  // Employee management functions for companies
  const handleAddEmployee = async (employeeData: Omit<Employee, "id">) => {
    const company = companies.find(
      (item) => item.id === employeeData.companyId
    );
    if (!company) return;

    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
    };

    try {
      await apiService.updateCompany(employeeData.companyId, {
        employees: [...company.employees, newEmployee],
      });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao adicionar colaborador:", error);
      alert("Não foi possível adicionar o colaborador. Tente novamente.");
    }
  };

  const handleUpdateEmployee = async (
    id: string,
    employeeData: Partial<Employee>
  ) => {
    const company = companies.find((item) =>
      item.employees.some((employee) => employee.id === id)
    );
    if (!company) return;

    const updatedEmployees = company.employees.map((employee) =>
      employee.id === id ? { ...employee, ...employeeData } : employee
    );

    try {
      await apiService.updateCompany(company.id, {
        employees: updatedEmployees,
      });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar colaborador:", error);
      alert("Não foi possível atualizar o colaborador. Tente novamente.");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) {
      return;
    }

    const company = companies.find((item) =>
      item.employees.some((employee) => employee.id === id)
    );
    if (!company) return;

    const updatedEmployees = company.employees.filter(
      (employee) => employee.id !== id
    );

    try {
      await apiService.updateCompany(company.id, {
        employees: updatedEmployees,
      });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error);
      alert("Não foi possível excluir o colaborador. Tente novamente.");
    }
  };

  // 🔑 Login
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);

      if (response.success && response.data) {
        const { user, token } = response.data;

        apiService.setAuthToken(token);
        await loadInitialData({ roleOverride: user.role });

        const mappedUser: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone ?? null,
          role: user.role,
          providerId: user.providerId ?? user.provider_id ?? null,
          companyId: user.companyId ?? user.company_id ?? null,
        };

        setCurrentUser(mappedUser);
        setIsAuthenticated(true);

        if (mappedUser.role === "company") {
          setActiveTab("dashboard");
        } else if (mappedUser.role === "provider") {
          setActiveTab("my-schedule");
        } else {
          setActiveTab("calendar");
        }

        return { success: true as const };
      }

      const message = response.error || "Falha no login";
      return { success: false as const, message };
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return {
        success: false as const,
        message: "Erro de conexão com o servidor",
      };
    }
  };

  const handleLogout = () => {
    apiService.clearAuthToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab("calendar");
    setCompanies([]);
    setProviders([]);
    setServices([]);
    setAppointments([]);
    setUsers([]);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setViewMode("day");
  };

  // 🎯 Novo: clique da empresa no calendário (tooltip simples)
  const handleCompanyClick = (company: Company, ymd: string, time?: string) => {
    const companyAppointments = appointments.filter(
      (apt) =>
        apt.companyId === company.id &&
        apt.date === ymd &&
        (!time || apt.startTime === time)
    );

    if (companyAppointments.length > 0) {
      alert(
        `🏢 ${company.name}\n📅 ${new Date(
          ymd + "T12:00:00"
        ).toLocaleDateString("pt-BR")}\n${time ? `🕐 ${time}\n` : ""}\n📊 ${
          companyAppointments.length
        } agendamento(s)\n\n${companyAppointments
          .map(
            (apt) => `• ${apt.startTime} - ${apt.service} (${apt.duration}min)`
          )
          .join("\n")}`
      );
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

  const handleAppointmentSubmit = async (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const normalizedClientId = sanitizeClientId(appointmentData.clientId ?? null);

      if (selectedAppointment) {
        const updatePayload: Partial<Appointment> = {
          ...appointmentData,
          clientId: normalizedClientId,
        };

        await apiService.updateAppointment(
          selectedAppointment.id,
          updatePayload
        );
      } else {
        await apiService.createAppointment({
          companyId: appointmentData.companyId,
          providerId: appointmentData.providerId,
          clientId: normalizedClientId,
          employeeId: appointmentData.employeeId ?? null,
          serviceId: appointmentData.serviceId,
          date: appointmentData.date,
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          duration: appointmentData.duration,
          status: appointmentData.status,
          notes: appointmentData.notes ?? null,
        });
      }

      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      alert("Não foi possível salvar o agendamento. Tente novamente.");
    } finally {
      setSelectedAppointment(null);
      setSelectedDate(null);
      setSelectedTime(null);
    }
  };

  const handleUpdateAppointment = async (
    id: string,
    appointmentData: Partial<Appointment>
  ) => {
    try {
      const normalizedPayload: Partial<Appointment> = { ...appointmentData };

      if (Object.prototype.hasOwnProperty.call(appointmentData, "clientId")) {
        normalizedPayload.clientId = sanitizeClientId(
          appointmentData.clientId ?? null
        );
      }

      await apiService.updateAppointment(id, normalizedPayload);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      alert("Não foi possível atualizar o agendamento. Tente novamente.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await apiService.deleteAppointments([id]);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      alert("Não foi possível excluir o agendamento. Tente novamente.");
    }
  };

  // Atualizar múltiplos agendamentos
  const handleUpdateMultipleAppointments = async (
    appointmentIds: string[],
    updateData: Partial<Appointment>
  ) => {
    try {
      await Promise.all(
        appointmentIds.map((id) => {
          const normalizedPayload: Partial<Appointment> = { ...updateData };

          if (Object.prototype.hasOwnProperty.call(updateData, "clientId")) {
            normalizedPayload.clientId = sanitizeClientId(
              updateData.clientId ?? null
            );
          }

          return apiService.updateAppointment(id, normalizedPayload);
        })
      );
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar agendamentos:", error);
      alert("Não foi possível atualizar os agendamentos selecionados.");
    }
  };

  // Excluir múltiplos agendamentos
  const handleDeleteMultipleAppointments = async (appointmentIds: string[]) => {
    if (appointmentIds.length === 0) return;

    try {
      await apiService.deleteAppointments(appointmentIds);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir agendamentos:", error);
      alert("Não foi possível excluir os agendamentos selecionados.");
    }
  };

  const handleAdminSchedulingSubmit = async (scheduleData: any) => {
    const { companyId, date, slots, chairs } = scheduleData;

    try {
      await Promise.all(
        slots.map(async (slot: any) => {
          const endTime = calculateEndTime(slot.time, slot.duration);
          const providerName = providers.find(
            (p) => p.id === slot.providerId
          )?.name;
          const service = services.find((s) => s.id === slot.serviceId);

          await apiService.createAppointment({
            companyId,
            providerId: slot.providerId,
            serviceId: slot.serviceId,
            clientId: null,
            employeeId: null,
            date,
            startTime: slot.time,
            endTime,
            duration: slot.duration,
            status: "scheduled",
            notes:
              `Agendamento administrativo - Cadeira ${slot.chair}/${chairs}` +
              (providerName ? ` - Prestador: ${providerName}` : "") +
              (service ? ` - Serviço: ${service.name}` : ""),
          });
        })
      );
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao criar agendamentos:", error);
      alert("Não foi possível criar os agendamentos. Tente novamente.");
    }
  };

  // Company booking (empresa aloca colaborador)
  // 🔧 CORRIGIDO: Company booking: empresa aloca colaborador
const handleCompanyBookAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
) => {
  console.log('📤 Criando agendamento individual:', appointmentData);
  
  try {
    // Validações básicas
    if (!appointmentData.companyId) throw new Error('Company ID é obrigatório');
    if (!appointmentData.providerId) throw new Error('Provider ID é obrigatório');
    if (!appointmentData.serviceId) throw new Error('Service ID é obrigatório');
    if (!appointmentData.date) throw new Error('Data é obrigatória');
    if (!appointmentData.startTime) throw new Error('Horário é obrigatório');
    
    // Criar agendamento
    const normalizedClientId = sanitizeClientId(appointmentData.clientId ?? null);
    const response = await apiService.createAppointment({
      companyId: appointmentData.companyId,
      providerId: appointmentData.providerId,
      clientId: normalizedClientId,
      employeeId: appointmentData.employeeId || null,
      serviceId: appointmentData.serviceId,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      duration: appointmentData.duration,
      status: appointmentData.status || 'scheduled',
      notes: appointmentData.notes || null,
    });
    
    console.log('✅ Agendamento criado:', response);
    
    // ✅ RETORNA OBJETO PARA O LOOP VERIFICAR
    return { success: true, data: response };
    
  } catch (error: any) {
    console.error('❌ Erro ao criar agendamento:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
};


  // Public booking (confirmar slot existente)
  const handlePublicBookAppointment = async (appointmentData: {
    id: string;
    employeeId?: string;
    notes?: string;
  }) => {
    const bookingToken = getBookingToken();
    if (!bookingToken) {
      alert("Link de agendamento invalido.");
      return;
    }

    try {
      const response = await apiService.confirmPublicAppointment({
        appointmentId: appointmentData.id,
        companyToken: bookingToken,
        employeeId: appointmentData.employeeId ?? null,
        notes: appointmentData.notes,
      });

      if (!response.success) {
        throw new Error(response.error || "Falha ao confirmar agendamento.");
      }

        await fetchPublicData();

      alert(
        "Agendamento realizado com sucesso!\\n\\nSeu horario foi confirmado. Em caso de duvidas, entre em contato com a empresa."
      );
    } catch (error) {
      console.error("Erro ao confirmar agendamento publico:", error);
      alert("Nao foi possivel confirmar o agendamento. Tente novamente.");
    }
  };


  // Add employee publico
  const handleAddEmployeeFromPublic = async (
    employeeData: Omit<Employee, "id">
  ) => {
    const bookingToken = getBookingToken();
    if (!bookingToken) {
      alert("Link de agendamento invalido.");
      return "";
    }

    const newEmployeeId = generateId();

    try {
      const response = await apiService.publicAddEmployee({
        companyToken: bookingToken,
        employeeId: newEmployeeId,
        name: employeeData.name,
        phone: employeeData.phone ?? null,
        department: employeeData.department ?? null,
      });

      if (!response.success) {
        throw new Error(response.error || "Falha ao salvar colaborador.");
      }

      const employee: Employee =
        response.data ?? {
          id: newEmployeeId,
          companyId: employeeData.companyId,
          name: employeeData.name,
          phone: employeeData.phone ?? null,
          department: employeeData.department ?? null,
        };

      setCompanies((prev) =>
        prev.map((item) =>
          item.id === employee.companyId
            ? {
                ...item,
                employees: item.employees.some((emp) => emp.id === employee.id)
                  ? item.employees.map((emp) =>
                      emp.id === employee.id ? employee : emp
                    )
                  : [...item.employees, employee],
              }
            : item
        )
      );

        await fetchPublicData();

      return employee.id;
    } catch (error) {
      console.error("Erro ao adicionar colaborador publico:", error);
      alert("Nao foi possivel adicionar o colaborador. Tente novamente.");
      await fetchPublicData();
      return "";
    }
  };

  // Provider management functions
  const handleAddProvider = async (providerData: Omit<Provider, "id">) => {
    try {
      await apiService.createProvider({
        name: providerData.name,
        email: providerData.email,
        phone: providerData.phone ?? undefined,
        specialties: providerData.specialties ?? [],
        workingHours: providerData.workingHours ?? null,
        breaks: providerData.breaks ?? [],
        createUser: true,
      });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao cadastrar prestador:", error);
      alert("Não foi possível cadastrar o prestador. Tente novamente.");
    }
  };

  const handleUpdateProvider = async (
    id: string,
    providerData: Partial<Provider>
  ) => {
    try {
      await apiService.updateProvider(id, providerData);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar prestador:", error);
      alert("Não foi possível atualizar o prestador. Tente novamente.");
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este prestador?")) {
      return;
    }

    try {
      await apiService.updateProvider(id, { isActive: false });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir prestador:", error);
      alert("Não foi possível excluir o prestador. Tente novamente.");
    }
  };

  // ✅ Alterar senha do prestador (faltava no App)
  const handleChangeProviderPassword = async (
    providerId: string,
    password: string
  ) => {
    try {
      const res = await apiService.updateProviderPassword(providerId, password);
      if (!res.success) throw new Error(res.error || "Falha ao alterar senha");
      alert("Senha do prestador alterada com sucesso!");
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao alterar senha do prestador:", error);
      alert("Não foi possível alterar a senha do prestador. Tente novamente.");
    }
  };

  // Company management functions
  const handleAddCompany = async (
    companyData: Omit<Company, "id">,
    options?: { password?: string }
  ) => {
    try {
      const createResponse = await apiService.createCompany({
        name: companyData.name,
        address: companyData.address ?? undefined,
        phone: companyData.phone ?? undefined,
        email: companyData.email ?? undefined,
        notes: companyData.notes ?? undefined,
        employees: companyData.employees?.map((employee) => ({
          name: employee.name,
          phone: employee.phone ?? undefined,
          department: employee.department ?? undefined,
        })),
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || "Erro ao salvar empresa");
      }

      const createdCompany = createResponse.data;

      if (companyData.email && options?.password) {
        await apiService.createUser({
          name: companyData.name,
          email: companyData.email,
          phone: companyData.phone ?? undefined,
          password: options.password,
          role: "company",
          companyId: createdCompany.id,
        });
      }

      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao cadastrar empresa:", error);
      alert("Não foi possível cadastrar a empresa. Tente novamente.");
    }
  };

  const handleUpdateCompany = async (
    id: string,
    companyData: Partial<Company>
  ) => {
    try {
      await apiService.updateCompany(id, companyData);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      alert("Não foi possível atualizar a empresa. Tente novamente.");
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) {
      return;
    }

    try {
      await apiService.updateCompany(id, { isActive: false });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      alert("Não foi possível excluir a empresa. Tente novamente.");
    }
  };

  // Alterar senha da empresa
  const handleChangeCompanyPassword = async (
    companyId: string,
    password: string
  ) => {
    try {
      const res = await apiService.changeCompanyPassword(companyId, password);
      if (!res.success) throw new Error(res.error || "Falha ao alterar senha");
      alert("Senha alterada com sucesso!");
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao alterar senha da empresa:", error);
      alert("Não foi possível alterar a senha. Tente novamente.");
    }
  };

  // Service management functions
  const handleAddService = async (
    serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await apiService.createService({
        name: serviceData.name,
        duration: serviceData.duration,
        description: serviceData.description ?? undefined,
        price: serviceData.price ?? null,
      });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao cadastrar serviço:", error);
      alert("Não foi possível cadastrar o serviço. Tente novamente.");
    }
  };

  const handleUpdateService = async (
    id: string,
    serviceData: Partial<Service>
  ) => {
    try {
      await apiService.updateService(id, serviceData);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      alert("Não foi possível atualizar o serviço. Tente novamente.");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) {
      return;
    }

    try {
      await apiService.deleteService(id);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      alert("Não foi possível excluir o serviço. Tente novamente.");
    }
  };

  // Admin users
  const handleAddAdmin = async (
    adminData: Omit<User, "id" | "createdAt" | "updatedAt"> & {
      password?: string;
    }
  ) => {
    try {
      await apiService.createUser({
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone ?? undefined,
        password: adminData.password,
        role: "admin",
      });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao cadastrar administrador:", error);
      alert("Não foi possível cadastrar o administrador. Tente novamente.");
    }
  };

  const handleUpdateAdmin = async (
    id: string,
    adminData: Partial<User> & { password?: string }
  ) => {
    try {
      await apiService.updateUser(id, adminData);
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar administrador:", error);
      alert("Não foi possível atualizar o administrador. Tente novamente.");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este administrador?")) {
      return;
    }

    try {
      await apiService.updateUser(id, { isActive: false });
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao excluir administrador:", error);
      alert("Não foi possível excluir o administrador. Tente novamente.");
    }
  };

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => {
    try {
      await apiService.updateAppointment(appointmentId, { status });
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
      );
      await loadInitialData({ roleOverride: currentUser?.role });
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
      alert("N�o foi poss�vel atualizar o status do agendamento. Tente novamente.");
    }
  };

  const getFilteredData = () => {
    if (!currentUser)
      return {
        appointments: [] as Appointment[],
        companies: [] as Company[],
        employees: [] as Employee[],
      };

    switch (currentUser.role) {
            case "company": {
        const normalizedCompanyId =
          currentUser.companyId ??
          companies.find(
            (c) =>
              c.email &&
              currentUser.email &&
              c.email.toLowerCase() === currentUser.email.toLowerCase()
          )?.id ??
          (companies.length === 1 ? companies[0].id : null);
        const userCompany = normalizedCompanyId
          ? companies.find((c) => c.id === normalizedCompanyId)
          : companies.length === 1
          ? companies[0]
          : null;
        return {
          appointments: userCompany
            ? appointments.filter((apt) => apt.companyId === userCompany.id)
            : appointments,
          companies: userCompany ? [userCompany] : companies,
          employees: userCompany
            ? userCompany.employees
            : companies.flatMap((c) => c.employees),
        };
      }
      case "provider": {
        const providerRecord = providers.find(
          (p) =>
            p.userId === currentUser.id ||
            p.id === currentUser.providerId ||
            (currentUser as any).providerId === p.id ||
            (currentUser?.email &&
              p.email &&
              p.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        const providerEntityId = providerRecord?.id ?? currentUser.providerId ?? null;

        return {
          appointments: providerEntityId
            ? appointments.filter((apt) => apt.providerId === providerEntityId)
            : appointments,
          companies,
          employees: companies.flatMap((c) => c.employees),
        };
      }
      default:
        return {
          appointments,
          companies,
          employees: companies.flatMap((c) => c.employees),
        };
    }
  };

  const renderMainContent = () => {
    if (!currentUser) return null;

    const filteredData = getFilteredData();

    // Company Dashboard
    if (currentUser.role === "company") {
      const userCompany = filteredData.companies.length > 0
        ? filteredData.companies[0]
        : companies.find((c) =>
            currentUser.companyId
              ? c.id === currentUser.companyId
              : currentUser.email &&
                c.email &&
                c.email.toLowerCase() === currentUser.email.toLowerCase()
          ) ?? (companies.length === 1 ? companies[0] : undefined);
      if (!userCompany) return <div>Empresa n�o encontrada</div>;

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
    if (currentUser.role === "provider" && activeTab === "my-schedule") {
      const provider = providers.find(
        (p) =>
          p.userId === currentUser.id ||
          p.id === currentUser.providerId ||
          (currentUser as any).providerId === p.id ||
          (currentUser?.email &&
            p.email &&
            p.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (!provider) return <div>Prestador n�o encontrado</div>;

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
      case "calendar":
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
              {viewMode === "month" && (
                <MonthView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                  onDateClick={handleDateClick}
                  onCompanyClick={handleCompanyClick}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                  onTimeSlotClick={(date, time) =>
                    handleTimeSlotClick(date, time)
                  }
                  onCompanyClick={handleCompanyClick}
                />
              )}
              {viewMode === "day" && (
                <DayView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                  onTimeSlotClick={(time) =>
                    handleTimeSlotClick(currentDate, time)
                  }
                  onCompanyClick={handleCompanyClick}
                />
              )}
            </div>
          </div>
        );

      case "providers":
        return (
          <ProviderManagement
            providers={providers}
            onAddProvider={handleAddProvider}
            onUpdateProvider={handleUpdateProvider}
            onDeleteProvider={handleDeleteProvider}
            onChangeProviderPassword={handleChangeProviderPassword}
          />
        );

      case "companies":
        return (
          <CompanyManagement
            companies={companies}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
            onChangeCompanyPassword={handleChangeCompanyPassword}
          />
        );

      case "services":
        return (
          <ServiceManagement
            services={services}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
          />
        );

      case "admins":
        const adminUsers = users.filter((user) => user.role === "admin");
        return (
          <AdminManagement
            admins={adminUsers}
            onAddAdmin={handleAddAdmin}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            currentUserId={currentUser.id}
          />
        );

      case "reports":
        return (
          <ReportsPage
            appointments={filteredData.appointments}
            providers={providers}
            companies={companies}
          />
        );

      case "logo-customization":
        return (
          <LogoCustomization
            onSave={(config) => {
              console.log("✅ Configurações de logo aplicadas:", config);
            }}
          />
        );

      case "dashboard":
      case "appointments":
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

  // 🔓 Página pública SEM exigir login
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
          appointments={appointments}
          onBookAppointment={handlePublicBookAppointment}
          onAddEmployee={handleAddEmployeeFromPublic}
        />
      );
    }
  }

  // Tela de login se não autenticado
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // App autenticado
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentUser={currentUser!}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={
          currentUser!.role === "admin" || currentUser!.role === "provider"
        }
      />

      <div className="flex">
        {(currentUser!.role === "admin" ||
          currentUser!.role === "provider") && (
          <Sidebar
            userRole={currentUser!.role}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main
          className={`flex-1 overflow-hidden ${
            currentUser!.role === "company" ? "" : "lg:ml-0"
          }`}
        >
          <div className="h-full p-3 sm:p-6">
            <div className="bg-white rounded-lg shadow-sm h-full relative">
              {dataError && (
                <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg m-4">
                  {dataError}
                </div>
              )}
              {isBootstrapping ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
                  <span className="text-gray-600">Sincronizando dados...</span>
                </div>
              ) : (
                renderMainContent()
              )}
            </div>
          </div>
        </main>
      </div>

      {currentUser!.role === "admin" && (
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

      {currentUser!.role === "admin" && (
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

      {currentUser!.role === "admin" && (
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
