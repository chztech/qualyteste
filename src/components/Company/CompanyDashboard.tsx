import React, { useState } from 'react';
import { Users, Calendar, Plus, Edit2, Trash2, Clock, User, CheckCircle, X, AlertTriangle, Link, Copy, QrCode, ExternalLink } from 'lucide-react';
import { Company, Employee, Appointment, Provider, Service } from '../../types';
import { formatDate, getCurrentDateString, isToday } from '../../utils/dateUtils';
import QRCode from 'qrcode';

interface CompanyDashboardProps {
  company: Company;
  employees: Employee[];
  appointments: Appointment[];
  providers: Provider[];
  services: Service[];
  availableTimeSlots: string[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (id: string, employee: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
  onBookAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onUpdateAppointment?: (id: string, appointmentData: Partial<Appointment>) => void;
  onDeleteAppointment?: (id: string) => void;
}

export default function CompanyDashboard({
  company,
  employees,
  appointments,
  providers,
  services,
  availableTimeSlots,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBookAppointment,
  onUpdateAppointment,
  onDeleteAppointment
}: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'appointments' | 'booking-link'>('overview');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  
  const [editData, setEditData] = useState({
    date: '',
    startTime: '',
    duration: 15,
    service: '',
    notes: ''
  });
  const [employeeData, setEmployeeData] = useState({
    name: '',
    phone: '',
    department: ''
  });

  // 🎯 FUNÇÃO: Gerar token único para a empresa
  const generateCompanyToken = () => {
    // Token permanente baseado apenas no ID da empresa
    return btoa(company.id);
  };

  // 🎯 FUNÇÃO: Obter link público de agendamento
  const getPublicBookingLink = () => {
    const token = generateCompanyToken();
    // Usar URL absoluta com protocolo HTTPS
    const baseUrl = window.location.protocol === 'https:' 
      ? window.location.origin 
      : 'https://' + window.location.host;
    console.log('🔗 Base URL:', baseUrl); // Debug log
    console.log('🎫 Token gerado:', token); // Debug log
    return `${baseUrl}/agendamento/${token}`;
  };

  // 🎯 FUNÇÃO: Copiar link para clipboard
  const copyLinkToClipboard = async () => {
    try {
      const link = getPublicBookingLink();
      await navigator.clipboard.writeText(link);
      alert('✅ Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('❌ Erro ao copiar link. Tente novamente.');
    }
  };

  // 🎯 FUNÇÃO: Gerar QR Code
  const generateQRCode = async () => {
    try {
      const link = getPublicBookingLink();
      console.log('🔗 Gerando QR Code para:', link); // Debug log
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        type: 'image/png'
      });
      setQrCodeDataUrl(qrDataUrl);
      setShowQRCode(true);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert('❌ Erro ao gerar QR Code. Tente novamente.');
    }
  };

  // 🎯 FUNÇÃO: Abrir link em nova aba
  const openPublicLink = () => {
    const link = getPublicBookingLink();
    window.open(link, '_blank');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeData.name || !employeeData.phone || !employeeData.department) {
      alert('❌ Preencha todos os campos obrigatórios');
      return;
    }

    const newEmployeeData = {
      ...employeeData,
      companyId: company.id
    };
    
    onAddEmployee(newEmployeeData);
    
    setEmployeeData({ name: '', phone: '', department: '' });
    setShowAddEmployee(false);
    alert('✅ Colaborador adicionado com sucesso!');
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeData.name || !employeeData.phone || !employeeData.department) {
      alert('❌ Preencha todos os campos obrigatórios');
      return;
    }
    
    if (editingEmployee) {
      onUpdateEmployee(editingEmployee.id, employeeData);
      setEditingEmployee(null);
      setEmployeeData({ name: '', phone: '', department: '' });
      setShowAddEmployee(false);
      alert('✅ Colaborador atualizado com sucesso!');
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('❓ Tem certeza que deseja excluir este colaborador?')) {
      onDeleteEmployee(id);
      alert('✅ Colaborador excluído com sucesso!');
    }
  };

  // 🎯 NOVA FUNÇÃO: Editar agendamento
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditData({
      date: '',
      startTime: '',
      duration: 0,
      service: '',
      notes: ''
    });
    setShowEditModal(true);
  };

  // 🎯 NOVA FUNÇÃO: Confirmar edição
  const handleConfirmEdit = () => {
    if (!editingAppointment) return;

    // Apenas remover o funcionário do agendamento (liberar vaga)
    if (onUpdateAppointment) {
      onUpdateAppointment(editingAppointment.id, {
        employeeId: '', // Remove o funcionário, liberando a vaga
        notes: 'Vaga liberada pela empresa'
      });
    }
    
    setShowEditModal(false);
    setEditingAppointment(null);
    alert('✅ Funcionário removido do agendamento. Vaga liberada!');
  };

  // 🎯 NOVA FUNÇÃO: Adicionar funcionário a um slot disponível
  const handleAssignEmployee = (appointment: Appointment, employeeId: string) => {
    if (onUpdateAppointment) {
      const employee = employees.find(e => e.id === employeeId);
      onUpdateAppointment(appointment.id, {
        employeeId: employeeId,
        notes: `Agendado para ${employee?.name} via painel da empresa`
      });
    }
    alert('✅ Funcionário adicionado ao agendamento!');
  };
  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  // 🎯 NOVA FUNÇÃO: Confirmar exclusão
  const handleConfirmDelete = () => {
    if (!appointmentToDelete) return;

    if (onDeleteAppointment) {
      onDeleteAppointment(appointmentToDelete.id);
    }
    
    setShowDeleteModal(false);
    setAppointmentToDelete(null);
    alert('✅ Agendamento excluído com sucesso!');
  };

  // 🎯 FUNÇÃO AUXILIAR: Calcular horário de fim
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const handleEditEmployee = (employee: Employee) => {
    setEmployeeData({
      name: employee.name,
      phone: employee.phone,
      department: employee.department
    });
    setEditingEmployee(employee);
    setShowAddEmployee(true);
  };

  // 🎯 DADOS CORRIGIDOS: Usar datas consistentes
  const todayAppointments = appointments.filter(apt => {
    const today = getCurrentDateString();
    return apt.date === today;
  });

  const upcomingAppointments = appointments
    .filter(apt => apt.date >= getCurrentDateString())
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600 mt-1">Dashboard da Empresa</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-sm text-gray-500 space-y-1 sm:space-y-0">
              <span>📍 {company.address}</span>
              <span>📞 {company.phone}</span>
              {company.email && <span>📧 {company.email}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto justify-around sm:justify-end">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Colaboradores</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{employees.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Hoje</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{todayAppointments.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Próximos</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{upcomingAppointments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 px-4 sm:px-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Calendar },
              { id: 'employees', label: 'Colaboradores', icon: Users },
              { id: 'appointments', label: 'Agendamentos', icon: Clock },
              { id: 'booking-link', label: 'Link Público', icon: Link }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Colaboradores</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900">{employees.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-xs sm:text-sm font-medium text-green-600">Hoje</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-900">{todayAppointments.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-xs sm:text-sm font-medium text-purple-600">Próximos</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900">{upcomingAppointments.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Appointments */}
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Próximos Agendamentos</h3>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => {
                    const provider = providers.find(p => p.id === appointment.providerId);
                    const employee = employees.find(e => e.id === appointment.employeeId);
                    
                    return (
                      <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                              {employee ? employee.name : 'Colaborador não especificado'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {appointment.service} • {appointment.duration} min
                            </p>
                            <p className="text-xs text-gray-500">
                              {employee?.department}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">
                            📅 {formatDate(appointment.date)}
                            {isToday(appointment.date) && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Hoje
                              </span>
                            )}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            🕐 {appointment.startTime} - {appointment.endTime}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {upcomingAppointments.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum agendamento próximo</p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2">
                        Os próximos agendamentos aparecerão aqui
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Colaboradores ({employees.length})
                </h3>
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors text-sm w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Colaborador</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">{employee.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                        <span className="w-3 h-3 sm:w-4 sm:h-4 mr-2">📞</span>
                        {employee.phone}
                      </p>
                    </div>
                  </div>
                ))}
                
                {employees.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum colaborador cadastrado</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      Adicione colaboradores para começar a agendar
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Agendamentos ({appointments.length})
                </h3>
              </div>

              <div className="space-y-3">
                {appointments
                  .sort((a, b) => {
                    if (a.date !== b.date) {
                      return b.date.localeCompare(a.date); // Mais recentes primeiro
                    }
                    return b.startTime.localeCompare(a.startTime);
                  })
                  .map((appointment) => {
                    const employee = employees.find(e => e.id === appointment.employeeId);
                    return (
                      <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                {employee ? employee.name : 'Vaga disponível'}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {appointment.service} • {appointment.duration} minutos
                              </p>
                              <p className="text-xs text-gray-500">
                                {employee ? employee.department : 'Aguardando agendamento'}
                              </p>
                              {appointment.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📝 {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                            <div className="text-left">
                              <p className="font-medium text-gray-900 text-sm sm:text-base">
                                📅 {formatDate(appointment.date)}
                                {isToday(appointment.date) && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Hoje
                                  </span>
                                )}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                🕐 {appointment.startTime} - {appointment.endTime}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                            </div>
                            
                            {/* Ações do Agendamento */}
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                              {employee ? (
                                <button
                                  onClick={() => handleEditAppointment(appointment)}
                                  className="flex items-center justify-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                  title="Remover Funcionário"
                                >
                                  <User className="w-3 h-3" />
                                  <span>Remover</span>
                                </button>
                              ) : (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignEmployee(appointment, e.target.value);
                                      e.target.value = ''; // Reset select
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  defaultValue=""
                                >
                                  <option value="">+ Adicionar</option>
                                  {employees.map(emp => (
                                    <option key={emp.id} value={emp.id} className="text-gray-900">
                                      {emp.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <button
                                onClick={() => handleDeleteAppointment(appointment)}
                                className="flex items-center justify-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                title="Excluir Agendamento"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {appointments.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum agendamento encontrado</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      Os agendamentos da sua empresa aparecerão aqui
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🎯 NOVA ABA: Link Público de Agendamento */}
          {activeTab === 'booking-link' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Link className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Link Público de Agendamento
                </h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                  Compartilhe este link com seus colaboradores para que eles possam agendar 
                  massagens de forma independente. O link é único para sua empresa.
                </p>
              </div>

              {/* Link Display */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Seu Link de Agendamento:</h4>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <button
                      onClick={copyLinkToClipboard}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm justify-center"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </button>
                    <button
                      onClick={generateQRCode}
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm justify-center"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </button>
                    <button
                      onClick={openPublicLink}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm justify-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Testar</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded border border-gray-300 font-mono text-xs sm:text-sm text-gray-700 break-all">
                  {getPublicBookingLink()}
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm mr-2">1</span>
                    Como Compartilhar
                  </h4>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-2">
                    <li>• Envie o link por email para seus colaboradores</li>
                    <li>• Compartilhe no WhatsApp ou Telegram</li>
                    <li>• Adicione ao intranet da empresa</li>
                    <li>• Imprima o QR Code e cole em murais</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm mr-2">2</span>
                    Como Funciona
                  </h4>
                  <ul className="text-xs sm:text-sm text-green-800 space-y-2">
                    <li>• Colaboradores acessam o link</li>
                    <li>• Escolhem data e horário disponível</li>
                    <li>• Preenchem seus dados pessoais</li>
                    <li>• Agendamento é confirmado automaticamente</li>
                  </ul>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1 text-sm sm:text-base">Importante:</h4>
                    <p className="text-xs sm:text-sm text-yellow-800">
                      Este link é específico para sua empresa e permite que qualquer pessoa 
                      com acesso possa agendar em nome dos seus colaboradores. Compartilhe 
                      apenas com pessoas autorizadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {editingEmployee ? 'Editar Colaborador' : 'Adicionar Colaborador'}
              </h3>
              <button
                onClick={() => {
                  setShowAddEmployee(false);
                  setEditingEmployee(null);
                  setEmployeeData({ name: '', phone: '', department: '' });
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <form onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={employeeData.name}
                    onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Nome do colaborador"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={employeeData.phone}
                    onChange={(e) => setEmployeeData({ ...employeeData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Setor/Cargo *
                  </label>
                  <input
                    type="text"
                    value={employeeData.department}
                    onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Ex: Desenvolvimento, RH, Vendas"
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmployee(false);
                    setEditingEmployee(null);
                    setEmployeeData({ name: '', phone: '', department: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {editingEmployee ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">QR Code do Link</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-white p-2 sm:p-4 rounded-lg border border-gray-200 inline-block mb-4">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code do Link de Agendamento" 
                    className="w-48 h-48 sm:w-72 sm:h-72 mx-auto"
                  />
                )}
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                <strong>📱 Como usar:</strong><br/>
                Escaneie este QR Code com a câmera do celular para acessar diretamente o link de agendamento da sua empresa.
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-left">
                <p className="text-blue-800 text-xs sm:text-sm">
                  <strong>🔗 Link do QR Code:</strong><br/>
                  <code className="text-xs break-all">{getPublicBookingLink()}</code>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `qrcode-${company.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
                    link.href = qrCodeDataUrl;
                    link.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Baixar QR Code
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Remover Funcionário</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Tem certeza que deseja remover este funcionário do agendamento?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    A vaga ficará disponível para outros funcionários.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">📋 Detalhes do Agendamento:</h4>
                <div className="text-gray-700 text-sm space-y-1">
                  <div><strong>Funcionário:</strong> {employees.find(e => e.id === editingAppointment?.employeeId)?.name || 'Não especificado'}</div>
                  <div><strong>Data:</strong> {editingAppointment && formatDate(editingAppointment.date)}</div>
                  <div><strong>Horário:</strong> {editingAppointment?.startTime} - {editingAppointment?.endTime}</div>
                  <div><strong>Serviço:</strong> {editingAppointment?.service}</div>
                  <div><strong>Status:</strong> {editingAppointment && getStatusLabel(editingAppointment.status)}</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>ℹ️ Após remover:</strong> A vaga ficará disponível e outros funcionários poderão agendar este horário através do link público.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Remover Funcionário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Appointment Modal */}
      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Tem certeza que deseja excluir este agendamento?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {employees.find(e => e.id === appointmentToDelete.employeeId)?.name || 'Colaborador não especificado'}
                </p>
                <p className="text-xs text-gray-600">
                  {appointmentToDelete.service} • {formatDate(appointmentToDelete.date)} • {appointmentToDelete.startTime}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Excluir Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}