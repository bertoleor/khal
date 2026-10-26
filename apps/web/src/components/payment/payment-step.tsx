'use client';

import { buildWhatsAppLink, formatCents, formatCompactDay, formatDurationLabel } from '@khal/utils';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

export interface PaymentInfo {
  alias: string;
  cvu: string;
  whatsappPhone: string;
  /** The seña — fixed per service (S7), NEVER recalculated with add-ons. */
  amountDueCents: number;
  currencyCode: string;
  isDeposit: boolean;
  /** For the Fecha row: "mar 3 · 11:00 · 1 h" (S8). */
  durationMinutes: number;
}

/** The 1.4s "✓ copiado" window (S9, approved preview cp() behavior). */
const COPIED_RESET_MS = 1400;

/**
 * S9 clipboard: the async Clipboard API first, execCommand fallback for
 * insecure contexts / older Safari. Returns whether the value made it.
 */
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    // Programmatic DOM (not JSX styling): the offscreen position is part of
    // the select() copy trick and cannot live in a stylesheet.
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/** Precomputed copy-button states (S9): 22px glass square, 7px radius. */
const COPY_BUTTON_BASE =
  'ml-2.5 flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const COPY_BUTTON_IDLE = `${COPY_BUTTON_BASE} border-hairline bg-surface text-muted hover:bg-surface-hover`;
const COPY_BUTTON_DONE = `${COPY_BUTTON_BASE} border-accent bg-accent text-accent-contrast`;

/**
 * S9 — the recibo's copy row: label + value + the copy square beside it.
 * The copied state ("✓ copiado") is announced by a dedicated sr-only live
 * region (H4: never aria-live on the mutating button itself) and the glyph
 * swaps ⧉ → ✓ for 1.4s.
 */
function CopyRow({ label, value }: { label: string; value: string }) {
  const t = useTranslations('payment');
  const [copied, setCopied] = useState(false);

  // [KHAL-A1] A blank value must never render a copyable empty row.
  if (value.length === 0) {
    return null;
  }

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline px-3.5 py-2.5 last:border-b-0">
      <p className="shrink-0 text-xs text-muted">{label}</p>
      <span className="flex min-w-0 items-center">
        <span className="truncate font-mono-khal text-xs font-semibold text-foreground">
          {value}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`${t('copy')}: ${value}`}
          className={copied ? COPY_BUTTON_DONE : COPY_BUTTON_IDLE}
        >
          {copied ? '✓' : '⧉'}
        </button>
      </span>
      <span aria-live="polite" role="status" className="sr-only">
        {copied ? t('copied') : ''}
      </span>
    </div>
  );
}

/**
 * S9 — the recibo (v7, approved preview §5): "Tu turno está reservado" —
 * no ✓ in the title — then ONE glass card: servicio (with its add-ons,
 * "Lifting + perfilado"), fecha, the seña big in mono, and the alias +
 * CBU/CVU rows each with a copy square beside them. NO "resto al llegar"
 * (the dueña called it redundant) and NO hold bar: the 12h mechanic is
 * never visible to the clienta — the reservar flow already said it
 * delicately ("te guardamos el turno mientras confirmás la seña").
 *
 * [KHAL-A1] The transfer rows only render when real settings came from
 * global_settings — never a dummy CVU to copy.
 */
export function PaymentStep({
  payment,
  serviceName,
  date,
  slot,
  bookingId,
}: {
  payment: PaymentInfo;
  serviceName: string;
  date: string;
  slot: string;
  bookingId?: string;
}) {
  const t = useTranslations('payment');
  const tEstado = useTranslations('estado');
  const locale = useLocale();
  const message = t('whatsappMessage', { service: serviceName, date, slot });
  const link = buildWhatsAppLink(payment.whatsappPhone, message);
  const depositAmount = formatCents(payment.amountDueCents, payment.currencyCode);
  // Local-noon parse so the weekday/day never drift across timezones.
  const scheduled = new Date(`${date}T12:00:00`);
  const dateRow = `${formatCompactDay(scheduled, locale)} · ${slot} · ${formatDurationLabel(payment.durationMinutes)}`;

  const hasTransferDetails = payment.alias.length > 0 && payment.cvu.length > 0;

  return (
    <div>
      <h1 className="mt-6 text-[18px] font-bold tracking-[-0.02em] text-foreground">
        {t('reservedTitle')}
      </h1>

      <div className="mt-3.5 rounded-lg border border-hairline bg-surface backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)]">
        <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2.5 text-xs">
          <span className="text-muted">{t('serviceRow')}</span>
          <span className="font-semibold text-foreground">{serviceName}</span>
        </div>
        <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2.5 text-xs">
          <span className="text-muted">{t('dateRow')}</span>
          <span className="font-semibold text-foreground">{dateRow}</span>
        </div>

        {payment.isDeposit ? (
          <div className="border-b border-hairline px-3.5 pb-[3px] pt-[13px]">
            <p className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
              {t('depositAmountLabel')}
            </p>
            <p className="mt-1.5 font-mono-khal text-[28px] font-bold leading-none tracking-[-1px] tabular-nums text-foreground">
              {depositAmount}
            </p>
          </div>
        ) : null}

        {hasTransferDetails ? (
          <>
            <CopyRow label={t('alias')} value={payment.alias} />
            <CopyRow label={t('cvu')} value={payment.cvu} />
          </>
        ) : null}
      </div>

      {/* CTA único — send the comprobante to the dueña (solid pill, S12). */}
      {payment.whatsappPhone.length > 0 ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center rounded-full bg-accent px-6 py-[13px] text-[13.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
        >
          {t('sendComprobante')}
        </a>
      ) : null}

      {/* T-F2.5 — the door to the revisitable estado: the clienta can come
          back any time to see the live state of her turn. */}
      {bookingId ? (
        <Link
          href={`/${locale}/estado/${bookingId}`}
          className="mt-3 block text-center font-mono-khal text-[10px] uppercase tracking-[2px] text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {tEstado('receiptLink')}
          <span aria-hidden="true" className="pl-1">
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}
