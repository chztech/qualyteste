import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { Company, Provider, Service, Employee, Appointment } from "../../types";
import {
  formatDate,
  formatDateWithWeekday,
  isDateTimePast,
  isDatePast,
} from "../../utils/dateUtils";
import BrandLogo from "../Layout/BrandLogo";

interface PublicBookingProps {
  companyToken: string; // base64(companyId)
  companies: Company[];
  providers: Provider[];
  services: Service[];
  availableTimeSlots: string[]; // (não usamos aqui, mas mantido por compatibilidade)
  appointments: Appointment[];
  onBookAppointment: (appointmentData: {
    id: string;
    employeeId?: string;
    notes?: string;
  }) => void | Promise<void>;
  onAddEmployee: (employeeData: Omit<Employee, "id">) => string | Promise<string>;
}

interface AvailableSlot {
  date: string;
  time: string;
  serviceName: string;
  provider: Provider | null;
  duration: number;
  appointmentId: string;
}

interface DateInfo {
  date: string;
  totalSlots: number;
  shifts: {
    morning: number;
    afternoon: number;
    evening: number;
  };
}

function decodeCompanyId(token: string): string | null {
  try {
    return atob(token);
  } catch {
    return null;
  }
}

export default function PublicBooking({
  companyToken,
  companies,
  providers,
  services,
  appointments,
  onBookAppointment,
  onAddEmployee,
}: PublicBookingProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [isNewEmployee, setIsNewEmployee] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeData, setEmployeeData] = useState({
    name: "",
    phone: "",
    department: "",
  });

  // --- Empresa pelo token (sem login) ---
  const companyId = useMemo(
    () => decodeCompanyId(companyToken),
    [companyToken]
  );

  const company = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId]
  );

  // --- helpers turno ---
  const getShiftFromTime = (
    time: string
  ): "morning" | "afternoon" | "evening" => {
    const hour = parseInt(time.split(":")[0], 10);
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  };

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case "morning":
        return Sun;
      case "afternoon":
        return Sunset;
      case "evening":
        return Moon;
      default:
        return Clock;
    }
  };

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case "morning":
        return "Manhã";
      case "afternoon":
        return "Tarde";
      case "evening":
        return "Noite";
      default:
        return shift;
    }
  };

  const getShiftTime = (shift: string) => {
    switch (shift) {
      case "morning":
        return "06:00 - 11:59";
      case "afternoon":
        return "12:00 - 17:59";
      case "evening":
        return "18:00 - 23:59";
      default:
        return "";
    }
  };

  // --- Slots disponíveis com base nas props (sem chamadas protegidas) ---
  const availableSlots = useMemo<AvailableSlot[]>(() => {
    if (!company) return [];

    const companySlots = appointments.filter((apt) => {
      const isCompanySlot = apt.companyId === company.id;
      const isAvailable = !apt.employeeId || apt.employeeId === "";
      const isFuture = !isDateTimePast(apt.date, apt.startTime);
      const isOpenStatus =
        (apt.status as string) === "scheduled" ||
        (apt.status as string) === "confirmed";
      return isCompanySlot && isAvailable && isFuture && isOpenStatus;
    });

    return companySlots
      .map((apt) => {
        const provider = providers.find((p) => p.id === apt.providerId) || null;
        const serviceName =
          (apt as any).serviceName ||
          services.find((s) => s.id === apt.serviceId)?.name ||
          "Serviço";
        return {
          date: apt.date,
          time: apt.startTime,
          serviceName,
          provider,
          duration: Number(apt.duration || 0),
          appointmentId: apt.id,
        };
      })
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : a.date.localeCompare(b.date)
      );
  }, [appointments, company, providers, services]);

  // --- Datas disponíveis (com contagem por turno) ---
  const availableDates = useMemo<DateInfo[]>(() => {
    const datesMap = new Map<string, DateInfo>();
    for (const slot of availableSlots) {
      if (isDatePast(slot.date)) continue;
      if (!datesMap.has(slot.date)) {
        datesMap.set(slot.date, {
          date: slot.date,
          totalSlots: 0,
          shifts: { morning: 0, afternoon: 0, evening: 0 },
        });
      }
      const d = datesMap.get(slot.date)!;
      d.totalSlots += 1;
      d.shifts[getShiftFromTime(slot.time)] += 1;
    }
    return Array.from(datesMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [availableSlots]);

  const getFilteredSlots = useMemo(() => {
    const list = availableSlots.filter((s) => s.date === selectedDate);
    const byShift =
      selectedShift && selectedShift !== ""
        ? list.filter((s) => getShiftFromTime(s.time) === selectedShift)
        : list;

    return byShift
      .filter((s) => !isDateTimePast(s.date, s.time))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [availableSlots, selectedDate, selectedShift]);

  // --- Navegação dos passos ---
  const handleNextStep = () => {
    if (step === 1) {
      if (isNewEmployee) {
        if (
          !employeeData.name ||
          !employeeData.phone ||
          !employeeData.department
        ) {
          alert("❌ Preencha todos os campos obrigatórios");
          return;
        }
      } else {
        if (!selectedEmployee) {
          alert("❌ Selecione um colaborador");
          return;
        }
      }
    } else if (step === 2) {
      if (!selectedDate) {
        alert("❌ Selecione uma data");
        return;
      }
    } else if (step === 4) {
      if (!selectedSlot) {
        alert("❌ Selecione um horário disponível");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmitBooking = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      let employeeId = selectedEmployee?.id;

      if (isNewEmployee && company) {
        const createdId = await Promise.resolve(
          onAddEmployee({
            companyId: company.id,
            name: employeeData.name.trim(),
            phone: employeeData.phone || null,
            department: employeeData.department || null,
          })
        );
        if (createdId) employeeId = createdId;
      }

      await Promise.resolve(
        onBookAppointment({
          id: selectedSlot.appointmentId,
          employeeId,
          notes: `Agendamento via link público - ${
            isNewEmployee ? "Novo colaborador" : "Colaborador existente"
          }: ${
            isNewEmployee ? employeeData.name : selectedEmployee?.name ?? ""
          }`,
        })
      );

      setStep(5);
    } catch (e) {
      console.error(e);
      alert("❌ Erro ao realizar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Logs úteis em debug ---
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // eslint-disable-next-line no-console
    console.log("🔍 PublicBooking Debug Info:", {
      token: companyToken,
      companyId,
      hasCompany: !!company,
      totals: {
        companies: companies.length,
        appointments: appointments.length,
        availableSlots: availableSlots.length,
        availableDates: availableDates.length,
      },
    });
  }, [
    companyToken,
    companyId,
    company,
    companies.length,
    appointments.length,
    availableSlots.length,
    availableDates.length,
  ]);

  // --- Renderização de estados especiais ---
  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
          <div className="text-red-600 mb-4">
            <Building2 className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Link inválido
          </h1>
          <p className="text-gray-600">Token inválido ou corrompido.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <div className="text-red-600 mb-4">
            <Building2 className="w-12 sm:w-16 h-12 sm:h-16 mx-auto" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            O link de agendamento não é válido ou expirou.
            <br />
            Entre em contato com a empresa para obter um novo link.
          </p>
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-500">
            <strong>Debug Info:</strong>
            <br />
            Token: {companyToken}
            <br />
            Companies: {companies.length}
            <br />
            Appointments: {appointments.length}
          </div>
        </div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <div className="text-yellow-600 mb-4">
            <AlertCircle className="w-12 sm:w-16 h-12 sm:h-16 mx-auto" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Sem Horários Disponíveis
          </h1>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Não há horários disponíveis para agendamento no momento.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <p className="text-blue-800 text-sm">
              <strong>📞 Entre em contato:</strong>
              <br />
              Empresa: {company.name}
              <br />
              Telefone: {company.phone}
              {company.email && (
                <>
                  <br />
                  Email: {company.email}
                </>
              )}
            </p>
          </div>
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-500">
            <strong>Debug Info:</strong>
            <br />
            Company: {company.name}
            <br />
            Total Appointments: {appointments.length}
            <br />
            Company Appointments:{" "}
            {appointments.filter((apt) => apt.companyId === company.id).length}
            <br />
            Available Slots: {availableSlots.length}
          </div>
        </div>
      </div>
    );
  }

  // --- UI principal ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-shrink-0">
              <BrandLogo
                size="custom"
                showText={false}
                useCustomization={true}
                context="public"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Agendamento de Massagem
              </h1>
              <p className="text-gray-600">{company.name}</p>
              <p className="text-sm text-gray-500">
                {availableSlots.length} horário(s) disponível(is) em{" "}
                {availableDates.length} data(s)
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      step >= stepNumber
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step > stepNumber ? (
                      <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 5 && (
                    <div
                      className={`w-4 sm:w-8 h-1 mx-1 ${
                        step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600 px-1">
              <span>Dados</span>
              <span>Data</span>
              <span>Turno</span>
              <span>Horário</span>
              <span>OK</span>
            </div>
          </div>
        </div>

        {/* Conteúdo por passo */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {/* Passo 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Suas Informações
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setIsNewEmployee(true)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isNewEmployee
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                  <div className="font-medium text-sm sm:text-base">
                    Primeiro Agendamento
                  </div>
                  <div className="text-xs sm:text-sm">Cadastrar meus dados</div>
                </button>

                <button
                  onClick={() => setIsNewEmployee(false)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    !isNewEmployee
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                  <div className="font-medium text-sm sm:text-base">
                    Já Tenho Cadastro
                  </div>
                  <div className="text-xs sm:text-sm">Selecionar meu nome</div>
                </button>
              </div>

              {isNewEmployee ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={employeeData.name}
                      onChange={(e) =>
                        setEmployeeData({
                          ...employeeData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={employeeData.phone}
                      onChange={(e) =>
                        setEmployeeData({
                          ...employeeData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Setor/Cargo *
                    </label>
                    <input
                      type="text"
                      value={employeeData.department}
                      onChange={(e) =>
                        setEmployeeData({
                          ...employeeData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="Ex: Desenvolvimento, RH, Vendas"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione seu nome na lista:
                  </label>
                  {(company.employees?.length ?? 0) > 0 ? (
                    <select
                      value={selectedEmployee?.id || ""}
                      onChange={(e) => {
                        const emp =
                          company.employees?.find(
                            (x) => x.id === e.target.value
                          ) || null;
                        setSelectedEmployee(emp);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required
                    >
                      <option value="">Selecione seu nome</option>
                      {company.employees!.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                          {employee.department
                            ? ` - ${employee.department}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-yellow-800 text-sm">
                        Ainda não há colaboradores cadastrados nesta empresa.
                        Escolha &quot;Primeiro Agendamento&quot; para se
                        cadastrar.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Passo 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Escolha a Data
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-blue-900 font-medium mb-2 text-sm sm:text-base">
                  📅 Datas Disponíveis:
                </h3>
                <p className="text-blue-800 text-xs sm:text-sm">
                  Selecione uma das datas abaixo que possuem horários
                  disponíveis para agendamento.
                  <br />
                  <strong>
                    ⏰ Apenas datas e horários futuros são exibidos.
                  </strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableDates().map((dateInfo) => (
                  <button
                    key={dateInfo.date}
                    onClick={() => setSelectedDate(dateInfo.date)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedDate === dateInfo.date
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        {formatDate(dateInfo.date, {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <div className="font-medium text-gray-900">
                        {dateInfo.totalSlots} horário
                        {dateInfo.totalSlots > 1 ? "s" : ""} disponível
                        {dateInfo.totalSlots > 1 ? "is" : ""}
                      </div>
                      <div className="space-y-1">
                        {dateInfo.shifts.morning > 0 && (
                          <div className="flex items-center space-x-1">
                            <Sun className="w-3 h-3 text-yellow-500" />
                            <span>Manhã: {dateInfo.shifts.morning}</span>
                          </div>
                        )}
                        {dateInfo.shifts.afternoon > 0 && (
                          <div className="flex items-center space-x-1">
                            <Sunset className="w-3 h-3 text-orange-500" />
                            <span>Tarde: {dateInfo.shifts.afternoon}</span>
                          </div>
                        )}
                        {dateInfo.shifts.evening > 0 && (
                          <div className="flex items-center space-x-1">
                            <Moon className="w-3 h-3 text-purple-500" />
                            <span>Noite: {dateInfo.shifts.evening}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedDate && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2 text-sm sm:text-base">
                    ✅ Data Selecionada:
                  </h3>
                  <div className="text-green-800 text-xs sm:text-sm">
                    📅 <strong>{formatDateWithWeekday(selectedDate)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passo 3 */}
          {step === 3 && selectedDate && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Escolha o Turno
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-blue-900 font-medium mb-2 text-sm sm:text-base">
                  🕐 Turnos Disponíveis:
                </h3>
                <p className="text-blue-800 text-xs sm:text-sm">
                  Para a data selecionada ({formatDate(selectedDate)}), escolha
                  o turno de sua preferência ou veja todos os horários.
                </p>
              </div>

              {(() => {
                const dateInfo = availableDates.find(
                  (d) => d.date === selectedDate
                );
                if (!dateInfo) return null;
                const availableShifts = [
                  { key: "morning", count: dateInfo.shifts.morning },
                  { key: "afternoon", count: dateInfo.shifts.afternoon },
                  { key: "evening", count: dateInfo.shifts.evening },
                ].filter((s) => s.count > 0);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {availableShifts.map(({ key, count }) => {
                        const ShiftIcon = getShiftIcon(key);
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedShift(key)}
                            className={`p-4 rounded-lg border-2 text-center transition-colors ${
                              selectedShift === key
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <ShiftIcon
                              className={`w-8 h-8 mx-auto mb-2 ${
                                key === "morning"
                                  ? "text-yellow-500"
                                  : key === "afternoon"
                                  ? "text-orange-500"
                                  : "text-purple-500"
                              }`}
                            />
                            <div className="font-medium text-gray-900 text-sm sm:text-base">
                              {getShiftLabel(key)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {getShiftTime(key)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">
                              {count} horário{count > 1 ? "s" : ""} disponível
                              {count > 1 ? "is" : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => setSelectedShift("")}
                        className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                          selectedShift === ""
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        <div className="font-medium">Ver todos os horários</div>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {selectedShift !== null && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2 text-sm sm:text-base">
                    ✅ Seleção:
                  </h3>
                  <div className="text-green-800 text-xs sm:text-sm">
                    🕐{" "}
                    <strong>
                      {selectedShift === ""
                        ? "Todos os horários do dia"
                        : `${getShiftLabel(selectedShift)} (${getShiftTime(
                            selectedShift
                          )})`}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passo 4 */}
          {step === 4 && selectedDate && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Escolha seu Horário
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-blue-900 font-medium mb-2 text-sm sm:text-base">
                  📋 Horários Disponíveis:
                </h3>
                <p className="text-blue-800 text-xs sm:text-sm">
                  Data: {formatDate(selectedDate)}
                  {selectedShift &&
                    selectedShift !== "" &&
                    ` • Turno: ${getShiftLabel(selectedShift)}`}
                  {selectedShift === "" && " • Todos os turnos"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {getFilteredSlots.map((slot) => {
                  const shift = getShiftFromTime(slot.time);
                  return (
                    <button
                      key={slot.appointmentId}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedSlot?.appointmentId === slot.appointmentId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900 text-sm sm:text-base">
                          {slot.time}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            shift === "morning"
                              ? "bg-yellow-100 text-yellow-800"
                              : shift === "afternoon"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {getShiftLabel(shift)}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div>
                          💆 <strong>Serviço:</strong> {slot.serviceName}
                        </div>
                        <div>
                          ⏱️ <strong>Duração:</strong> {slot.duration} min
                        </div>
                        <div>
                          🪑 <strong>Vaga disponível</strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {getFilteredSlots.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {selectedShift && selectedShift !== ""
                      ? `Nenhum horário disponível no turno ${getShiftLabel(
                          selectedShift
                        ).toLowerCase()}.`
                      : "Nenhum horário disponível para esta data."}
                  </p>
                  {selectedShift && selectedShift !== "" && (
                    <button
                      onClick={() => setSelectedShift("")}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      Ver todos os horários do dia
                    </button>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2 text-sm sm:text-base">
                    ✅ Horário Selecionado:
                  </h3>
                  <div className="text-green-800 space-y-1 text-xs sm:text-sm">
                    <div>
                      📅 <strong>Data:</strong> {formatDate(selectedSlot.date)}
                    </div>
                    <div>
                      🕐 <strong>Horário:</strong> {selectedSlot.time}
                    </div>
                    <div>
                      💆 <strong>Serviço:</strong> {selectedSlot.serviceName}
                    </div>
                    <div>
                      ⏱️ <strong>Duração:</strong> {selectedSlot.duration}{" "}
                      minutos
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passo 5 */}
          {step === 5 && (
            <div className="text-center space-y-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Agendamento Confirmado!
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Seu horário foi reservado com sucesso.
                </p>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-lg text-left max-w-md mx-auto">
                <h3 className="font-medium text-green-900 mb-3 text-sm sm:text-base">
                  📋 Detalhes do Agendamento:
                </h3>
                <div className="text-green-800 space-y-2 text-xs sm:text-sm">
                  <div>
                    🏢 <strong>Empresa:</strong> {company.name}
                  </div>
                  <div>
                    👤 <strong>Colaborador:</strong>{" "}
                    {isNewEmployee ? employeeData.name : selectedEmployee?.name}
                  </div>
                  <div>
                    📅 <strong>Data:</strong>{" "}
                    {selectedSlot && formatDate(selectedSlot.date)}
                  </div>
                  <div>
                    🕐 <strong>Horário:</strong> {selectedSlot?.time}
                  </div>
                  <div>
                    💆 <strong>Serviço:</strong> {selectedSlot?.serviceName}
                  </div>
                  <div>
                    ⏱️ <strong>Duração:</strong> {selectedSlot?.duration}{" "}
                    minutos
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.close()}
                className="px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Fechar Página
              </button>
            </div>
          )}

          {/* Navegação */}
          {step < 5 && (
            <div className="flex flex-col sm:flex-row justify-between mt-8 pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              )}

              {step < 4 && (
                <button
                  onClick={handleNextStep}
                  className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Próximo
                </button>
              )}

              {step === 4 && (
                <button
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting || !selectedSlot}
                  className="w-full sm:w-auto sm:ml-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
