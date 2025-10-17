import React from "react";
import { Appointment, Company } from "../../types";
import { toYMD, sameYMD } from "../../utils/dateUtils";

type Props = {
  currentDate: Date;
  appointments: Appointment[];
  companies: Company[];
  onDateClick: (date: Date) => void;
  onCompanyClick?: (company: Company, ymd: string, time?: string) => void;
};

export default function MonthView({
  currentDate,
  appointments,
  companies,
  onDateClick,
  onCompanyClick,
}: Props) {
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const startDate = new Date(firstDay);
  startDate.setDate(1 - ((firstDay.getDay() + 6) % 7)); // semana começando na segunda

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  const apptsByDay = appointments.reduce<Record<string, Appointment[]>>(
    (acc, apt) => {
      const key = apt.date; // já é YYYY-MM-DD do backend
      if (!acc[key]) acc[key] = [];
      acc[key].push(apt);
      return acc;
    },
    {}
  );

  return (
    <div className="grid grid-cols-7 gap-2 p-2">
      {days.map((d) => {
        const ymd = toYMD(d);
        const dayAppts = apptsByDay[ymd] ?? [];
        return (
          <div
            key={ymd}
            className="border rounded p-2 min-h-[90px] cursor-pointer hover:bg-gray-50"
            onClick={() => onDateClick(d)}
          >
            <div className="text-xs font-semibold">{d.getDate()}</div>
            {dayAppts.slice(0, 3).map((apt) => {
              const company = companies.find((c) => c.id === apt.companyId);
              return (
                <div
                  key={apt.id}
                  className="text-[11px] mt-1 px-1 py-0.5 bg-blue-100 text-blue-800 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (company && onCompanyClick)
                      onCompanyClick(company, apt.date, apt.startTime);
                  }}
                >
                  {company?.name ?? "—"} • {apt.startTime}
                </div>
              );
            })}
            {dayAppts.length > 3 && (
              <div className="text-[11px] text-gray-500 mt-1">
                +{dayAppts.length - 3} agend.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
