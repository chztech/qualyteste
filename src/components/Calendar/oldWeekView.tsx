import React from 'react';
import { Appointment, Company } from '../../types';
import { formatDate, formatDateCompact, isToday, dateToInputString } from '../../utils/dateUtils';

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  companies: Company[];
  onTimeSlotClick: (date: Date, time: string) => void;
  onCompanyClick?: (company: Company, date: string, time: string) => void;
}

export default function WeekView({ 
  currentDate, 
  appointments, 
  companies,
  onTimeSlotClick, 
  onCompanyClick 
}: WeekViewProps) {
  const getWeekDays = () => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    
    return week;
  };

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

  // 🎯 FUNÇÃO CORRIGIDA: Obter empresas para um slot específico com datas consistentes
  const getCompaniesForSlot = (date: Date, time: string) => {
    const dateStr = dateToInputString(date);
    const slotAppointments = appointments.filter(apt => 
      apt.date === dateStr && apt.startTime === time && apt.companyId
    );
    
    // Agrupar por empresa
    const companiesMap = new Map();
    
    slotAppointments.forEach(apt => {
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

  const weekDays = getWeekDays();
  const timeSlots = getTimeSlots();
  const today = new Date();

  return (
    <div className="bg-white">
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 border-r border-gray-200">
          <span className="text-sm font-medium text-gray-700">Horário</span>
        </div>
        {weekDays.map((day) => {
          const isTodayDate = isToday(dateToInputString(day));
          return (
            <div key={day.toISOString()} className="p-3 text-center border-r border-gray-200">
              <div className={`${isTodayDate ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                <div className="text-sm font-medium">
                  {formatDate(dateToInputString(day), { weekday: 'short' })}
                </div>
                <div className={`text-lg ${isTodayDate ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map((time) => (
          <div key={time} className="grid grid-cols-8 border-b border-gray-100">
            <div className="p-2 border-r border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-600">{time}</span>
            </div>
            {weekDays.map((day) => {
              const companiesForSlot = getCompaniesForSlot(day, time);
              const dateStr = dateToInputString(day);
              
              return (
                <div
                  key={`${dateStr}-${time}`}
                  className="p-1 border-r border-gray-200 min-h-[40px] cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => companiesForSlot.length === 0 && onTimeSlotClick(day, time)}
                >
                  {/* 🎯 VISUALIZAÇÃO CORRIGIDA: Mostrar empresas com datas consistentes */}
                  {companiesForSlot.length > 0 && (
                    <div className="space-y-1">
                      {companiesForSlot.slice(0, 1).map(({ company, appointments: companyAppointments }) => (
                        <div
                          key={company.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompanyClick?.(company, dateStr, time);
                          }}
                          className="w-full h-full p-1 rounded border text-xs cursor-pointer hover:shadow-sm transition-shadow bg-purple-100 text-purple-800 border-purple-200"
                        >
                          <div className="font-medium truncate">🏢 {company.name}</div>
                          <div className="truncate opacity-75">
                            {companyAppointments.length} agendamento{companyAppointments.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      ))}
                      {companiesForSlot.length > 1 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{companiesForSlot.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}