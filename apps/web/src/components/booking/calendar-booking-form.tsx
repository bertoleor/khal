import { Calendar } from '@/components/calendar';
import { PaymentStep, type PaymentInfo } from '@/components/payment/payment-step';
import { Field } from '@/components/shared/field';
import { Link } from '@/i18n/navigation';
import { createBooking, type BookingState } from '@/lib/actions/booking';
import { serviceWithAddons } from '@/lib/booking/addons';
import { formatCents } from '@khal/utils';
import {
  BOOKING_ADDON_CATALOG,
  bookingAddonPriceCents,
  type BookingAddonId,
  type Service,
} from '@khal/validations';
import { useTranslations } from 'next-intl';
import { useActionState, useState, useMemo } from 'react';
import type { CalendarSlot } from '@/components/calendar';

const initialBookingState: BookingState = { ok: false };

type ErrorKey =
  | 'error.invalid'
  | 'error.duplicate'
  | 'error.blacklisted'
  | 'error.conflict'
  | 'error.unavailable';

function errorKeyFor(code: BookingState['code']): ErrorKey {
  switch (code) {
    case 'duplicate': return 'error.duplicate';
    case 'blacklisted': return 'error.blacklisted';
    case 'conflict': return 'error.conflict';
    case 'unavailable': return 'error.unavailable';
    default: return 'error.invalid';
  }
}

const ADDON_CHIP_BASE =
  'rounded-full border px-3 py-[5px] text-[10.5px] font-semibold transition-[background-color,border-color,color] duration-160 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation';
const ADDON_CHIP_ON = `${ADDON_CHIP_BASE} border-accent bg-accent text-accent-contrast`;
const ADDON_CHIP_OFF = `${ADDON_CHIP_BASE} border-hairline bg-surface text-foreground hover:bg-surface-hover`;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function CalendarBookingForm({
  service,
  slots,
  payment,
  locale = 'es-AR',
}: {
  service: Service;
  slots: CalendarSlot[];
  payment: PaymentInfo;
  locale?: 'es-AR' | 'en';
}) {
  const t = useTranslations('booking');
  const tAddons = useTranslations('addons');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [addonIds, setAddonIds] = useState<BookingAddonId[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [state, formAction, isPending] = useActionState(createBooking, initialBookingState);

  const totalCents = useMemo(
    () => service.price_cents + addonIds.reduce((sum, id) => sum + bookingAddonPriceCents(id), 0),
    [service.price_cents, addonIds]
  );

  if (state.ok && state.bookingId && selectedSlot) {
    return (
      <PaymentStep
        payment={payment}
        serviceName={serviceWithAddons(service.name, addonIds, tAddons)}
        date={selectedDate}
        slot={formatTime(selectedSlot.startMinutes)}
        bookingId={state.bookingId}
      />
    );
  }

  const error = !state.ok && state.code ? t(errorKeyFor(state.code)) : null;

  function handleDateSelect(date: Date, daySlots: CalendarSlot[]) {
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedSlot(null);
  }

  function handleSlotSelect(slot: CalendarSlot) {
    setSelectedSlot(slot);
  }

  function toggleAddon(id: BookingAddonId) {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  }

  const hasSlots = slots.length > 0;

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Calendar
        serviceId={service.id}
        slots={slots}
        onDateSelect={handleDateSelect}
        onSlotSelect={handleSlotSelect}
        locale={locale}
        view={view}
        onViewChange={setView}
        className={hasSlots ? '' : 'min-h-[300px]'}
      />

      {selectedSlot ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="slotStart" value={formatTime(selectedSlot.startMinutes)} />
          <input type="hidden" name="idempotencyKey" value={selectedSlot.id} />
          {/* S6: the selection posts IDs only — the server resolves prices from BOOKING_ADDON_CATALOG */}
          <input type="hidden" name="addons" value={JSON.stringify(addonIds)} />

          {/* "¿Sumás algo más? (opcional)" — a curated list, no cart (S6). */}
          <section aria-labelledby="addons-heading">
            <h2
              id="addons-heading"
              className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint"
            >
              {t('addonsTitle')} <span className="opacity-55">{t('addonsOptional')}</span>
            </h2>
            <div className="mt-1.5 rounded-lg border border-hairline bg-surface backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)]">
              {BOOKING_ADDON_CATALOG.map((addon) => {
                const isOn = addonIds.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-3 border-b border-hairline px-3.5 py-2.5 last:border-b-0"
                  >
                    <span className="text-xs text-muted">{tAddons(addon.id)}</span>
                    <button
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      aria-pressed={isOn}
                      className={isOn ? ADDON_CHIP_ON : ADDON_CHIP_OFF}
                    >
                      {isOn
                        ? t('addonAdded')
                        : `${t('addonAdd')} · ${formatCents(addon.priceCents, service.currency_code)}`}
                    </button>
                  </div>
                );
              })}
              {/* The live total (S6): service + add-ons, updating as she taps. */}
              <div className="flex items-baseline justify-between px-3.5 pb-0.5 pt-2.5">
                <span className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
                  {t('total')}
                </span>
                <span className="font-mono-khal text-[19px] font-bold tracking-[-0.5px] tabular-nums text-foreground">
                  {formatCents(totalCents, service.currency_code)}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
              {t('dataTitle')}
            </h2>
            <div className="mt-2 space-y-2">
              <Field label={t('name')} name="name" type="text" autoComplete="name" />
              <Field label={t('phone')} name="phone" type="tel" autoComplete="tel" />
              <Field label={t('email')} name="email" type="email" autoComplete="email" />
            </div>
          </section>

          {/* D3 — "¿venís con trabajo de otro lugar?": persists via create_booking (0014) */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="externalWork"
              name="externalWork"
              type="checkbox"
              className="mt-0.5 size-4 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-[44px] touch-manipulation"
            />
            <label htmlFor="externalWork" className="cursor-pointer text-[10.5px] text-muted mt-0.5">
              {t('externalWorkLabel')}
            </label>
          </div>

          {/* D1 — terms gate: required client-side AND enforced server-side */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              required
              className="mt-0.5 size-4 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-h-[44px] touch-manipulation"
            />
            <p className="text-[10.5px] text-muted">
              <label htmlFor="termsAccepted" className="cursor-pointer">
                {t('termsLabel')}
              </label>{' '}
              <Link
                href="/politicas"
                className="font-mono-khal text-[9px] uppercase tracking-[1.5px] text-muted underline-offset-4 transition-[color] duration-160 ease-out hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation flex items-center"
              >
                {t('termsLink')}
              </Link>
            </p>
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-accent px-6 py-[13px] text-[13.5px] font-semibold text-accent-contrast transition-[background-color] duration-160 ease-out will-change-transform hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch-manipulation"
          >
            {isPending ? t('submitting') : t('confirm')}
          </button>
          {/* S6: the hold, said delicately — no mechanic, no numbers. */}
          <p className="text-center text-[10.5px] text-faint">{t('holdNote')}</p>
        </form>
      ) : (
        !hasSlots && (
          <div className="px-4 py-8 text-center text-zinc-500">
            <p className="text-sm">
              {locale === 'es-AR'
                ? 'No hay horarios disponibles para este servicio'
                : 'No slots available for this service'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
