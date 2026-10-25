'use client';

import { useHydrated } from '@/lib/use-hydrated';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

/**
 * T-F2.5 — the live 12h hold countdown (D2). React 19 canonical shape:
 * useSyncExternalStore over a 30s interval (no effect-body setState — the
 * repo lint rejects it, the 3422052 lesson) + the useHydrated gate so the
 * hydration render is identical to SSR (Date.now() differs server/client).
 *
 * 30s granularity: the display is minutes-level, so a ticking timer per
 * half-minute is plenty for a phone.
 */
const THIRTY_SECONDS = 30_000;

function subscribe(onStoreChange: () => void): () => void {
  const id = setInterval(onStoreChange, THIRTY_SECONDS);
  return () => clearInterval(id);
}

export function HoldCountdown({ holdExpiresAt }: { holdExpiresAt: string }) {
  const t = useTranslations('estado');
  const mounted = useHydrated();
  const deadline = new Date(holdExpiresAt).getTime();

  const remainingMs = useSyncExternalStore(
    subscribe,
    () => Math.max(0, deadline - Date.now()),
    () => Number.MAX_SAFE_INTEGER
  );

  // Pre-hydration (and for a malformed deadline): the static label carries
  // the 12h rule without a ticking value — deterministic on server AND on
  // the hydration render.
  if (!mounted || Number.isNaN(deadline)) {
    return (
      <div>
        <div aria-hidden="true" className="h-0.5 w-full bg-accent" />
        <p className="mt-2 font-mono-khal text-[10px] uppercase tracking-[2px] text-accent-soft">
          {t('holdLabel', { remaining: '—' })}
        </p>
      </div>
    );
  }

  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.ceil((remainingMs % 3_600_000) / 60_000);
  const expired = remainingMs === 0;
  const remaining = expired ? t('holdExpired') : `${hours} h ${minutes} min`;

  return (
    <div>
      <div aria-hidden="true" className="h-0.5 w-full bg-accent" />
      <p className="mt-2 font-mono-khal text-[10px] uppercase tracking-[2px] text-accent-soft">
        {t('holdLabel', { remaining })}
      </p>
      {expired ? <p className="mt-0.5 text-xs text-muted">{t('holdExpiredBody')}</p> : null}
    </div>
  );
}
