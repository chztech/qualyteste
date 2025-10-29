import React, { useState } from 'react';
import { X, Calendar, Clock, Building2, Users, ChevronRight, Play, Armchair } from 'lucide-react';
import { Company, Provider, Service } from '../../types';

interface AdminCompanySchedulingProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scheduleData: any) => Promise<any>;
  companies: Company[];
  providers: Provider[];
  services: Service[];
  availableTimeSlots: string[];
}

export default function AdminCompanyScheduling({
  isOpen,
  onClose,
  onSubmit,
  companies,
  providers,
  services,
  availableTimeSlots,
}: AdminCompanySchedulingProps) {
  const [formData, setFormData] = useState({
    companyId: '',
    date: '',
    startTime: '08:00',
    endTime: '18:00',
    chairs: 2,
    duration: 15,
    service: 'Quick Massage',
    breaks: [] as Array<{
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      type: 'lunch' | 'coffee' | 'meeting' | 'rest' | 'custom';
    }>,
    selectedProviders: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateSlots = () => {
    const slots = [];
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += formData.duration) {
      const slotTime = minutesToTime(minutes);
      const slotEndMinutes = minutes + formData.duration;

      let hasConflict = false;
      for (const breakItem of formData.breaks) {
        const breakStartMinutes = timeToMinutes(breakItem.startTime);
        const breakEndMinutes = timeToMinutes(breakItem.endTime);

        if (!(minutes >= breakEndMinutes || slotEndMinutes <= breakStartMinutes)) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) continue;
      if (slotEndMinutes > endMinutes) continue;

      slots.push({
        time: slotTime,
        endTime: minutesToTime(slotEndMinutes),
        duration: formData.duration,
        service: formData.service,
      });
    }

    return slots;
  };

  const addBreak = (type: 'lunch' | 'coffee' | 'meeting' | 'rest' | 'custom') => {
    const breakDefaults = {
      lunch: { name: 'Almoço', startTime: '12:00', endTime: '13:00' },
      coffee: { name: 'Lanche', startTime: '15:00', endTime: '15:15' },
      meeting: { name: 'Reunião', startTime: '14:00', endTime: '14:30' },
      rest: { name: 'Descanso', startTime: '10:00', endTime: '10:15' },
      custom: { name: 'Pausa Personalizada', startTime: '16:00', endTime: '16:30' },
    };

    const newBreak = {
      id: Date.now().toString(),
      type,
      ...breakDefaults[type],
    };

    setFormData((prev) => ({
      ...prev,
      breaks: [...prev.breaks, newBreak],
    }));
  };

  const removeBreak = (breakId: string) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((b) => b.id !== breakId),
    }));
  };

  const updateBreak = (breakId: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.map((b) => (b.id === breakId ? { ...b, [field]: value } : b)),
    }));
  };

  const getBreakIcon = (type: string) => {
    switch (type) {
      case 'lunch': return '🍽️';
      case 'coffee': return '☕';
      case 'meeting': return '📋';
      case 'rest': return '💤';
      default: return '⏸️';
    }
  };

  const getBreakColor = (type: string) => {
    switch (type) {
      case 'lunch': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'coffee': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'meeting': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'rest': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleProviderToggle = (providerId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProviders: prev.selectedProviders.includes(providerId)
        ? prev.selectedProviders.filter((id) => id !== providerId)
        : [...prev.selectedProviders, providerId],
    }));
  };

  const getShiftFromTime = (time: string): string => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'morning';
    else if (hour >= 12 && hour < 18) return 'afternoon';
    else return 'evening';
  };

  // 🔧 FUNÇÃO CORRIGIDA COMPLETA - LINHA 173
  const handleSubmit = async () => {
    if (!formData.companyId || !formData.date || formData.selectedProviders.length === 0) {
      alert('Preencha empresa, data e selecione pelo menos um prestador');
      return;
    }

    setIsSubmitting(true);

    try {
      const slots = generateSlots();
      console.log('🔍 Slots gerados:', slots);

      if (slots.length === 0) {
        alert('Nenhum horário foi gerado. Verifique o período e as pausas configuradas.');
        setIsSubmitting(false);
        return;
      }

      const allAppointments: any[] = [];
      slots.forEach((slot, slotIndex) => {
        for (let chair = 1; chair <= formData.chairs; chair++) {
          const providerIndex = ((slotIndex * formData.chairs) + (chair - 1)) % formData.selectedProviders.length;
          const assignedProvider = formData.selectedProviders[providerIndex];

          allAppointments.push({
            companyId: formData.companyId,
            providerId: assignedProvider,
            serviceId: services.find(s => s.name === formData.service)?.id || services[0]?.id,
            date: formData.date,
            startTime: slot.time,
            endTime: slot.endTime,
            duration: slot.duration,
            status: 'scheduled',
            notes: `Cadeira ${chair} - ${getShiftFromTime(slot.time)}`,
          });
        }
      });

      console.log('🔍 Total de agendamentos a criar:', allAppointments.length);
      setProgress({ current: 0, total: allAppointments.length });

      // 🔧 CORREÇÃO DEFINITIVA APLICADA AQUI - LINHA 217
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < allAppointments.length; i++) {
        const appointment = allAppointments[i];
        
        try {
          // ✅ PEGA O RETORNO DO onSubmit
          const result = await onSubmit(appointment);
          
          // ✅ VERIFICA SE FOI SUCESSO
          if (result && result.success) {
            successCount++;
            console.log(`✅ Agendamento ${i + 1}/${allAppointments.length} criado com sucesso`);
          } else {
            errorCount++;
            console.error(`❌ Agendamento ${i + 1} falhou:`, result?.error || 'Erro desconhecido');
          }
          
          // Atualizar progresso visual
          setProgress({ current: i + 1, total: allAppointments.length });
          
        } catch (error: any) {
          console.error(`❌ Exceção ao criar agendamento ${i + 1}:`, error);
          errorCount++;
        }
      }

      // Feedback final
      if (errorCount === 0) {
        alert(
          `✅ Sucesso! ${successCount} agendamentos criados!\n\n` +
          `📋 Resumo:\n` +
          `• ${slots.length} horários\n` +
          `• ${formData.chairs} cadeiras por horário\n` +
          `• ${allAppointments.length} slots totais\n` +
          `• ${formData.selectedProviders.length} prestadores\n`
        );
        handleClose();
      } else {
        alert(
          `⚠️ Processo concluído:\n\n` +
          `✅ ${successCount} criados\n` +
          `❌ ${errorCount} falharam\n\n` +
          `Verifique o console.`
        );
      }

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleClose = () => {
    setFormData({
      companyId: '',
      date: '',
      startTime: '08:00',
      endTime: '18:00',
      chairs: 2,
      duration: 15,
      service: 'Quick Massage',
      breaks: [],
      selectedProviders: [],
    });
    onClose();
  };

  const slots = generateSlots();
  const totalAppointments = slots.length * formData.chairs;
  const selectedCompany = companies.find((c) => c.id === formData.companyId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Agendamento Rápido</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isSubmitting && progress.total > 0 && (
          <div className="px-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Criando... {progress.current} de {progress.total}
                </span>
                <span className="text-sm font-medium text-blue-900">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Empresa</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.employees.length} colaboradores)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Início</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {availableTimeSlots.filter((time) => time < '12:00').map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fim</label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {availableTimeSlots.filter((time) => time > formData.startTime).map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-900 mb-4">Configuração Rápida</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cadeiras</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, chairs: num })}
                        className={`p-2 rounded border-2 text-center transition-colors ${
                          formData.chairs === num
                            ? 'border-purple-500 bg-purple-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Armchair className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs font-medium">{num}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 20, 30, 60].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration })}
                        className={`p-2 rounded border-2 text-center transition-colors ${
                          formData.duration === duration
                            ? 'border-purple-500 bg-purple-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Clock className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs font-medium">{duration}min</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serviço</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-orange-900">Pausas ({formData.breaks.length})</h3>
                  <div className="flex space-x-1">
                    <button type="button" onClick={() => addBreak('lunch')} className="px-2 py-1 bg-orange-600 text-white text-xs rounded">🍽️</button>
                    <button type="button" onClick={() => addBreak('coffee')} className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">☕</button>
                    <button type="button" onClick={() => addBreak('meeting')} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">📋</button>
                    <button type="button" onClick={() => addBreak('rest')} className="px-2 py-1 bg-purple-600 text-white text-xs rounded">💤</button>
                  </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {formData.breaks.map((breakItem) => (
                    <div key={breakItem.id} className={`p-3 rounded-lg border ${getBreakColor(breakItem.type)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getBreakIcon(breakItem.type)}</span>
                          <input
                            type="text"
                            value={breakItem.name}
                            onChange={(e) => updateBreak(breakItem.id, 'name', e.target.value)}
                            className="font-medium bg-transparent border-none p-0 focus:outline-none text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBreak(breakItem.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ❌
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">Início</label>
                          <select
                            value={breakItem.startTime}
                            onChange={(e) => updateBreak(breakItem.id, 'startTime', e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded text-xs"
                          >
                            {availableTimeSlots.filter((time) => time >= formData.startTime && time <= formData.endTime).map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Fim</label>
                          <select
                            value={breakItem.endTime}
                            onChange={(e) => updateBreak(breakItem.id, 'endTime', e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded text-xs"
                          >
                            {availableTimeSlots.filter((time) => time > breakItem.startTime && time <= formData.endTime).map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.breaks.length === 0 && (
                    <div className="text-center py-4 text-orange-700">
                      <p className="text-sm">Nenhuma pausa adicionada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Prestadores ({formData.selectedProviders.length} selecionados)
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {providers.map((provider) => (
                    <label
                      key={provider.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.selectedProviders.includes(provider.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedProviders.includes(provider.id)}
                        onChange={() => handleProviderToggle(provider.id)}
                        className="w-4 h-4 text-green-600"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{provider.name}</p>
                          <p className="text-xs text-gray-600">{provider.specialties?.slice(0, 2).join(', ')}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-4">Preview</h3>
                {formData.companyId && formData.date && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-2 rounded border">
                        <p className="text-blue-600 font-medium">Empresa</p>
                        <p className="text-blue-900">{selectedCompany?.name}</p>
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <p className="text-blue-600 font-medium">Data</p>
                        <p className="text-blue-900">{new Date(formData.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    <div className="bg-green-100 p-3 rounded border border-green-300">
                      <h4 className="font-medium text-green-900 mb-2">Estatísticas</h4>
                      <div className="text-green-800 text-sm space-y-1">
                        <div><strong>{slots.length}</strong> horários</div>
                        <div><strong>{formData.chairs}</strong> cadeira{formData.chairs !== 1 && 's'}</div>
                        <div><strong>{totalAppointments}</strong> agendamentos totais</div>
                        <div><strong>{formData.selectedProviders.length}</strong> prestador{formData.selectedProviders.length !== 1 && 'es'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {totalAppointments > 0 && <span>{totalAppointments} agendamentos serão criados</span>}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.companyId || !formData.date || formData.selectedProviders.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Criar Agendamentos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
