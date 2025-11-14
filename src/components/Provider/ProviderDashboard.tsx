import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Edit3, Save, X, Phone } from 'lucide-react';
import { Provider, Appointment, Company, Employee } from '../../types';
import { formatDate, formatDateWithWeekday, getCurrentDateString, getWeekRange, getMonthRange, dateToInputString } from '../../utils/dateUtils';

interface ProviderDashboardProps {
  provider: Provider;
  appointments: Appointment[];
  companies: Company[];
  onUpdateAppointmentStatus: (appointmentId: string, status: 'confirmed' | 'completed' | 'cancelled') => void;
  onUpdateAppointment?: (id: string, appointmentData: Partial<Appointment>) => void;
}

export default function ProviderDashboard({
  provider,
  appointments,
  companies,
  onUpdateAppointmentStatus,
  onUpdateAppointment
}: ProviderDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('today');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const employeeNameById = useMemo(() => {
    const map = new Map<string, { name: string; phone?: string | null }>();
    companies.forEach(company => {
      company.employees.forEach(employee => {
        map.set(employee.id, { name: employee.name, phone: employee.phone });
      });
    });
    return map;
  }, [companies]);

  // 🎯 FUNÇÃO CORRIGIDA: Filtrar agendamentos do prestador
  const getProviderAppointments = () => {
    return appointments.filter(apt => apt.providerId === provider.id);
  };

  // 🎯 FUNÇÃO CORRIGIDA: Obter agendamentos do dia selecionado
  const getTodayAppointments = () => {
    return getProviderAppointments().filter(apt => apt.date === selectedDate);
  };

  // 🎯 FUNÇÃO CORRIGIDA: Filtrar agendamentos por período
  const getFilteredAppointments = () => {
    let providerAppointments = getProviderAppointments();
    
    switch (viewMode) {
      case 'today':
        providerAppointments = providerAppointments.filter(apt => apt.date === selectedDate);
        break;
      case 'week':
        const { start: weekStart, end: weekEnd } = getWeekRange(selectedDate);
        providerAppointments = providerAppointments.filter(apt => 
          apt.date >= weekStart && apt.date <= weekEnd
        );
        break;
      case 'all':
      default:
        break;
    }

    if (employeeSearch.trim()) {
      const term = employeeSearch.trim().toLowerCase();
      providerAppointments = providerAppointments.filter(apt => {
        const matchedEmployee = employeeNameById.get(apt.employeeId ?? '');
        const fallbackName = apt.employeeName ?? '';
        return (matchedEmployee?.name ?? fallbackName).toLowerCase().includes(term);
      });
    }

    return providerAppointments.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const getEmployeeInfo = (companyId?: string, employeeId?: string) => {
    if (!companyId || !employeeId) return null;
    
    const company = companies.find(c => c.id === companyId);
    if (!company) return null;
    
    const employee = company.employees.find(emp => emp.id === employeeId);
    return employee ? { company, employee } : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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

  // 🎯 NOVA FUNÇÃO: Editar observações
  const handleEditNotes = (appointmentId: string, currentNotes: string) => {
    setEditingNotes(appointmentId);
    setNotesValue(currentNotes || '');
  };

  // 🎯 NOVA FUNÇÃO: Salvar observações
  const handleSaveNotes = (appointmentId: string) => {
    if (onUpdateAppointment) {
      onUpdateAppointment(appointmentId, { notes: notesValue });
    }
    setEditingNotes(null);
    setNotesValue('');
  };

  // 🎯 NOVA FUNÇÃO: Cancelar edição
  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNotesValue('');
  };
  // 🎯 DADOS CORRIGIDOS: Usar as funções corretas
  const filteredAppointments = getFilteredAppointments();
  const todayAppointments = getTodayAppointments();
  const allProviderAppointments = getProviderAppointments();

  // 🎯 ESTATÍSTICAS CORRIGIDAS: Calcular com base nos agendamentos de hoje
  const todayStats = {
    total: todayAppointments.length,
    confirmed: todayAppointments.filter(apt => apt.status === 'confirmed').length,
    pending: todayAppointments.filter(apt => apt.status === 'scheduled').length,
    completed: todayAppointments.filter(apt => apt.status === 'completed').length,
    cancelled: todayAppointments.filter(apt => apt.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
            <p className="text-gray-600">{provider.specialties.join(', ')}</p>
            <p className="text-sm text-gray-500 mt-1">
              Total de agendamentos: {allProviderAppointments.length}
            </p>
          </div>
        </div>
      </div>

      {/* 🎯 CARDS DE ESTATÍSTICAS CORRIGIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Hoje</p>
              <p className="text-xs text-gray-500">{formatDate(selectedDate)}</p>
              <p className="text-xl font-bold text-blue-600">{todayStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Confirmados</p>
              <p className="text-xl font-bold text-green-600">{todayStats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">{todayStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Concluídos</p>
              <p className="text-xl font-bold text-purple-600">{todayStats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Minha Agenda ({filteredAppointments.length} agendamentos)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="all">Todos</option>
              </select>
              <input
                type="text"
                placeholder="Buscar colaborador"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* 🎯 INFORMAÇÕES ADICIONAIS CORRIGIDAS */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 font-medium">📅 Período Selecionado</p>
              <p className="text-blue-600">
                {viewMode === 'today' ? `Hoje (${formatDate(selectedDate)})` : 
                 viewMode === 'week' ? `Semana de ${formatDate(selectedDate)}` : 
                 'Todos os Agendamentos'}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 font-medium">✅ Taxa de Confirmação</p>
              <p className="text-green-600">
                {todayStats.total > 0 ? 
                  Math.round((todayStats.confirmed / todayStats.total) * 100) : 0}%
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 font-medium">🎯 Taxa de Conclusão</p>
              <p className="text-purple-600">
                {todayStats.total > 0 ? 
                  Math.round((todayStats.completed / todayStats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const employeeInfo = getEmployeeInfo(appointment.companyId, appointment.employeeId);
              
              return (
                <div key={appointment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-lg">{appointment.service}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.startTime} - {appointment.endTime} ({appointment.duration}min)</span>
                          </div>
                        </div>
                        
                        {employeeInfo && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{employeeInfo.employee.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {employeeInfo.company.name} - {employeeInfo.employee.department}
                            </div>
                            {employeeInfo.employee.phone && (
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                <span>{employeeInfo.employee.phone}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {!employeeInfo && appointment.companyId && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span className="text-gray-500 italic">Vaga disponível</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {companies.find(c => c.id === appointment.companyId)?.name || 'Empresa não especificada'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 🎯 NOVA SEÇÃO: Campo de Observações Editável */}
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">📝 Observações:</span>
                          {editingNotes !== appointment.id && (
                            <button
                              onClick={() => handleEditNotes(appointment.id, appointment.notes || '')}
                              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                              title="Editar observações"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          )}
                        </div>
                        
                        {editingNotes === appointment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows={3}
                              placeholder="Adicione observações sobre o atendimento..."
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                              >
                                <X className="w-3 h-3" />
                                <span>Cancelar</span>
                              </button>
                              <button
                                onClick={() => handleSaveNotes(appointment.id)}
                                className="flex items-center space-x-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {appointment.notes ? (
                              <p className="whitespace-pre-wrap">{appointment.notes}</p>
                            ) : (
                              <p className="text-gray-400 italic">Nenhuma observação adicionada</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(appointment.id, 'confirmed')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Confirmar</span>
                        </button>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(appointment.id, 'completed')}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Concluir</span>
                        </button>
                      )}
                      
                      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(appointment.id, 'cancelled')}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredAppointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum agendamento encontrado para o período selecionado</p>
                <p className="text-sm text-gray-400 mt-2">
                  {employeeSearch.trim()
                    ? `Sem resultados para "${employeeSearch}"`
                    : viewMode === 'today'
                      ? 'Tente selecionar outra data'
                      : viewMode === 'week'
                        ? 'Tente selecionar outra semana'
                        : 'Você ainda não possui agendamentos'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
