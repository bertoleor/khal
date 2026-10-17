import { BookingForm } from '@/components/booking/booking-form';
import type { DaySlot } from '@/components/booking/slot-picker';
import type { PaymentInfo } from '@/components/payment/payment-step';
import { Header } from '@/components/shared/header';
import { getService } from '@/lib/actions/catalog';
import { getPaymentSettings } from '@/lib/actions/settings';
import { blockedPeriodsFor, businessHoursFor } from '@/lib/mocks/schedule';
import { computeAvailableSlots, parseClock } from '@khal/db';
import { computeAmountDueCents, formatCents, toIsoDate } from '@khal/utils';
import { notFound } from 'next/navigation';

function dayLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

type ReservarPageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function ReservarPage({ params, searchParams }: ReservarPageProps) {
  const { id, locale } = await params;
  const { skeleton } = await searchParams;

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <h1 className="skeleton-shimmer mt-2 h-8 w-1/3 rounded bg-zinc-800"></h1>
          <p className="skeleton-shimmer mt-1 h-4 w-1/4 rounded bg-zinc-800/60"></p>
          <div className="mt-6 space-y-4">
            {[0, 1].map((blockIndex) => (
              <div
                key={blockIndex}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="skeleton-shimmer h-6 w-16 rounded bg-zinc-800"></div>
                  <div className="skeleton-shimmer h-6 w-24 rounded bg-zinc-800/60"></div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((slotIndex) => (
                    <div
                      key={slotIndex}
                      className="skeleton-shimmer h-8 w-16 rounded bg-zinc-800"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              {[0, 1, 2].map((fieldIndex) => (
                <div
                  key={fieldIndex}
                  className="skeleton-shimmer h-10 w-full rounded-xl bg-zinc-800/60"
                ></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          service.buffer_minutes
        )
      : [];
    days.push({
      date: isoDate,
      label: dayLabel(date, locale),
      closed: hours === null,
      slots,
    });
  }

  const isDeposit = service.deposit_mode === 'fixed' || service.deposit_mode === 'percentage';
  // [KHAL-A1] Real payment settings from global_settings (migration 0008 anon
  // surface). Null -> no transfer details: the payment step hides the transfer
  // section instead of rendering a copyable dummy CVU (the A1 failure mode).
  const storePayment = await getPaymentSettings();
  const payment: PaymentInfo = {
    alias: storePayment?.alias ?? '',
    cvu: storePayment?.cvu ?? '',
    whatsappPhone: storePayment?.whatsappPhone ?? '',
    amountDueCents: computeAmountDueCents(
      service.price_cents,
      service.deposit_mode,
      service.deposit_fixed_cents,
      service.deposit_percentage_bp
    ),
    totalCents: service.price_cents,
    currencyCode: service.currency_code,
    isDeposit,
    depositStatus: 'pending',
  };

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-white">{service.name}</h1>
        <p className="mt-1 font-medium text-emerald-300">
          {formatCents(service.price_cents, service.currency_code)}
        </p>
        <div className="mt-6">
          <BookingForm service={service} days={days} payment={payment} />
        </div>
      </main>
    </div>
  );
}
