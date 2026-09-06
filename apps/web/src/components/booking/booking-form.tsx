"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { cn, formatCents } from "@khal/utils";
import type { Service } from "@khal/validations";
import { createBooking, type BookingState } from "@/lib/actions/booking";
import { PaymentStep, type PaymentInfo } from "@/components/payment/payment-step";
import { Field } from "@/components/shared/field";

export interface DaySlot {
  date: string;
  label: string;
  closed: boolean;
  slots: string[];
}

const initialBookingState: BookingState = { ok: false };

type ErrorKey = "error.invalid" | "error.duplicate" | "error.blacklisted";

function errorKeyFor(code: BookingState["code"]): ErrorKey {
  switch (code) {
    case "duplicate":
      return "error.duplicate";
    case "blacklisted":
      return "error.blacklisted";
    default:
      return "error.invalid";
  }
}

export function BookingForm({
  service,
  days,
  payment,
}: {
  service: Service;
  days: DaySlot[];
  payment: PaymentInfo;
}) {
  const t = useTranslations("booking");
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? "");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    createBooking,
    initialBookingState,
  );

  const activeDay = days.find((day) => day.date === selectedDate) ?? days[0];

  if (state.ok && state.bookingId && selectedSlot && selectedDate) {
    return (
      <PaymentStep
        payment={payment}
        serviceName={service.name}
        date={selectedDate}
        slot={selectedSlot}
      />
    );
  }

  const error = !state.ok && state.code ? t(errorKeyFor(state.code)) : null;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-slate-500">{t("pickDay")}</h2>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => {
            const isActive = day.date === selectedDate;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  setSelectedDate(day.date);
                  setSelectedSlot(null);
                }}
                disabled={day.closed}
                aria-pressed={isActive}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-sm",
                  day.closed
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                    : isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeDay && !activeDay.closed ? (
        <section>
          <h2 className="text-sm font-medium text-slate-500">{t("pickSlot")}</h2>
          {activeDay.slots.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("noSlots")}</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {activeDay.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={selectedSlot === slot}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm",
                    selectedSlot === slot
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-slate-500">{t("closed")}</p>
      )}

      {selectedSlot ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="slotStart" value={selectedSlot} />
          <Field label={t("name")} name="name" type="text" autoComplete="name" />
          <Field
            label={t("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
          />
          <Field
            label={t("email")}
            name="email"
            type="email"
            autoComplete="email"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t("submitting") : t("confirm")}
          </button>
        </form>
      ) : null}

      <p className="pb-4 text-xs text-slate-400">
        {formatCents(service.price_cents, service.currency_code)}
      </p>
    </div>
  );
}