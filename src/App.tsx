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
    async (roleOverride?: User["role"]) => {
      setIsBootstrapping(true);
      setDataError(null);
      try {
        const effectiveRole = roleOverride ?? currentUser?.role;

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
          apiService.getAppointments(),
          effectiveRole === "admin"
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
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        setDataError("Não foi possível carregar os dados do sistema.");
      } finally {
        setIsBootstrapping(false);
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

  // 🎯 Identificar página pública
  const isPublicBookingPage = React.useCallback(() => {
    try {
      const path = window.location.pathname;
      const isBookingRoute =
        path.startsWith("/agendamento/") &&
        path.length > "/agendamento/".length;
      if (!isBookingRoute) return false;

      // valida token
      const token = path.split("/agendamento/")[1];
      try {
        const decoded = atob(token);
        const isValidToken =
          decoded && decoded.length > 0 && !decoded.includes(" ");
        return isValidToken;
      } catch {
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar página pública:", error);
      return false;
    }
  }, []);

  // 🎯 Obter token da URL
  const getBookingToken = React.useCallback(() => {
    try {
      const path = window.location.pathname;
      const token = path.split("/agendamento/")[1];
      return token;
    } catch (error) {
      console.error("Erro ao extrair token:", error);
      return null;
    }
  }, []);

  // 🔄 Carregar dados públicos sem exigir login (GETs)
  useEffect(() => {
    const run = async () => {
      if (isPublicBookingPage()) {
        try {
          const [companiesRes, providersRes, servicesRes, appointmentsRes] =
            await Promise.all([
              apiService.getCompanies(),
              apiService.getProviders(),
              apiService.getServices(),
              apiService.getAppointments(),
            ]);

          setCompanies(companiesRes.success ? companiesRes.data ?? [] : []);
          setProviders(providersRes.success ? providersRes.data ?? [] : []);
          setServices(servicesRes.success ? servicesRes.data ?? [] : []);
          setAppointments(
            appointmentsRes.success ? appointmentsRes.data ?? [] : []
          );
        } catch (e) {
          console.error("Falha ao carregar dados públicos:", e);
        }
      }
    };
    run();
  }, [isPublicBookingPage]);

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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData();
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
        await loadInitialData(user.role);

        const mappedUser: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone ?? null,
          role: user.role,
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
      if (selectedAppointment) {
        await apiService.updateAppointment(
          selectedAppointment.id,
          appointmentData
        );
      } else {
        await apiService.createAppointment({
          companyId: appointmentData.companyId,
          providerId: appointmentData.providerId,
          clientId: appointmentData.clientId,
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

      await loadInitialData();
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
      await apiService.updateAppointment(id, appointmentData);
      await loadInitialData();
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      alert("Não foi possível atualizar o agendamento. Tente novamente.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await apiService.deleteAppointments([id]);
      await loadInitialData();
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
        appointmentIds.map((id) => apiService.updateAppointment(id, updateData))
      );
      await loadInitialData();
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
      await loadInitialData();
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
            clientId: companyId,
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
      await loadInitialData();
    } catch (error) {
      console.error("Erro ao criar agendamentos:", error);
      alert("Não foi possível criar os agendamentos. Tente novamente.");
    }
  };

  // Company booking (empresa aloca colaborador)
  const handleCompanyBookAppointment = async (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const existingSlot = appointments.find((apt) => {
        const sameService = appointmentData.serviceId
          ? apt.serviceId === appointmentData.serviceId
          : apt.service === appointmentData.service;

        return (
          apt.companyId === appointmentData.companyId &&
          apt.date === appointmentData.date &&
          apt.startTime === appointmentData.startTime &&
          sameService &&
          (!apt.employeeId || apt.employeeId === "")
        );
      });

      if (existingSlot) {
        await apiService.updateAppointment(existingSlot.id, {
          employeeId: appointmentData.employeeId ?? null,
          notes: appointmentData.notes,
          status: appointmentData.status,
        });
      } else {
        await apiService.createAppointment({
          companyId: appointmentData.companyId,
          providerId: appointmentData.providerId,
          clientId: appointmentData.clientId,
          employeeId: appointmentData.employeeId ?? null,
          serviceId: appointmentData.serviceId,
          date: appointmentData.date,
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          duration: appointmentData.duration,
          status: appointmentData.status,
          notes: appointmentData.notes,
        });
      }

      await loadInitialData();
    } catch (error) {
      console.error("Erro ao registrar agendamento da empresa:", error);
      alert("Não foi possível registrar o agendamento. Tente novamente.");
    }
  };

  // Public booking (confirmar slot existente)
  const handlePublicBookAppointment = async (appointmentData: {
    id: string;
    employeeId?: string;
    notes?: string;
  }) => {
    try {
      await apiService.updateAppointment(appointmentData.id, {
        employeeId: appointmentData.employeeId ?? null,
        notes: appointmentData.notes,
        status: "confirmed",
      });

      await loadInitialData();

      alert(
        "✅ Agendamento realizado com sucesso!\n\nSeu horário foi confirmado. Em caso de dúvidas, entre em contato com a empresa."
      );
    } catch (error) {
      console.error("Erro ao confirmar agendamento público:", error);
      alert("Não foi possível confirmar o agendamento. Tente novamente.");
    }
  };

  // Add employee publico
  const handleAddEmployeeFromPublic = (employeeData: Omit<Employee, "id">) => {
    const company = companies.find(
      (item) => item.id === employeeData.companyId
    );
    if (!company) {
      alert("Empresa não encontrada para associar o colaborador.");
      return "";
    }

    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
    };

    setCompanies((prev) =>
      prev.map((item) =>
        item.id === company.id
          ? { ...item, employees: [...item.employees, newEmployee] }
          : item
      )
    );

    apiService
      .updateCompany(company.id, {
        employees: [...company.employees, newEmployee],
      })
      .then(() => loadInitialData(currentUser?.role))
      .catch((error) => {
        console.error("Erro ao adicionar colaborador público:", error);
        alert("Não foi possível adicionar o colaborador. Tente novamente.");
        loadInitialData(currentUser?.role);
      });

    return newEmployee.id;
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData(currentUser?.role);
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

      await loadInitialData(currentUser?.role);
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData(currentUser?.role);
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData();
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
      await loadInitialData();
    } catch (error) {
      console.error("Erro ao excluir administrador:", error);
      alert("Não foi possível excluir o administrador. Tente novamente.");
    }
  };

  const handleUpdateAppointmentStatus = (
    appointmentId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
    );
  };

  const getFilteredData = () => {
    if (!currentUser)
      return {
        appointments: [] as Appointment[],
        companies: [] as Company[],
        employees: [] as Employee[],
      };

    switch (currentUser.role) {
      case "company":
        const userCompany = companies.find(
          (c) => c.id === currentUser.companyId
        );
        return {
          appointments: appointments.filter(
            (apt) => apt.companyId === currentUser.companyId
          ),
          companies: userCompany ? [userCompany] : [],
          employees: userCompany ? userCompany.employees : [],
        };
      case "provider":
        return {
          appointments: appointments.filter(
            (apt) => apt.providerId === currentUser.id
          ),
          companies,
          employees: companies.flatMap((c) => c.employees),
        };
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
      const userCompany = companies.find((c) => c.id === currentUser.companyId);
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
    if (currentUser.role === "provider" && activeTab === "my-schedule") {
      const provider = providers.find((p) => p.id === currentUser.id);
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
