import React, { useMemo, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit2, 
  Trash2,
  TrendingUp,
  QrCode,
  ExternalLink,
  Copy,
  X,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Appointment, Provider, Company } from '../../types';
import { formatDate, getCurrentDateString, isToday, getWeekRange, getMonthRange, addDays } from '../../utils/dateUtils';
import QRCode from 'qrcode';

interface AdminDashboardProps {
  appointments: Appointment[];
  providers: Provider[];
  companies: Company[];
  onUpdateAppointment: (id: string, appointmentData: Partial<Appointment>) => void;
  onDeleteAppointment: (id: string) => void;
  onDeleteMultipleAppointments: (appointmentIds: string[]) => void;
  onUpdateMultipleAppointments: (appointmentIds: string[], updateData: Partial<Appointment>) => void;
}

export default function AdminDashboard({
  appointments,
  providers,
  companies,
  onUpdateAppointment,
  onDeleteAppointment,
 onDeleteMultipleAppointments,
  onUpdateMultipleAppointments
}: AdminDashboardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showCompanyEditModal, setShowCompanyEditModal] = useState(false);
  const [editingCompanySchedule, setEditingCompanySchedule] = useState<{ company: Company; date: string; appointments: Appointment[] } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [selectedCompanyForQR, setSelectedCompanyForQR] = useState<Company | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Estados para troca de prestador em lote
  const [showProviderChangeModal, setShowProviderChangeModal] = useState(false);
  const [selectedScheduleForProviderChange, setSelectedScheduleForProviderChange] = useState<{
    companyId: string;
    date: string;
    currentProviderId: string;
    appointments: Appointment[];
  } | null>(null);
  const [newProviderId, setNewProviderId] = useState('');
  
  // Filtros
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((company) => {
      company.employees.forEach((employee) => {
        map.set(employee.id, employee.name);
      });
    });
    return map;
  }, [companies]);
  
  const [editData, setEditData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    service: '',
    notes: '',
    providerId: '',
    status: 'scheduled' as const
  });

  const [editScheduleData, setEditScheduleData] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  // 🎯 FUNÇÃO: Abrir modal de edição do agendamento da empresa
  const handleEditCompanySchedule = (companyId: string, date: string) => {
    const companyAppointments = appointments.filter(apt => 
      apt.companyId === companyId && apt.date === date
    );
    
    if (companyAppointments.length === 0) return;
    
    // Encontrar horários de início e fim
    const startTimes = companyAppointments.map(apt => apt.startTime).sort();
    const endTimes = companyAppointments.map(apt => apt.endTime).sort();
    
    setEditingCompanySchedule({ companyId, date });
    setEditScheduleData({
      date: date,
      startTime: startTimes[0],
      endTime: endTimes[endTimes.length - 1]
    });
    setShowEditScheduleModal(true);
  };

  // 🎯 FUNÇÃO: Confirmar edição do agendamento da empresa
  const handleConfirmEditSchedule = () => {
    if (!editingCompanySchedule) return;
    
    const { companyId, date: oldDate } = editingCompanySchedule;
    const { date: newDate, startTime: newStartTime, endTime: newEndTime } = editScheduleData;
    
    // Buscar todos os agendamentos da empresa na data original
    const companyAppointments = appointments.filter(apt => 
      apt.companyId === companyId && apt.date === oldDate
    );
    
    if (companyAppointments.length === 0) {
      alert('❌ Nenhum agendamento encontrado para editar.');
      return;
    }
    
    // Calcular nova duração total
    const oldStartMinutes = timeToMinutes(companyAppointments.map(apt => apt.startTime).sort()[0]);
    const oldEndMinutes = timeToMinutes(companyAppointments.map(apt => apt.endTime).sort().pop()!);
    const oldDuration = oldEndMinutes - oldStartMinutes;
    
    const newStartMinutes = timeToMinutes(newStartTime);
    const newEndMinutes = timeToMinutes(newEndTime);
    const newDuration = newEndMinutes - newStartMinutes;
    
    // Redistribuir agendamentos proporcionalmente
    const updatedAppointments = companyAppointments.map((apt, index) => {
      const oldRelativeStart = timeToMinutes(apt.startTime) - oldStartMinutes;
      const proportion = oldDuration > 0 ? oldRelativeStart / oldDuration : 0;
      
      const newRelativeStart = Math.round(proportion * newDuration);
      const newAppointmentStart = newStartMinutes + newRelativeStart;
      const newAppointmentEnd = newAppointmentStart + apt.duration;
      
      return {
        ...apt,
        date: newDate,
        startTime: minutesToTime(newAppointmentStart),
        endTime: minutesToTime(newAppointmentEnd)
      };
    });
    
    // Atualizar todos os agendamentos
    updatedAppointments.forEach(updatedApt => {
      onUpdateAppointment(updatedApt.id, {
        date: updatedApt.date,
        startTime: updatedApt.startTime,
        endTime: updatedApt.endTime
      });
    });
    
    setShowEditScheduleModal(false);
    setEditingCompanySchedule(null);
    
  // 🎯 NOVA FUNÇÃO: Editar agendamento completo da empresa
  const handleEditCompanySchedule = (company: Company, date: string, companyAppointments: Appointment[]) => {
    setEditingCompanySchedule({ company, date, appointments: companyAppointments });
    setShowCompanyEditModal(true);
  };

  // 🎯 NOVA FUNÇÃO: Confirmar edição do agendamento da empresa
  const handleConfirmCompanyEdit = () => {
    if (!editingCompanySchedule) return;

    const { company, appointments: oldAppointments } = editingCompanySchedule;
    
    // Aqui você implementaria a lógica de atualização em lote
    // Por exemplo, mover todos os agendamentos para nova data/horários
    
    alert(`✅ Agendamento da empresa ${company.name} será editado!\n\n📊 Resumo:\n• ${oldAppointments.length} agendamentos serão atualizados\n• Nova configuração será aplicada\n\n🔄 Funcionalidade em desenvolvimento...`);
    
    setShowCompanyEditModal(false);
    setEditingCompanySchedule(null);
  };

    alert(`✅ Agendamento da empresa atualizado!\n\n📊 Resumo:\n• ${updatedAppointments.length} agendamentos movidos\n• Nova data: ${formatDate(newDate)}\n• Novo período: ${newStartTime} - ${newEndTime}`);
  };

  // Função auxiliar para converter tempo em minutos
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Função auxiliar para converter minutos em tempo
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Função para navegar nas datas
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    let newDate: Date;
    
    switch (filterPeriod) {
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      default:
        newDate = currentDate;
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Função para obter período formatado
  const getFormattedPeriod = () => {
    const date = new Date(selectedDate);
    
    switch (filterPeriod) {
      case 'day':
        return formatDate(selectedDate, { 
          weekday: 'long', 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'week':
        const { start, end } = getWeekRange(selectedDate);
        return `${formatDate(start, { day: '2-digit', month: '2-digit' })} a ${formatDate(end, { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      case 'month':
        return formatDate(selectedDate, { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  };

  // Função para filtrar agendamentos por período
  const getFilteredAppointments = () => {
    let filtered = appointments;
    
    // Filtrar por período
    switch (filterPeriod) {
      case 'day':
        filtered = filtered.filter(apt => apt.date === selectedDate);
        break;
      case 'week':
        const { start: weekStart, end: weekEnd } = getWeekRange(selectedDate);
        filtered = filtered.filter(apt => apt.date >= weekStart && apt.date <= weekEnd);
        break;
      case 'month':
        const { start: monthStart, end: monthEnd } = getMonthRange(selectedDate);
        filtered = filtered.filter(apt => apt.date >= monthStart && apt.date <= monthEnd);
        break;
    }
    
    // Filtrar por empresa se selecionada
    if (selectedCompany) {
      filtered = filtered.filter(apt => apt.companyId === selectedCompany);
    }

    if (employeeSearch.trim()) {
      const term = employeeSearch.trim().toLowerCase();
      filtered = filtered.filter(apt => {
        const employeeName =
          employeeNameById.get(apt.employeeId ?? '') ??
          apt.employeeName ??
          '';
        return employeeName.toLowerCase().includes(term);
      });
    }
    
    return filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  };

  // Agrupar agendamentos por empresa
  const getGroupedAppointments = () => {
    const filtered = getFilteredAppointments();
    const grouped = new Map();
    
    filtered.forEach(apt => {
      if (!apt.companyId) return;
      
      const key = `${apt.companyId}-${apt.date}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          companyId: apt.companyId,
          date: apt.date,
          appointments: []
        });
      }
      grouped.get(key).appointments.push(apt);
    });
    
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.companyId.localeCompare(b.companyId);
    });
  };

  // Função para gerar link público
  const getPublicBookingLink = (companyId: string) => {
    const token = btoa(companyId);
    const baseUrl = window.location.protocol === 'https:' 
      ? window.location.origin 
      : 'https://' + window.location.host;
    return `${baseUrl}/agendamento/${token}`;
  };

  // Função para gerar QR Code
  const generateQRCode = async (company: Company) => {
    try {
      const link = getPublicBookingLink(company.id);
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
      setSelectedCompanyForQR(company);
      setShowQRModal(true);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert('❌ Erro ao gerar QR Code. Tente novamente.');
    }
  };

  // Função para copiar link
  const copyLinkToClipboard = async (companyId: string) => {
    try {
      const link = getPublicBookingLink(companyId);
      await navigator.clipboard.writeText(link);
      alert('✅ Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('❌ Erro ao copiar link. Tente novamente.');
    }
  };

  // Função para abrir link em nova aba
  const openPublicLink = (companyId: string) => {
    const link = getPublicBookingLink(companyId);
    window.open(link, '_blank');
  };

  // Função para excluir todos os agendamentos de uma empresa em uma data
  const handleDeleteCompanySchedule = (companyId: string, date: string) => {
    const company = companies.find(c => c.id === companyId);
    const companyAppointments = appointments.filter(apt => 
      apt.companyId === companyId && apt.date === date
    );

    if (companyAppointments.length === 0) {
      alert('❌ Nenhum agendamento encontrado para excluir.');
      return;
    }

    const confirmMessage = `❓ Tem certeza que deseja excluir TODOS os agendamentos?\n\n` +
      `🏢 Empresa: ${company?.name}\n` +
      `📅 Data: ${formatDate(date)}\n` +
      `📋 Total: ${companyAppointments.length} agendamento(s)\n\n` +
      `⚠️ Esta ação não pode ser desfeita!`;

    if (confirm(confirmMessage)) {
      // 🎯 CORREÇÃO: Excluir todos de uma vez usando função específica
      try {
        const appointmentIds = companyAppointments.map(apt => apt.id);
        
        // 🎯 USAR FUNÇÃO DE EXCLUSÃO EM LOTE
        onDeleteMultipleAppointments(appointmentIds);

        alert(`✅ Agendamentos excluídos com sucesso!\n\n` +
          `📊 Resumo da exclusão:\n` +
          `• ${companyAppointments.length} agendamento(s) removido(s)\n` +
          `• Empresa: ${company?.name}\n` +
          `• Data: ${formatDate(date)}\n` +
          `• Horários removidos: ${companyAppointments.map(apt => apt.startTime).sort().join(', ')}`);
      } catch (error) {
        console.error('❌ Erro ao excluir agendamentos:', error);
        alert('❌ Erro ao excluir agendamentos. Tente novamente.');
      }
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditData({
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      service: appointment.service,
      notes: appointment.notes || '',
      providerId: appointment.providerId,
      status: appointment.status
    });
    setShowEditModal(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const handleConfirmEdit = () => {
    if (!editingAppointment) return;

    // Validar horários
    if (editData.startTime >= editData.endTime) {
      alert('❌ O horário de início deve ser anterior ao horário de fim!');
      return;
    }

    // Calcular duração baseada nos horários
    const startMinutes = timeToMinutes(editData.startTime);
    const endMinutes = timeToMinutes(editData.endTime);
    const duration = endMinutes - startMinutes;

    if (duration <= 0) {
      alert('❌ A duração deve ser maior que zero!');
      return;
    }

    if (duration > 480) { // 8 horas
      alert('❌ A duração não pode ser maior que 8 horas!');
      return;
    }
    
    onUpdateAppointment(editingAppointment.id, {
      date: editData.date,
      startTime: editData.startTime,
      endTime: editData.endTime,
      duration: duration,
      service: editData.service,
      notes: editData.notes,
      providerId: editData.providerId,
      status: editData.status
    });
    
    setShowEditModal(false);
    setEditingAppointment(null);
    alert('✅ Agendamento atualizado com sucesso!');
  };

  const handleConfirmDelete = () => {
    if (!appointmentToDelete) return;

    onDeleteAppointment(appointmentToDelete.id);
    setShowDeleteModal(false);
    setAppointmentToDelete(null);
    alert('✅ Agendamento excluído com sucesso!');
  };

  // 🎯 NOVA FUNÇÃO: Abrir modal de troca de prestador
  const handleOpenProviderChange = (schedule: any) => {
    // Obter todos os prestadores únicos nos agendamentos
    const uniqueProviders = [...new Set(schedule.appointments.map((apt: Appointment) => apt.providerId))];
    
    if (uniqueProviders.length === 1) {
      // Apenas um prestador - troca direta
      setSelectedScheduleForProviderChange({
        companyId: schedule.companyId,
        date: schedule.date,
        currentProviderId: uniqueProviders[0],
        appointments: schedule.appointments
      });
      setNewProviderId('');
      setShowProviderChangeModal(true);
    } else {
      // Múltiplos prestadores - mostrar seleção
      const providerCounts = new Map();
      schedule.appointments.forEach((apt: Appointment) => {
        providerCounts.set(apt.providerId, (providerCounts.get(apt.providerId) || 0) + 1);
      });
      
      const providerOptions = Array.from(providerCounts.entries())
        .map(([providerId, count]) => {
          const provider = providers.find(p => p.id === providerId);
          return `${provider?.name} (${count} agendamentos)`;
        })
        .join('\n');
      
      const selectedIndex = parseInt(prompt(
        `🔄 Múltiplos prestadores encontrados!\n\n` +
        `Selecione qual prestador deseja substituir:\n\n` +
        uniqueProviders.map((providerId, index) => {
          const provider = providers.find(p => p.id === providerId);
          const count = providerCounts.get(providerId);
          return `${index + 1}. ${provider?.name} (${count} agendamentos)`;
        }).join('\n') +
        `\n\nDigite o número (1-${uniqueProviders.length}):`
      ) || '0');
      
      if (selectedIndex > 0 && selectedIndex <= uniqueProviders.length) {
        const selectedProviderId = uniqueProviders[selectedIndex - 1];
        setSelectedScheduleForProviderChange({
          companyId: schedule.companyId,
          date: schedule.date,
          currentProviderId: selectedProviderId,
          appointments: schedule.appointments
        });
        setNewProviderId('');
        setShowProviderChangeModal(true);
      }
    }
  };

  // 🎯 NOVA FUNÇÃO: Confirmar troca de prestador em lote
  const handleConfirmProviderChange = () => {
    if (!selectedScheduleForProviderChange || !newProviderId) {
      alert('❌ Selecione um novo prestador');
      return;
    }

    const { appointments: scheduleAppointments, currentProviderId } = selectedScheduleForProviderChange;
    const oldProvider = providers.find(p => p.id === currentProviderId);
    const newProvider = providers.find(p => p.id === newProviderId);
    const company = companies.find(c => c.id === selectedScheduleForProviderChange.companyId);

    // CORRIGIDO: Filtrar TODOS os agendamentos do prestador atual no card
    const appointmentsToUpdate = scheduleAppointments.filter(apt => 
      apt.providerId === currentProviderId &&
      apt.companyId === selectedScheduleForProviderChange.companyId &&
      apt.date === selectedScheduleForProviderChange.date
    );

    if (appointmentsToUpdate.length === 0) {
      alert('❌ Nenhum agendamento encontrado para o prestador selecionado');
      return;
    }

    const confirmMessage = `🔄 Confirmar troca de prestador?\n\n` +
      `🏢 Empresa: ${company?.name}\n` +
      `📅 Data: ${formatDate(selectedScheduleForProviderChange.date)}\n` +
      `👨‍⚕️ De: ${oldProvider?.name}\n` +
      `👨‍⚕️ Para: ${newProvider?.name}\n` +
      `📋 Agendamentos afetados: ${appointmentsToUpdate.length}\n\n` +
      `⚠️ TODOS os horários do prestador atual serão transferidos para o novo prestador.\n` +
      `🕐 Horários: ${appointmentsToUpdate.map(apt => apt.startTime).sort().join(', ')}`;

    if (confirm(confirmMessage)) {
      // 🎯 CORRIGIDO: Atualizar TODOS os agendamentos de uma vez
      const appointmentIds = appointmentsToUpdate.map(apt => apt.id);
      const updateData = {
        providerId: newProviderId,
        notes: `[Prestador alterado de ${oldProvider?.name} para ${newProvider?.name} em ${new Date().toLocaleString('pt-BR')}]`
      };
      
      onUpdateMultipleAppointments(appointmentIds, updateData);

      alert(`✅ Prestador alterado com sucesso!\n\n` +
        `📊 Resumo da alteração:\n` +
        `• ${appointmentsToUpdate.length} agendamento(s) transferido(s)\n` +
        `• De: ${oldProvider?.name}\n` +
        `• Para: ${newProvider?.name}\n` +
        `• Empresa: ${company?.name}\n` +
        `• Data: ${formatDate(selectedScheduleForProviderChange.date)}\n` +
        `• Horários alterados: ${appointmentsToUpdate.map(apt => apt.startTime).sort().join(', ')}`);

      setShowProviderChangeModal(false);
      setSelectedScheduleForProviderChange(null);
      setNewProviderId('');
      
      // 🎯 FORÇAR ATUALIZAÇÃO DA INTERFACE
      // O React irá re-renderizar automaticamente porque os appointments foram atualizados
      // através do onUpdateAppointment que atualiza o estado no componente pai
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Função para calcular duração entre dois horários
  const calculateDuration = (startTime: string, endTime: string): number => {
    return timeToMinutes(endTime) - timeToMinutes(startTime);
  };

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

  // Estatísticas do período filtrado
  const filteredAppointments = getFilteredAppointments();
  const totalAppointments = filteredAppointments.length;
  const confirmedAppointments = filteredAppointments.filter(apt => apt.status === 'confirmed').length;
  const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed').length;
  const cancelledAppointments = filteredAppointments.filter(apt => apt.status === 'cancelled').length;

  const groupedAppointments = getGroupedAppointments();

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Agendamentos</h1>
            <p className="text-gray-600 mt-1">Gerencie agendamentos por empresa e período</p>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* Filtro de Período */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="day">Por Dia</option>
                <option value="week">Por Semana</option>
                <option value="month">Por Mês</option>
              </select>
            </div>

            {/* Navegação de Data */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="text-center min-w-[200px]">
                <div className="text-sm font-medium text-gray-900">
                  {getFormattedPeriod()}
                </div>
                <div className="text-xs text-gray-500">
                  {filterPeriod === 'day' ? 'Dia' : filterPeriod === 'week' ? 'Semana' : 'Mês'}
                </div>
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filtro de Empresa */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todas as Empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Buscar colaborador"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-48"
            />

            {/* Botão Hoje */}
            <button
              onClick={() => setSelectedDate(getCurrentDateString())}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Hoje
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas do Período */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-gray-900">{confirmedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{completedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelados</p>
              <p className="text-2xl font-bold text-gray-900">{cancelledAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Empresas Simplificada */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Agendamentos por Empresa ({groupedAppointments.length})
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {selectedCompany ? 
              `Mostrando apenas: ${companies.find(c => c.id === selectedCompany)?.name}` :
              'Todas as empresas com agendamentos no período'
            }
          </p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groupedAppointments.map((schedule) => {
            const company = companies.find(c => c.id === schedule.companyId);
            if (!company) return null;

            const totalDuration = schedule.appointments.reduce((sum, apt) => sum + apt.duration, 0);
            const statusCounts = {
              confirmed: schedule.appointments.filter(apt => apt.status === 'confirmed').length,
              completed: schedule.appointments.filter(apt => apt.status === 'completed').length,
              cancelled: schedule.appointments.filter(apt => apt.status === 'cancelled').length,
              scheduled: schedule.appointments.filter(apt => apt.status === 'scheduled').length
            };

            return (
              <div key={`${schedule.companyId}-${schedule.date}`} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                {/* Header da Empresa */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{company.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span>📅 {formatDate(schedule.date)}</span>
                        <span>📋 {schedule.appointments.length} agendamentos</span>
                        <span>⏱️ {Math.round(totalDuration / 60 * 10) / 10}h total</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações da Empresa */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenProviderChange(schedule)}
                      className="p-1 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Trocar Prestador em Lote"
                    >
                      <Users className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => copyLinkToClipboard(company.id)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Copiar Link Público"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => generateQRCode(company)}
                      className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      title="Gerar QR Code"
                    >
                      <QrCode className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openPublicLink(company.id)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Abrir Link Público"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompanySchedule(company.id, schedule.date)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Excluir Todos os Agendamentos"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-sm font-bold text-green-600">{statusCounts.confirmed}</div>
                    <div className="text-xs text-green-700">Confirmados</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-sm font-bold text-blue-600">{statusCounts.completed}</div>
                    <div className="text-xs text-blue-700">Concluídos</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded text-center">
                    <div className="text-sm font-bold text-yellow-600">{statusCounts.scheduled}</div>
                    <div className="text-xs text-yellow-700">Agendados</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="text-sm font-bold text-red-600">{statusCounts.cancelled}</div>
                    <div className="text-xs text-red-700">Cancelados</div>
                  </div>
                </div>

                {/* Lista de Agendamentos */}
                <div className="flex space-x-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  {schedule.appointments.map((appointment) => {
                    const provider = providers.find(p => p.id === appointment.providerId);
                    const employee = company.employees.find(emp => emp.id === appointment.employeeId);
                    
                    return (
                      <div key={appointment.id} className="flex-shrink-0 w-48 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-gray-900">
                            {appointment.startTime}
                          </div>
                            <span className={`px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-900 font-medium truncate">
                            {appointment.service}
                          </div>
                          
                          <div className="text-xs text-gray-600 truncate">
                            👨‍⚕️ {provider?.name || 'N/A'}
                          </div>
                          
                          <div className="text-xs text-gray-600 truncate">
                            👤 {employee ? employee.name : 'Vaga disponível'}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            ⏱️ {appointment.duration}min
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(appointment)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
          
          {groupedAppointments.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-gray-600">
                {employeeSearch.trim()
                  ? `Nenhum colaborador encontrado para "${employeeSearch}" no período selecionado`
                  : selectedCompany
                    ? 'A empresa selecionada não possui agendamentos no período'
                    : 'Não há agendamentos no período selecionado'
                }
              </p>
              <button
                onClick={() => {
                  setSelectedCompany('');
                  setSelectedDate(getCurrentDateString());
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Ver Todos os Agendamentos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editar Agendamento</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário Início</label>
                  <input
                    type="time"
                    value={editData.startTime}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário Fim</label>
                  <input
                    type="time"
                    value={editData.endTime}
                    onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                    {editData.startTime && editData.endTime && editData.startTime < editData.endTime
                      ? `${calculateDuration(editData.startTime, editData.endTime)} minutos`
                      : 'Defina os horários'
                    }
                  </div>
                </div>
              </div>
              
              {/* Validação Visual */}
              {editData.startTime && editData.endTime && (
                <div className={`p-3 rounded-lg border ${
                  editData.startTime < editData.endTime
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-sm ${
                    editData.startTime < editData.endTime
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}>
                    {editData.startTime < editData.endTime ? (
                      <>
                        ✅ <strong>Horários válidos:</strong> {editData.startTime} às {editData.endTime}
                        <br />
                        ⏱️ <strong>Duração:</strong> {calculateDuration(editData.startTime, editData.endTime)} minutos
                      </>
                    ) : (
                      <>
                        ❌ <strong>Erro:</strong> Horário de início deve ser anterior ao horário de fim
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serviço</label>
                  <select
                    value={editData.service}
                    onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Quick Massage">Quick Massage</option>
                    <option value="Massagem Relaxante">Massagem Relaxante</option>
                    <option value="Massagem Desportiva">Massagem Desportiva</option>
                    <option value="Massagem Terapêutica">Massagem Terapêutica</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prestador</label>
                <select
                  value={editData.providerId}
                  onChange={(e) => setEditData({ ...editData, providerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} - {provider.specialties.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Observações sobre o agendamento..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
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
                <div className="text-sm space-y-1">
                  <div><strong>Serviço:</strong> {appointmentToDelete.service}</div>
                  <div><strong>Data:</strong> {formatDate(appointmentToDelete.date)}</div>
                  <div><strong>Horário:</strong> {appointmentToDelete.startTime} - {appointmentToDelete.endTime}</div>
                  <div><strong>Status:</strong> {getStatusLabel(appointmentToDelete.status)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Excluir Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedCompanyForQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  QR Code - {selectedCompanyForQR.name}
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 text-center">
              {qrCodeDataUrl && (
                <div className="mb-4">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-64 h-64 mx-auto border border-gray-200 rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Escaneie este QR Code para acessar o link de agendamento
                </p>
                <p className="text-xs text-gray-500 font-mono break-all bg-gray-50 p-2 rounded">
                  {selectedCompanyForQR && getPublicBookingLink(selectedCompanyForQR.id)}
                </p>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `qrcode-${selectedCompanyForQR.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
                      link.href = qrCodeDataUrl;
                      link.click();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Baixar QR Code
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Change Modal */}
      {showProviderChangeModal && selectedScheduleForProviderChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Trocar Prestador em Lote</h3>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h4 className="font-medium text-orange-900">Alteração em Lote</h4>
                  </div>
                  <p className="text-sm text-orange-800">
                    Esta ação irá trocar APENAS os agendamentos do prestador selecionado.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">📋 Detalhes:</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><strong>Empresa:</strong> {companies.find(c => c.id === selectedScheduleForProviderChange.companyId)?.name}</div>
                    <div><strong>Data:</strong> {formatDate(selectedScheduleForProviderChange.date)}</div>
                    <div><strong>Prestador Atual:</strong> {providers.find(p => p.id === selectedScheduleForProviderChange.currentProviderId)?.name}</div>
                    <div><strong>Agendamentos a trocar:</strong> {selectedScheduleForProviderChange.appointments.filter(apt => apt.providerId === selectedScheduleForProviderChange.currentProviderId).length}</div>
                    <div><strong>Total na empresa/data:</strong> {selectedScheduleForProviderChange.appointments.length}</div>
                  </div>
                </div>
                
                {/* Mostrar horários que serão afetados */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">🕐 Horários que serão alterados:</h4>
                  <div className="text-sm text-blue-800">
                    {selectedScheduleForProviderChange.appointments
                      .filter(apt => apt.providerId === selectedScheduleForProviderChange.currentProviderId)
                      .map(apt => apt.startTime)
                      .sort()
                      .join(', ')}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Prestador *
                  </label>
                  <select
                    value={newProviderId}
                    onChange={(e) => setNewProviderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Selecione o novo prestador</option>
                    {providers
                      .filter(p => p.id !== selectedScheduleForProviderChange.currentProviderId)
                      .map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name} - {provider.specialties.join(', ')}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowProviderChangeModal(false);
                  setSelectedScheduleForProviderChange(null);
                  setNewProviderId('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmProviderChange}
                className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors"
              >
                Trocar Prestador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição do Agendamento da Empresa */}
      {showCompanyEditModal && editingCompanySchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Agendamento da Empresa
              </h3>
              <button
                onClick={() => setShowCompanyEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📋 Agendamento Atual:</h4>
                <div className="text-blue-800 text-sm space-y-1">
                  <div>🏢 <strong>Empresa:</strong> {editingCompanySchedule.company.name}</div>
                  <div>📅 <strong>Data:</strong> {formatDate(editingCompanySchedule.date)}</div>
                  <div>📊 <strong>Agendamentos:</strong> {editingCompanySchedule.appointments.length}</div>
                  <div>🕐 <strong>Período:</strong> {
                    editingCompanySchedule.appointments.length > 0 
                      ? `${editingCompanySchedule.appointments[0].startTime} - ${editingCompanySchedule.appointments[editingCompanySchedule.appointments.length - 1].endTime}`
                      : 'N/A'
                  }</div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800 text-sm">
                    <strong>🔄 Funcionalidade em Desenvolvimento</strong>
                  </p>
                </div>
                <p className="text-yellow-700 text-xs mt-2">
                  A edição em lote de agendamentos da empresa será implementada em breve. 
                  Esta funcionalidade permitirá alterar data e horários de todos os agendamentos de uma vez.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCompanyEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleConfirmCompanyEdit}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                >
                  Confirmar Edição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
