'use client';

import { buildWhatsAppLink, formatCents } from '@khal/utils';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

export type DepositStatus = 'pending' | 'confirmed';

export interface PaymentInfo {
  alias: string;
  cvu: string;
  whatsappPhone: string;
  amountDueCents: number;
  totalCents: number;
  currencyCode: string;
  isDeposit: boolean;
  depositStatus: DepositStatus;
}

/**
 * T-F2.4 (board s04) — receipt copy row. Sharp hairline rows (D11); the
 * alias renders prominent, the CBU stays small; COPIAR is a typographic
 * action, not a boxed button.
 */
function CopyRow({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  const t = useTranslations('payment');
  const [copied, setCopied] = useState(false);

  // [KHAL-A1] A blank value must never render a copyable empty row.
  if (value.length === 0) {
    return null;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable in insecure contexts
    }
  }

  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-3">
      <div className="min-w-0">
        <p className="font-mono-khal text-[10px] uppercase tracking-[2px] text-faint">{label}</p>
        <p
          className={
            prominent
              ? 'truncate font-mono text-lg text-foreground'
              : 'truncate font-mono text-xs text-muted'
          }
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${t('copy')}: ${value}`}
        className="shrink-0 font-mono-khal text-[10px] uppercase tracking-[2px] text-accent-soft underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {copied ? t('copied') : t('copy')}
      </button>
      <span aria-live="polite" role="status" className="sr-only">
        {copied ? t('copied') : ''}
      </span>
    </div>
  );
}

/**
 * T-F2.4 — the seña RECEIPT (v2 comprobante screen, board s04): what the
 * clienta sees right after confirming. Receipt anatomy per the approved
 * board: kicker · honest PENDIENTE state (UC-002 v2) · monto ENORME ·
 * the D2 12h hold bar · alias COPIAR + CBU chico · CTA único WhatsApp ·
 * money-critical terms repeated (D1).
 *
 * The dormant MP checkout section (dead in every call path — no caller
 * ever passed bookingId+serviceId) is out of the receipt per the F2
 * dead-code precedent; the MP infrastructure (action, webhook, /pago
 * return pages) stays untouched per the owner rule.
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
  const remainder = formatCents(payment.totalCents - payment.amountDueCents, payment.currencyCode);

  // [KHAL-A1] Safe fallback: the transfer section (alias/CVU copy rows,
  // transfer instructions, WhatsApp receipt CTA) only renders when real
  // settings came from global_settings — never a dummy CVU to copy.
  const hasTransferDetails = payment.alias.length > 0 && payment.cvu.length > 0;

  return (
    <div className="space-y-6">
      {/* Kicker — the receipt opens like a ticket stub. */}
      <p className="font-mono-khal text-[11px] uppercase tracking-[2px] text-faint">
        {t('receiptTitle')}
      </p>

      {/* Honest state (UC-002 v2): PENDIENTE until the dueña validates. */}
      <div role="status">
        <p className="text-sm font-semibold text-foreground">
          {payment.depositStatus === 'pending'
            ? t('depositPendingTitle')
            : t('depositConfirmedTitle')}
        </p>
        {payment.depositStatus === 'pending' ? (
          <p className="mt-1 text-sm text-muted">
            {t('depositPendingBody', { amount: depositAmount })}
          </p>
        ) : null}
      </div>

      {/* Monto ENORME — the receipt hero amount (fits 390px via clamp). */}
      <div>
        <p className="font-mono-khal text-[10px] uppercase tracking-[2px] text-faint">
          {payment.isDeposit ? t('depositAmountLabel') : t('amountDue')}
        </p>
        <p className="mt-1 text-[clamp(2.75rem,14vw,4.5rem)] font-bold leading-none tracking-tight text-foreground">
          {depositAmount}
        </p>
        {payment.isDeposit ? (
          <p className="mt-2 text-xs text-muted">
            {t('totalLabel', { amount: formatCents(payment.totalCents, payment.currencyCode) })} ·{' '}
            {t('remainderAtStore', { amount: remainder })}
          </p>
        ) : null}
      </div>

      {/* D2 barra 12 h: the hold made visible at the commit moment. */}
      <div>
        <div aria-hidden="true" className="h-0.5 w-full bg-accent" />
        <p className="mt-2 font-mono-khal text-[10px] uppercase tracking-[2px] text-accent-soft">
          {t('holdBarLabel')}
        </p>
        <p className="mt-0.5 text-xs text-muted">{t('holdBarBody')}</p>
      </div>

      {/* Alias COPIAR (prominent) + CBU chico + instructions. */}
      {hasTransferDetails ? (
        <div>
          <CopyRow label={t('alias')} value={payment.alias} prominent />
          <CopyRow label={t('cvu')} value={payment.cvu} />
          <p className="mt-3 text-sm text-muted">{t('instructions', { amount: depositAmount })}</p>
        </div>
      ) : null}

      {/* D1: the money-critical terms come back on the comprobante screen. */}
      {payment.isDeposit ? (
        <div className="border-t border-hairline pt-3">
          <p className="text-xs text-muted">· {t('termsNonRefundable')}</p>
          <p className="text-xs text-muted">· {t('termsReschedule')}</p>
        </div>
      ) : null}

      {/* CTA único — send the comprobante to the dueña. */}
      {payment.whatsappPhone.length > 0 ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="block w-full bg-accent px-6 py-3 text-center text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
        >
          {t('sendComprobante')}
        </a>
      ) : null}

      {/* T-F2.5 — the door to the revisitable estado (board s05): the
          clienta can come back any time to see the live state of her turn. */}
      {bookingId ? (
        <Link
          href={`/${locale}/estado/${bookingId}`}
          className="block text-center font-mono-khal text-[10px] uppercase tracking-[2px] text-faint underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {tEstado('receiptLink')}
        </Link>
      ) : null}
    </div>
  );
}
