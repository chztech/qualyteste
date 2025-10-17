import React from "react";
import { Appointment, Company } from "../../types";
import {
  startOfWeekYMD,
  addDaysYMD,
  toYMD,
  sameYMD,
} from "../../utils/dateUtils";

type Props = {
  currentDate: Date;
  appointments: Appointment[];
  companies: Company[];
  onTimeSlotClick: (date: Date, time: string) => void;
  onCompanyClick?: (company: Company, ymd: string, time?: string) => void;
};

export default function WeekView({
  currentDate,
  appointments,
  companies,
  onTimeSlotClick,
  onCompanyClick,
}: Props) {
  const weekStartYMD = startOfWeekYMD(toYMD(currentDate)); // segunda
  const weekDaysYMD = Array.from({ length: 7 }, (_, i) =>
    addDaysYMD(weekStartYMD, i)
  );
  const hours = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`
  );

  const apptsByDay = appointments.reduce<Record<string, Appointment[]>>(
    (acc, apt) => {
      (acc[apt.date] ??= []).push(apt);
      return acc;
    },
    {}
  );

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="w-16"></th>
            {weekDaysYMD.map((ymd) => (
              <th key={ymd} className="py-2 text-center font-medium">
                {ymd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hhmm) => (
            <tr key={hhmm}>
              <td className="w-16 text-right pr-2 text-gray-500">{hhmm}</td>
              {weekDaysYMD.map((ymd) => {
                const dayAppts = (apptsByDay[ymd] ?? []).filter(
                  (a) => a.startTime === hhmm
                );
                return (
                  <td
                    key={ymd + hhmm}
                    className="border h-12 align-top cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      onTimeSlotClick(new Date(ymd + "T12:00:00"), hhmm)
                    }
                  >
                    {dayAppts.map((apt) => {
                      const company = companies.find(
                        (c) => c.id === apt.companyId
                      );
                      return (
                        <div
                          key={apt.id}
                          className="m-1 px-2 py-1 rounded bg-blue-100 text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (company && onCompanyClick)
                              onCompanyClick(company, apt.date, apt.startTime);
                          }}
                        >
                          {company?.name ?? "—"} ({apt.duration}m)
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
