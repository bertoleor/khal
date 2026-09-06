"use client";

import { formatCents } from "@khal/utils";
import type { Service } from "@khal/validations";
import { bulkIncrease, toggleVisibility } from "@/lib/actions/services";

export function ServiceList({ services }: { services: Service[] }) {
  return (
    <form className="mt-4 space-y-2">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"
        >
          <input
            type="checkbox"
            name="ids"
            value={service.id}
            aria-label={service.name}
            className="h-4 w-4"
          />
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-medium ${
                service.is_visible ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {service.name}
            </p>
            <p className="text-sm text-slate-500">
              {formatCents(service.price_cents, service.currency_code)}
            </p>
          </div>
          <button
            formAction={toggleVisibility}
            name="id"
            value={service.id}
            type="submit"
            className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {service.is_visible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      ))}

      <button
        formAction={bulkIncrease}
        type="submit"
        className="mt-4 w-full rounded-full bg-slate-900 py-3 text-sm font-medium text-white"
      >
        Subir 10% a seleccionados
      </button>
    </form>
  );
}
