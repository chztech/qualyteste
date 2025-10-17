import React from "react";
import { Appointment, Company } from "../../types";
import { toYMD } from "../../utils/dateUtils";

type Props = {
  currentDate: Date;
  appointments: Appointment[];
  companies: Company[];
  onTimeSlotClick: (time: string) => void;
  onCompanyClick?: (company: Company, ymd: string, time?: string) => void;
};

export default function DayView({
  currentDate,
  appointments,
  companies,
  onTimeSlotClick,
  onCompanyClick,
}: Props) {
  const ymd = toYMD(currentDate);
  const hours = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`
  );

  const dayAppts = appointments.filter((a) => a.date === ymd);

  return (
    <div className="divide-y">
      {hours.map((hhmm) => {
        const slotAppts = dayAppts.filter((a) => a.startTime === hhmm);
        return (
          <div
            key={hhmm}
            className="h-14 px-3 flex items-center hover:bg-gray-50 cursor-pointer"
            onClick={() => onTimeSlotClick(hhmm)}
          >
            <div className="w-16 text-right pr-3 text-gray-500">{hhmm}</div>
            <div className="flex-1 flex gap-2 flex-wrap">
              {slotAppts.map((apt) => {
                const company = companies.find((c) => c.id === apt.companyId);
                return (
                  <div
                    key={apt.id}
                    className="px-2 py-1 rounded bg-blue-100 text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (company && onCompanyClick)
                        onCompanyClick(company, apt.date, apt.startTime);
                    }}
                  >
                    {company?.name ?? "—"} • {apt.duration}m
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
