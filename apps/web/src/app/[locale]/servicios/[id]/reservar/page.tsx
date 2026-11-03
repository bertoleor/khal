import { BookingForm } from '@/components/booking/booking-form';
import type { DaySlot } from '@/components/booking/slot-picker';
import type { PaymentInfo } from '@/components/payment/payment-step';
import { Header } from '@/components/shared/header';
import { Link } from '@/i18n/navigation';
import { getService } from '@/lib/actions/catalog';
import { getPaymentSettings } from '@/lib/actions/settings';
import { blockedPeriodsFor, businessHoursFor } from '@/lib/mocks/schedule';
import { candidateSlots, computeAvailableSlots, parseClock } from '@khal/db';
import { computeAmountDueCents, toIsoDate } from '@khal/utils';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

type ReservarPageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ skeleton?: string }>;
};

export default async function ReservarPage({ params, searchParams }: ReservarPageProps) {
  const { id, locale } = await params;
  const { skeleton } = await searchParams;
  const t = await getTranslations('booking');

  // Presentation mode (?skeleton=1): placeholder-only layout for design review.
  if (skeleton === '1') {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <h1
            aria-hidden="true"
            className="skeleton-shimmer mt-2 h-8 w-1/3 rounded bg-zinc-800"
          ></h1>
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
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });

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
    // T-F2.3 (tachados): the full reel minus the available ones = taken
    // starts, rendered crossed out by the picker.
    const taken = hours
      ? candidateSlots(
          { start: parseClock(hours.open), end: parseClock(hours.close) },
          service.duration_minutes,
          service.buffer_minutes
        ).filter((slot) => !slots.includes(slot))
      : [];
    days.push({
      date: isoDate,
      // v7 day chips (S6): big number + tiny weekday, domingos off.
      dayNumber: String(date.getDate()),
      weekday: weekdayFormat.format(date),
      closed: hours === null,
      slots,
      taken,
    });
  }

  const isDeposit = service.deposit_mode === 'fixed' || service.deposit_mode === 'percentage';
  // [KHAL-A1] Real payment settings from global_settings (migration 0008 anon
  // surface). Null -> no transfer details: the recibo hides the transfer
  // rows instead of rendering a copyable dummy CVU (the A1 failure mode).
  const storePayment = await getPaymentSettings();
  const payment: PaymentInfo = {
    alias: storePayment?.alias ?? '',
    cvu: storePayment?.cvu ?? '',
    whatsappPhone: storePayment?.whatsappPhone ?? '',
    // S7: the seña — whatever the service's deposit says. The add-ons (S6)
    // move the live total inside the form; the seña is NEVER recalculated.
    amountDueCents: computeAmountDueCents(
      service.price_cents,
      service.deposit_mode,
      service.deposit_fixed_cents,
      service.deposit_percentage_bp
    ),
    currencyCode: service.currency_code,
    isDeposit,
    durationMinutes: service.duration_minutes,
  };

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg px-5 pb-16">
        {/* "Atrás" tipográfico (S12): back to the service, no pills. */}
        <Link
          href={`/servicios/${service.id}`}
          className="mt-3 inline-block font-mono-khal text-[8px] uppercase tracking-[2.5px] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← {service.name}
        </Link>
        <h1 className="mt-3 text-[16px] font-bold tracking-[-0.02em] text-foreground">
          {t('title')}
        </h1>
        <div className="mt-3.5">
          <BookingForm service={service} days={days} payment={payment} />
        </div>
      </main>
    </div>
  );
}
