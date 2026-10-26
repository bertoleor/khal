'use client';

import { useHydrated } from '@/lib/use-hydrated';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

/**
 * S10 — the pendiente data-box hero: "tiempo para confirmar" over a live
 * HH:MM:SS clock (approved preview §5: 11:42:05). React 19 canonical shape:
 * useSyncExternalStore over a 1s interval (no effect-body setState — the
 * 3422052 lesson) + the useHydrated gate so the hydration render is
 * identical to SSR (Date.now() differs server/client).
 *
 * What the clock DOESN'T say matters as much: no "12 h", no "reservado
 * por" — the hold mechanic is never visible to the clienta (S6).
 */
const ONE_SECOND = 1_000;

function subscribe(onStoreChange: () => void): () => void {
  const id = setInterval(onStoreChange, ONE_SECOND);
  return () => clearInterval(id);
}

function formatClock(remainingMs: number): string {
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

  // Pre-hydration (and for a malformed deadline): a static placeholder —
  // deterministic on server AND on the hydration render.
  const clock = !mounted || Number.isNaN(deadline) ? '--:--:--' : formatClock(remainingMs);

  return (
    <div className="border-b border-hairline px-3.5 pb-[3px] pt-[13px]">
      <p className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
        {t('countdownLabel')}
      </p>
      <p
        aria-hidden="true"
        className="mt-1.5 font-mono-khal text-[22px] font-bold leading-none tracking-[-1px] tabular-nums text-foreground"
      >
        {clock}
      </p>
      <span className="sr-only">{clock}</span>
    </div>
  );
}
