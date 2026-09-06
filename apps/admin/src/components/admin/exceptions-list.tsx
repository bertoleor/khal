"use client";

import type { CalendarException, ExceptionType } from "@khal/validations";
import { addException } from "@/lib/actions/exceptions";

const TYPE_LABEL: Record<ExceptionType, string> = {
  holiday: "Feriado",
  vacation: "Vacaciones",
  event: "Evento",
  block: "Bloqueo",
};

export function ExceptionsList({
  exceptions,
}: {
  exceptions: CalendarException[];
}) {
  return (
    <div className="mt-4 space-y-4">
      <form
        action={addException}
        className="space-y-3 rounded-2xl border border-slate-200 p-4"
      >
        <input
          name="title"
          placeholder="Motivo (ej. Feriado)"
          required
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        <div className="flex gap-2">
          <select
            name="type"
            defaultValue="holiday"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          >
            <option value="holiday">Feriado</option>
            <option value="vacation">Vacaciones</option>
            <option value="event">Evento</option>
            <option value="block">Bloqueo</option>
          </select>
          <input
            name="date"
            type="date"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white"
        >
          Bloquear día
        </button>
      </form>

      {exceptions.length === 0 ? (
        <p className="text-sm text-slate-500">No hay bloqueos definidos.</p>
      ) : (
        <ul className="space-y-2">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{exception.title}</p>
                <p className="text-sm text-slate-500">
                  {exception.date} · {TYPE_LABEL[exception.type]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
