import { HoldCountdown } from '@/components/booking/hold-countdown';
import { Header } from '@/components/shared/header';
import { getBookingStatus } from '@/lib/actions/booking-status';
import { getTranslations } from 'next-intl/server';

/**
 * T-F2.5 — confirmación/estado (board s05): the revisitable state of a
 * booking. The clienta reaches it from the seña receipt ("ver estado de mi
 * turno") holding her UUID — the 0015 capability door answers with the
 * public-safe status only. Honest state machine per D4/UC-002 v2:
 * pendiente (with the live 12h countdown + the 3 steps of "qué pasa ahora")
 * → confirmada / liberada.
 */
type EstadoPageProps = {
  params: Promise<{ bookingId: string; locale: string }>;
};

export default async function EstadoPage({ params }: EstadoPageProps) {
  const { bookingId, locale } = await params;
  const t = await getTranslations('estado');

  const status = await getBookingStatus(bookingId);

  // Not-found state rendered inline: the page exists, the turno does not.
  if (!status.ok || !status.status) {
    return (
      <div className="relative min-h-dvh">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-6">
          <p className="font-mono-khal text-[11px] uppercase tracking-[2px] text-faint">
            {t('title')}
          </p>
          <p className="mt-3 text-sm text-muted">{t('notFound')}</p>
        </main>
      </div>
    );
  }

  const scheduledAt = status.scheduledAt
    ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(status.scheduledAt))
    : null;

  const steps = [t('step1'), t('step2'), t('step3')];

  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-6">
        <p className="font-mono-khal text-[11px] uppercase tracking-[2px] text-faint">
          {t('title')}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {status.serviceName ?? ''}
        </h1>
        {scheduledAt ? <p className="mt-1 text-sm text-muted">{scheduledAt}</p> : null}

        {/* Badge tipográfico (D11 — sin chip en caja). El color del estado
            queda en manos del mono-label: pendiente en acento suave. */}
        <p className="mt-4 font-mono-khal text-[11px] uppercase tracking-[2px] text-accent-soft">
          {t(status.status)}
        </p>

        {status.status === 'pendiente' ? (
          <>
            {status.holdExpiresAt ? (
              <div className="mt-4">
                <HoldCountdown holdExpiresAt={status.holdExpiresAt} />
              </div>
            ) : null}

            {/* Los 3 pasos de "qué pasa ahora" (board s05). */}
            <div className="mt-8">
              <p className="font-mono-khal text-[10px] uppercase tracking-[2px] text-faint">
                {t('stepsTitle')}
              </p>
              <ol className="mt-2">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 border-b border-hairline py-2.5 text-sm text-muted"
                  >
                    <span className="font-mono-khal text-accent-soft">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}

        {status.status === 'confirmado' ? (
          <p className="mt-4 text-sm text-muted">{t('confirmedBody')}</p>
        ) : null}

        {status.status === 'cancelado' || status.status === 'no_asistio' ? (
          <p className="mt-4 text-sm text-muted">{t('releasedBody')}</p>
        ) : null}
      </main>
    </div>
  );
}

// Live per-request render: the estado is read from the DB on every visit
// (the badge must reflect the dueña's approval, whenever it happens).
export const dynamic = 'force-dynamic';
