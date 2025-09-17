import React from 'react';
import { Appointment, Company } from '../../types';
import { formatDate, formatDateCompact, isToday, dateToInputString } from '../../utils/dateUtils';

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  companies: Company[];
  onDateClick: (date: Date) => void;
  onCompanyClick?: (company: Company, date: string) => void;
}

export default function MonthView({ 
  currentDate, 
  appointments, 
  companies,
  onDateClick, 
  onCompanyClick 
}: MonthViewProps) {
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // 🎯 FUNÇÃO CORRIGIDA: Obter empresas agendadas para uma data específica
  const getCompaniesForDate = (date: Date) => {
    const dateStr = dateToInputString(date);
    const dayAppointments = appointments.filter(apt => apt.date === dateStr && apt.companyId);
    
    // Agrupar por empresa
    const companiesMap = new Map();
    
    dayAppointments.forEach(apt => {
      if (apt.companyId) {
        const company = companies.find(c => c.id === apt.companyId);
        if (company) {
          if (!companiesMap.has(company.id)) {
            companiesMap.set(company.id, {
              company,
              appointmentCount: 0
            });
          }
          companiesMap.get(company.id).appointmentCount++;
        }
      }
    });
    
    return Array.from(companiesMap.values());
  };

  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  return (
    <div className="bg-white">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center">
            <span className="text-sm font-medium text-gray-700">{day}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const companiesForDay = getCompaniesForDate(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isTodayDate = isToday(dateToInputString(day));
          
          return (
            <div
              key={index}
              className={`min-h-[120px] border-b border-r border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-medium ${
                    isTodayDate
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </span>
                {companiesForDay.length > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">
                    {companiesForDay.length} empresa{companiesForDay.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* 🎯 VISUALIZAÇÃO CORRIGIDA: Mostrar empresas com datas consistentes */}
              <div className="space-y-1">
                {companiesForDay.slice(0, 2).map(({ company, appointmentCount }) => (
                  <div
                    key={company.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompanyClick?.(company, dateToInputString(day));
                    }}
                    className="text-xs p-1.5 rounded border cursor-pointer hover:shadow-sm transition-shadow bg-purple-100 text-purple-800 border-purple-200"
                  >
                    <div className="font-medium truncate">
                      🏢 {company.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {appointmentCount} agendamento{appointmentCount > 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
                {companiesForDay.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{companiesForDay.length - 2} empresa{companiesForDay.length - 2 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}