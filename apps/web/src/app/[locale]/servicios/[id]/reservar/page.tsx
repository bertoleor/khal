import { CalendarBookingForm } from '@/components/booking/calendar-booking-form';
import { Header } from '@/components/shared/header';
import { Link } from '@/i18n/navigation';
import { getService } from '@/lib/actions/catalog';
import { getPaymentSettings } from '@/lib/actions/settings';
import { blockedPeriodsFor, businessHoursFor } from '@/lib/mocks/schedule';
import { candidateSlots, computeAvailableSlots, parseClock } from '@khal/db';
import { computeAmountDueCents, toIsoDate } from '@khal/utils';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { CalendarSlot } from '@/components/calendar';

type ReservarPageProps = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ skeleton?: string }>;
};

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
}

export default async function ReservarPage({ params, searchParams }: ReservarPageProps) {
  const { id, locale } = await params;
  const { skeleton } = await searchParams;
  const t = await getTranslations('booking');

  if (skeleton === '1') {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <h1 aria-hidden="true" className="skeleton-shimmer mt-2 h-8 w-1/3 rounded bg-zinc-800"></h1>
          <p className="skeleton-shimmer mt-1 h-4 w-1/4 rounded bg-zinc-800/60"></p>
          <div className="mt-6 space-y-4">
            {[0, 1].map((blockIndex) => (
              <div key={blockIndex} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2">
                  <div className="skeleton-shimmer h-6 w-16 rounded bg-zinc-800"></div>
                  <div className="skeleton-shimmer h-6 w-24 rounded bg-zinc-800/60"></div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((slotIndex) => (
                    <div key={slotIndex} className="skeleton-shimmer h-8 w-16 rounded bg-zinc-800"></div>
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              {[0, 1, 2].map((fieldIndex) => (
                <div key={fieldIndex} className="skeleton-shimmer h-10 w-full rounded-xl bg-zinc-800/60"></div>
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
  const calendarSlots: CalendarSlot[] = [];
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const isoDate = toIsoDate(date);
    const weekday = date.getDay();
    const hours = businessHoursFor(weekday);

    if (hours) {
      const availableSlots = computeAvailableSlots(
        { start: parseClock(hours.open), end: parseClock(hours.close) },
        blockedPeriodsFor(isoDate, weekday),
        service.duration_minutes,
        service.buffer_minutes
      );

      const allSlots = candidateSlots(
        { start: parseClock(hours.open), end: parseClock(hours.close) },
        service.duration_minutes,
        service.buffer_minutes
      );

      const takenSlots = allSlots.filter((slot) => !availableSlots.includes(slot));

      [...availableSlots, ...takenSlots].forEach((slot) => {
        const [hours, minutes] = slot.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        calendarSlots.push({
          id: `${service.id}-${isoDate}-${slot}`,
          serviceId: service.id,
          date: isoDate,
          startMinutes,
          durationMinutes: service.duration_minutes,
          isAvailable: availableSlots.includes(slot),
        });
      });
    }
  }

  const isDeposit = service.deposit_mode === 'fixed' || service.deposit_mode === 'percentage';
  const storePayment = await getPaymentSettings();
  const payment = {
    alias: storePayment?.alias ?? '',
    cvu: storePayment?.cvu ?? '',
    whatsappPhone: storePayment?.whatsappPhone ?? '',
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
        <Link
          href={`/servicios/${service.id}`}
          className="mt-3 inline-block font-mono-khal text-[8px] uppercase tracking-[2.5px] text-muted transition-[color] duration-160 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation flex items-center"
        >
          ← {service.name}
        </Link>
        <h1 className="mt-3 text-[16px] font-bold tracking-[-0.02em] text-foreground">
          {t('title')}
        </h1>
        <div className="mt-3.5">
          <CalendarBookingForm
            service={service}
            slots={calendarSlots}
            payment={payment}
            locale={locale as 'es-AR' | 'en'}
          />
        </div>
      </main>
    </div>
  );
}
