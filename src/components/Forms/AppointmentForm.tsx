import React, { useState } from 'react';
import { X, Calendar, Clock, User, Building2 } from 'lucide-react';
import { Appointment, Provider, Company } from '../../types';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  initialData?: Partial<Appointment>;
  providers: Provider[];
  companies: Company[];
  selectedDate?: Date;
  selectedTime?: string;
}

export default function AppointmentForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  providers,
  companies,
  selectedDate,
  selectedTime
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || '',
    providerId: initialData?.providerId || '',
    companyId: initialData?.companyId || '',
    employeeId: initialData?.employeeId || '',
    date: initialData?.date || selectedDate?.toISOString().split('T')[0] || '',
    startTime: initialData?.startTime || selectedTime || '',
    duration: initialData?.duration || 60,
    service: initialData?.service || '',
    status: initialData?.status || 'scheduled' as const,
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const endTime = calculateEndTime(formData.startTime, formData.duration);
    
    onSubmit({
      ...formData,
      endTime
    });
    
    onClose();
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const selectedCompany = companies.find(c => c.id === formData.companyId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData?.id ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Prestador
            </label>
            <select
              value={formData.providerId}
              onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione um prestador</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - {provider.specialties.join(', ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Empresa (Opcional)
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value, employeeId: '' })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Atendimento individual</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colaborador
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um colaborador</option>
                {selectedCompany.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serviço
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione o serviço</option>
                <option value="Massagem Relaxante">Massagem Relaxante</option>
                <option value="Massagem Desportiva">Massagem Desportiva</option>
                <option value="Quick Massage">Quick Massage</option>
                <option value="Massagem Terapêutica">Massagem Terapêutica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duração (min)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={12}>12 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={17}>17 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {initialData?.id ? 'Atualizar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}