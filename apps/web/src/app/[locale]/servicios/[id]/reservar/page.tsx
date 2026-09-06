import { notFound } from "next/navigation";
import { computeAvailableSlots, parseClock } from "@khal/db";
import { computeAmountDueCents, formatCents } from "@khal/utils";
import { BookingForm, type DaySlot } from "@/components/booking/booking-form";
import { Header } from "@/components/shared/header";
import type { PaymentInfo } from "@/components/payment/payment-step";
import { getService } from "@/lib/actions/catalog";
import { storePaymentSettings } from "@/lib/mocks/settings";
import {
  blockedPeriodsFor,
  businessHoursFor,
} from "@/lib/mocks/schedule";

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const service = await getService(id);
  if (!service) {
    notFound();
  }

  const today = new Date();
  const days: DaySlot[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const isoDate = toIsoDate(date);
    const weekday = date.getDay();
    const hours = businessHoursFor(weekday);
    const slots = hours
      ? computeAvailableSlots(
          { start: parseClock(hours.open), end: parseClock(hours.close) },
          blockedPeriodsFor(isoDate, weekday),
          service.duration_minutes,
          service.buffer_minutes,
        )
      : [];
    days.push({
      date: isoDate,
      label: dayLabel(date, locale),
      closed: hours === null,
      slots,
    });
  }

  const isDeposit =
    service.deposit_mode === "fixed" || service.deposit_mode === "percentage";
  const payment: PaymentInfo = {
    alias: storePaymentSettings.alias,
    cvu: storePaymentSettings.cvu,
    whatsappPhone: storePaymentSettings.whatsappPhone,
    amountDueCents: computeAmountDueCents(
      service.price_cents,
      service.deposit_mode,
      service.deposit_fixed_cents,
      service.deposit_percentage_bp,
    ),
    totalCents: service.price_cents,
    currencyCode: service.currency_code,
    isDeposit,
  };

  return (
    <div className="min-h-dvh bg-white">
      <Header />
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {service.name}
        </h1>
        <p className="mt-1 text-slate-500">
          {formatCents(service.price_cents, service.currency_code)}
        </p>
        <div className="mt-6">
          <BookingForm service={service} days={days} payment={payment} />
        </div>
      </main>
    </div>
  );
}