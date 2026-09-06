"use client";

import { formatCents } from "@khal/utils";
import {
  VALID_APPOINTMENT_TRANSITIONS,
  type Appointment,
  type AppointmentStatus,
} from "@khal/validations";
import { transitionAppointment } from "@/lib/actions/appointments";

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pendiente: "bg-amber-400",
  confirmado: "bg-emerald-500",
  cancelado: "bg-slate-300",
  no_asistio: "bg-red-500",
};

const ACTION_LABEL: Record<string, string> = {
  confirmado: "Confirmar",
  cancelado: "Cancelar",
  no_asistio: "No asistió",
};

export function AppointmentList({
  appointments,
}: {
  appointments: Appointment[];
}) {
  if (appointments.length === 0) {
    return <p className="mt-6 text-slate-500">No hay turnos para hoy.</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {appointments.map((appointment) => (
        <li
          key={appointment.id}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3"
        >
          <span
            aria-hidden
            className={`h-3 w-3 rounded-full ${STATUS_DOT[appointment.status]}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">
              {appointment.clientName}
            </p>
            <p className="truncate text-sm text-slate-500">
              {appointment.time} · {appointment.serviceName}
            </p>
          </div>
          <span className="text-sm font-medium text-slate-700">
            {formatCents(appointment.priceCents, "ARS")}
          </span>
          <div className="flex gap-1">
            {VALID_APPOINTMENT_TRANSITIONS[appointment.status].map((to) => (
              <form key={to} action={transitionAppointment}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="to" value={to} />
                <button
                  type="submit"
                  className={
                    to === "confirmado"
                      ? "rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                  }
                >
                  {ACTION_LABEL[to]}
                </button>
              </form>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
