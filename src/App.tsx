import React, { useState, useEffect } from "react";
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
import apiService from "./services/apiService";

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Application state
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Data state (vindo da API real)
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Carregar dados iniciais da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersRes,
          companiesRes,
          providersRes,
          servicesRes,
          appointmentsRes,
        ] = await Promise.all([
          apiService.getUsers(),
          apiService.getCompanies(),
          apiService.getProviders(),
          apiService.getServices(),
          apiService.getAppointments(),
        ]);

        if (usersRes.success) setUsers(usersRes.data || []);
        if (companiesRes.success) setCompanies(companiesRes.data || []);
        if (providersRes.success) setProviders(providersRes.data || []);
        if (servicesRes.success) setServices(servicesRes.data || []);
        if (appointmentsRes.success)
          setAppointments(appointmentsRes.data || []);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    fetchData();
  }, []);

  // Login via API
  const handleLogin = async (email: string, password: string) => {
    const res = await apiService.login(email, password);
    if (res.success && res.data) {
      setCurrentUser(res.data.user);
      apiService.setAuthToken(res.data.token);
      setIsAuthenticated(true);
    } else {
      alert("Erro no login: " + res.error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    apiService.clearAuthToken();
    setActiveTab("calendar");
  };

  // CRUD via API
  const handleAddCompany = async (companyData: Omit<Company, "id">) => {
    const res = await apiService.createCompany(companyData);
    if (res.success && res.data) setCompanies((prev) => [...prev, res.data]);
  };

  const handleAddProvider = async (providerData: Omit<Provider, "id">) => {
    const res = await apiService.createProvider(providerData);
    if (res.success && res.data) setProviders((prev) => [...prev, res.data]);
  };

  const handleAddService = async (serviceData: Omit<Service, "id">) => {
    const res = await apiService.createService(serviceData);
    if (res.success && res.data) setServices((prev) => [...prev, res.data]);
  };

  const handleAppointmentSubmit = async (
    appointmentData: Omit<Appointment, "id">
  ) => {
    const res = await apiService.createAppointment(appointmentData);
    if (res.success && res.data) setAppointments((prev) => [...prev, res.data]);
  };

  // Painéis
  const getFilteredData = () => {
    if (!currentUser) return { appointments: [], companies: [], employees: [] };

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

    switch (activeTab) {
      case "calendar":
        return (
          <div className="flex flex-col h-full">
            <CalendarHeader
              currentDate={currentDate}
              viewMode={viewMode}
              onDateChange={setCurrentDate}
              onViewModeChange={setViewMode}
            />
            <div className="flex-1 overflow-hidden">
              {viewMode === "month" && (
                <MonthView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
                />
              )}
              {viewMode === "day" && (
                <DayView
                  currentDate={currentDate}
                  appointments={filteredData.appointments}
                  companies={companies}
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
          />
        );
      case "companies":
        return (
          <CompanyManagement
            companies={companies}
            onAddCompany={handleAddCompany}
          />
        );
      case "services":
        return (
          <ServiceManagement
            services={services}
            onAddService={handleAddService}
          />
        );
      case "admins":
        return (
          <AdminManagement admins={users.filter((u) => u.role === "admin")} />
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
            onSave={(config) => console.log("Configurações de logo:", config)}
          />
        );
      default:
        return (
          <AdminDashboard
            appointments={filteredData.appointments}
            providers={providers}
            companies={companies}
          />
        );
    }
  };

  // Login inicial
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

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
            <div className="bg-white rounded-lg shadow-sm h-full">
              {renderMainContent()}
            </div>
          </div>
        </main>
      </div>

      {currentUser!.role === "admin" && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col space-y-3 z-40">
          <button
            onClick={() => setActiveTab("companies")}
            className="bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
