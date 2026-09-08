"use client";

import { useTranslations } from "next-intl";
import { formatCents } from "@khal/utils";
import type { Service } from "@khal/validations";
import {
  bulkIncrease as bulkIncreaseAction,
  toggleVisibility as toggleVisibilityAction,
} from "@/lib/actions/services";

function handleToggleVisibility(formData: FormData): void {
  void toggleVisibilityAction(formData);
}

function handleBulkIncrease(formData: FormData): void {
  void bulkIncreaseAction(formData);
}

export function ServiceList({ services }: { services: Service[] }) {
  const t = useTranslations("Admin");

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
            formAction={handleToggleVisibility}
            name="id"
            value={service.id}
            type="submit"
            className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {service.is_visible ? t("services.hide") : t("services.show")}
          </button>
        </div>
      ))}

      <button
        formAction={handleBulkIncrease}
        type="submit"
        className="mt-4 w-full rounded-full bg-slate-900 py-3 text-sm font-medium text-white"
      >
        {t("services.bulkIncrease")}
      </button>
    </form>
  );
}
