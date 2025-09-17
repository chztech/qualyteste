import React from 'react';
import { Appointment, Company } from '../../types';
import { formatDate, formatDateWithWeekday, isToday, dateToInputString } from '../../utils/dateUtils';

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  companies: Company[];
  onTimeSlotClick: (time: string) => void;
  onCompanyClick?: (company: Company, time: string) => void;
}

export default function DayView({ 
  currentDate, 
  appointments, 
  companies,
  onTimeSlotClick, 
  onCompanyClick 
}: DayViewProps) {
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // 🎯 FUNÇÃO CORRIGIDA: Obter empresas para um horário específico com datas consistentes
  const getCompaniesForTime = (time: string) => {
    const dateStr = dateToInputString(currentDate);
    const timeAppointments = appointments.filter(apt => 
      apt.date === dateStr && apt.startTime === time && apt.companyId
    );
    
    // Agrupar por empresa
    const companiesMap = new Map();
    
    timeAppointments.forEach(apt => {
      if (apt.companyId) {
        const company = companies.find(c => c.id === apt.companyId);
        if (company) {
          if (!companiesMap.has(company.id)) {
            companiesMap.set(company.id, {
              company,
              appointments: []
            });
          }
          companiesMap.get(company.id).appointments.push(apt);
        }
      }
    });
    
    return Array.from(companiesMap.values());
  };

  const timeSlots = getTimeSlots();
  const dateStr = dateToInputString(currentDate);
  const dayAppointments = appointments.filter(apt => apt.date === dateStr);

  // 🎯 ESTATÍSTICAS CORRIGIDAS: Contar empresas em vez de agendamentos
  const dayCompanies = new Set(dayAppointments.filter(apt => apt.companyId).map(apt => apt.companyId));
  const dayStats = {
    totalAppointments: dayAppointments.length,
    totalCompanies: dayCompanies.size,
    confirmed: dayAppointments.filter(apt => apt.status === 'confirmed').length,
    pending: dayAppointments.filter(apt => apt.status === 'scheduled').length,
    cancelled: dayAppointments.filter(apt => apt.status === 'cancelled').length
  };

  return (
    <div className="bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="md:col-span-2">
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {timeSlots.map((time) => {
              const companiesForTime = getCompaniesForTime(time);
              return (
                <div
                  key={time}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    companiesForTime.length > 0
                      ? 'bg-purple-50 border-purple-200 hover:shadow-md' 
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => companiesForTime.length === 0 ? onTimeSlotClick(time) : undefined}
                >
                  <div className="w-16 text-sm font-medium text-gray-600">
                    {time}
                  </div>
                  <div className="flex-1 ml-4">
                    {companiesForTime.length > 0 ? (
                      <div className="space-y-2">
                        {companiesForTime.map(({ company, appointments: companyAppointments }) => (
                          <div
                            key={company.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompanyClick?.(company, time);
                            }}
                            className="p-2 bg-white rounded border border-purple-200 hover:border-purple-300 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-purple-900">
                              🏢 {company.name}
                            </div>
                            <div className="text-sm text-purple-700">
                              {companyAppointments.length} agendamento{companyAppointments.length > 1 ? 's' : ''} • 
                              {companyAppointments.reduce((total, apt) => total + apt.duration, 0)} min total
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              Serviços: {[...new Set(companyAppointments.map(apt => apt.service))].join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">Horário disponível</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Resumo do Dia</h3>
            <div className="text-sm text-blue-800 mb-3">
              📅 {formatDateWithWeekday(dateStr)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Empresas agendadas:</span>
                <span className="font-medium text-purple-600">{dayStats.totalCompanies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total de agendamentos:</span>
                <span className="font-medium">{dayStats.totalAppointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confirmados:</span>
                <span className="font-medium text-green-600">{dayStats.confirmed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pendentes:</span>
                <span className="font-medium text-yellow-600">{dayStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelados:</span>
                <span className="font-medium text-red-600">{dayStats.cancelled}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Próximas Empresas</h3>
            <div className="space-y-2">
              {Array.from(dayCompanies)
                .slice(0, 3)
                .map((companyId) => {
                  const company = companies.find(c => c.id === companyId);
                  const companyAppointments = dayAppointments.filter(apt => apt.companyId === companyId);
                  const nextAppointment = companyAppointments
                    .filter(apt => apt.status !== 'cancelled')
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
                  
                  return company && nextAppointment ? (
                    <div key={companyId} className="text-sm">
                      <div className="font-medium text-blue-900">
                        {nextAppointment.startTime} - {company.name}
                      </div>
                      <div className="text-blue-700">
                        {companyAppointments.length} agendamento{companyAppointments.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : null;
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}