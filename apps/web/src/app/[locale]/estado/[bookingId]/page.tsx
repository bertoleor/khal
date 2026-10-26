import { HoldCountdown } from '@/components/booking/hold-countdown';
import { Header } from '@/components/shared/header';
import { Link } from '@/i18n/navigation';
import { getBookingStatus, type BookingStatus } from '@/lib/actions/booking-status';
import { serviceWithAddons } from '@/lib/booking/addons';
import { cn, formatClock24, formatCompactDay, formatDurationLabel } from '@khal/utils';
import { getTranslations } from 'next-intl/server';

/**
 * S10 — the estado (v7, approved preview §5): the clienta's personal link
 * and FOUR states, with the status box and the data box ALWAYS the same
 * width (both w-full children of the same centered max-w-lg column):
 *
 *   pendiente   → countdown hero + service/fecha rows + the 3 numbered steps
 *   confirmado  → "te esperamos" hero + rows + recordatorios NUMBERED 1-4
 *                 (never bullet dots)
 *   no confirmada → status='cancelado' + hold_released_at (the 0012 sweeper
 *                 MARKS expired holds, never deletes): "qué pasó" + the
 *                 delicate explanation ("unas horas", never "12 h")
 *   cancelado   → a real cancellation (cancelado without hold_released_at);
 *                 no_asistio renders in the same closed family
 *
 * The closed states end with "Si creés que fue un error, escribinos." and
 * offer "Reservar otra vez". The 12h hold mechanic is never visible.
 */

/** The status box (preview §5): glass strip + 7px state dot. */
const STATUS_BOX =
  'mt-3 flex w-full items-center gap-2.5 rounded-md border border-hairline bg-surface px-[15px] py-3 font-mono-khal text-[10px] font-semibold uppercase tracking-[2px] text-muted backdrop-blur-lg';

/** The data box: same width discipline — w-full, centered by the column. */
const DATA_BOX =
  'w-full rounded-lg border border-hairline bg-surface backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)]';

/** Quiet row inside a data box (S12: py-2.5 px-3.5). */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline px-3.5 py-2.5 text-xs last:border-b-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="truncate font-semibold text-foreground">{value}</span>
    </div>
  );
}

/** The data-box hero: mono kicker over a big mono value. */
function Hero({ label, value, size }: { label: string; value: string; size: 'lg' | 'sm' }) {
  const valueClass = cn(
    'mt-1.5 font-mono-khal font-bold leading-none tracking-[-1px] tabular-nums text-foreground',
    size === 'lg' ? 'text-[22px]' : 'text-[19px]'
  );
  return (
    <div className="border-b border-hairline px-3.5 pb-[3px] pt-[13px]">
      <p className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

/** A numbered step (S10: ①②③ circles, never bullet dots). */
function StepRow({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-[11px] border-b border-hairline px-3.5 py-2.5 text-xs text-muted last:border-b-0">
      <span
        aria-hidden="true"
        className="flex size-[21px] shrink-0 items-center justify-center rounded-full border border-hairline font-mono-khal text-[10px] font-bold text-foreground"
      >
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}

/** A booking the door actually found (the page guards ok + status first). */
type FoundBooking = BookingStatus & {
  ok: true;
  status: NonNullable<BookingStatus['status']>;
};

type EstadoPageProps = {
  params: Promise<{ bookingId: string; locale: string }>;
};

/** The not-found door: the page exists, the turno does not. */
async function EstadoNotFound() {
  const t = await getTranslations('estado');
  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-lg px-5 pb-16">
        <p className="mt-6 font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
          {t('title')}
        </p>
        <p className="mt-3 text-[12.5px] text-muted">{t('notFound')}</p>
        <Link
          href="/"
          className="mt-4 flex w-full items-center justify-center rounded-full border border-hairline bg-surface px-6 py-3 text-[13px] font-semibold text-foreground backdrop-blur-lg transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('backHome')}
        </Link>
      </main>
    </div>
  );
}

/** Pendiente data box: countdown hero + rows + the 3 numbered steps. */
async function PendienteBody({
  holdExpiresAt,
  serviceDisplay,
  dateValue,
}: {
  holdExpiresAt?: string;
  serviceDisplay: string;
  dateValue: string;
}) {
  const t = await getTranslations('estado');
  const steps = [t('step1'), t('step2'), t('step3')];
  return (
    <>
      {holdExpiresAt ? <HoldCountdown holdExpiresAt={holdExpiresAt} /> : null}
      <Row label={t('serviceRow')} value={serviceDisplay} />
      <Row label={t('dateRow')} value={dateValue} />
      <ol className="list-none">
        {steps.map((step, index) => (
          <StepRow key={step} n={index + 1} text={step} />
        ))}
      </ol>
    </>
  );
}

/** Confirmado data box: "te esperamos" hero + rows. */
async function ConfirmadoBody({
  serviceDisplay,
  turno,
  duration,
}: {
  serviceDisplay: string;
  turno: string;
  duration: string | null;
}) {
  const t = await getTranslations('estado');
  return (
    <>
      <Hero label={t('heroWaitLabel')} value={turno} size="lg" />
      <Row label={t('serviceRow')} value={serviceDisplay} />
      {duration ? <Row label={t('durationRow')} value={duration} /> : null}
      <Row label={t('placeRow')} value={t('placeValue')} />
    </>
  );
}

/** The closed family's data box (no confirmada / cancelado / no asistio). */
async function ClosedBody({
  heroLabel,
  heroValue,
  serviceDisplay,
  dateValue,
}: {
  heroLabel: string;
  heroValue: string;
  serviceDisplay: string;
  dateValue: string;
}) {
  const t = await getTranslations('estado');
  return (
    <>
      <Hero label={heroLabel} value={heroValue} size="sm" />
      <Row label={t('serviceRow')} value={serviceDisplay} />
      <Row label={t('dateRow')} value={dateValue} />
    </>
  );
}

/** Confirmado's recordatorios — numbered 1-4, never bullet dots (S10). */
async function RemindersCard() {
  const t = await getTranslations('estado');
  const reminders = [t('reminder1'), t('reminder2'), t('reminder3'), t('reminder4')];
  return (
    <>
      <p className="mt-3 font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
        {t('remindersTitle')}
      </p>
      <div className={cn(DATA_BOX, 'mt-1.5')}>
        <ol className="list-none">
          {reminders.map((reminder, index) => (
            <StepRow key={reminder} n={index + 1} text={reminder} />
          ))}
        </ol>
      </div>
    </>
  );
}

/** Everything the found-state render needs, computed once. */
interface EstadoView {
  statusKey: string;
  dotClass: string;
  serviceDisplay: string;
  turno: string;
  dateWithDuration: string;
  duration: string | null;
  isHoldReleased: boolean;
  isOpen: boolean;
  hero: { label: string; value: string };
  lead: string;
}

async function computeEstadoView(status: FoundBooking, locale: string): Promise<EstadoView> {
  const t = await getTranslations('estado');
  const tAddons = await getTranslations('addons');
  const intlLocale = locale === 'en' ? 'en-US' : 'es-AR';
  const scheduled = status.scheduledAt ? new Date(status.scheduledAt) : null;
  const dayLabel = scheduled ? formatCompactDay(scheduled, intlLocale) : null;
  const clockLabel = scheduled ? formatClock24(scheduled, intlLocale) : null;
  const turno = dayLabel !== null && clockLabel !== null ? `${dayLabel} · ${clockLabel}` : '';
  // S9/S10: the service reads WITH its add-ons ("Lifting + perfilado").
  const serviceDisplay = serviceWithAddons(status.serviceName ?? '', status.addons ?? [], tAddons);

  // 0012 marks expired holds as cancelado + hold_released_at — that pair IS
  // the "reserva no confirmada" state; a cancelado without it is a real
  // cancellation. no_asistio renders with the closed family.
  const isHoldReleased = status.status === 'cancelado' && (status.holdReleasedAt ?? '') !== '';
  const isOpen = status.status === 'pendiente' || status.status === 'confirmado';
  const statusKey = isHoldReleased ? 'noConfirmado' : status.status;
  // Dot: accent ink when confirmed, foreground ink otherwise (preview §5).
  const dotClass = status.status === 'confirmado' ? 'bg-accent' : 'bg-foreground';
  const duration = status.durationMinutes ? formatDurationLabel(status.durationMinutes) : null;
  const dateWithDuration = duration !== null ? `${turno} · ${duration}` : turno;
  const hero = isHoldReleased
    ? { label: t('heroWhatHappened'), value: t('noConfirmadoHeroBody') }
    : { label: t('statusHeroLabel'), value: turno };
  const lead = isHoldReleased ? t('noConfirmadoBody') : t('canceladoLead');

  return {
    statusKey,
    dotClass,
    serviceDisplay,
    turno,
    dateWithDuration,
    duration,
    isHoldReleased,
    isOpen,
    hero,
    lead,
  };
}

async function EstadoFound({ status, locale }: { status: FoundBooking; locale: string }) {
  const t = await getTranslations('estado');
  const view = await computeEstadoView(status, locale);

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-lg px-5 pb-16">
        <p className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
          {t('title')}
        </p>

        {/* The status box — same width as the data box below, always. */}
        <p className={STATUS_BOX}>
          <span aria-hidden="true" className={cn('size-[7px] rounded-full', view.dotClass)} />
          {t(view.statusKey)}
        </p>

        {/* The data box — every state renders ONE of these, same width. */}
        <div className={cn(DATA_BOX, 'mt-2.5')}>
          {status.status === 'pendiente' ? (
            <PendienteBody
              holdExpiresAt={status.holdExpiresAt}
              serviceDisplay={view.serviceDisplay}
              dateValue={view.dateWithDuration}
            />
          ) : null}

          {status.status === 'confirmado' ? (
            <ConfirmadoBody
              serviceDisplay={view.serviceDisplay}
              turno={view.turno}
              duration={view.duration}
            />
          ) : null}

          {!view.isOpen ? (
            <ClosedBody
              heroLabel={view.hero.label}
              heroValue={view.hero.value}
              serviceDisplay={view.serviceDisplay}
              dateValue={view.turno}
            />
          ) : null}
        </div>

        {status.status === 'confirmado' ? <RemindersCard /> : null}

        {/* The closed states: the "fue un error" line + Reservar otra vez. */}
        {!view.isOpen ? (
          <>
            <p className="mt-2.5 text-[12.5px] leading-[1.55] text-muted">
              {view.lead}{' '}
              <strong className="font-semibold text-foreground">{t('errorLine')}</strong>
            </p>
            <Link
              href="/catalogo"
              className="mt-3 flex w-full items-center justify-center rounded-full bg-accent px-6 py-[13px] text-[13.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              {t('rebook')}
            </Link>
          </>
        ) : (
          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center rounded-full border border-hairline bg-surface px-6 py-3 text-[13px] font-semibold text-foreground backdrop-blur-lg transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('backHome')}
          </Link>
        )}
      </main>
    </div>
  );
}

export default async function EstadoPage({ params }: EstadoPageProps) {
  const { bookingId, locale } = await params;
  const status = await getBookingStatus(bookingId);

  if (!status.ok || !status.status) {
    return <EstadoNotFound />;
  }

  // Property narrowing holds for the accesses, not for the whole reference —
  // the narrowed values are re-assembled so EstadoFound gets a FoundBooking.
  return <EstadoFound status={{ ...status, ok: true, status: status.status }} locale={locale} />;
}

// Live per-request render: the estado is read from the DB on every visit
// (the badge must reflect the dueña's approval, whenever it happens).
export const dynamic = 'force-dynamic';
