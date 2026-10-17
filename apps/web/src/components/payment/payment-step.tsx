'use client';

import { buildWhatsAppLink, formatCents } from '@khal/utils';
import { useLocale, useTranslations } from 'next-intl';
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

function CopyRow({ label, value }: { label: string; value: string }) {
  const t = useTranslations('payment');
  const [copied, setCopied] = useState(false);

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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="truncate font-mono text-sm text-zinc-100">{value}</p>
      </div>
      <span role="status" className="sr-only">
        {copied ? `${t('copied')}: ${value}` : ''}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${t('copy')}: ${value}`}
        className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:bg-white/20"
      >
        {copied ? t('copied') : t('copy')}
      </button>
      <span aria-live="polite" role="status" className="sr-only">
        {copied ? t('copied') : ''}
      </span>
    </div>
  );
}


export function PaymentStep({
  payment,
  serviceName,
  date,
  slot,
  bookingId,
  serviceId,
}: {
  payment: PaymentInfo;
  serviceName: string;
  date: string;
  slot: string;
  bookingId?: string;
  serviceId?: string;
}) {
  const t = useTranslations('payment');
  const locale = useLocale();
  const message = t('whatsappMessage', { service: serviceName, date, slot });
  const link = buildWhatsAppLink(payment.whatsappPhone, message);
  const depositAmount = formatCents(payment.amountDueCents, payment.currencyCode);
  const remainder = formatCents(payment.totalCents - payment.amountDueCents, payment.currencyCode);

  // Refill suggestion: booking date + 21 days. Fail-soft on non-ISO dates —
  // the note is dropped rather than crashing the payment screen.
  const refillMs = new Date(`${date}T12:00:00`).getTime();
  const refillDate = Number.isNaN(refillMs)
    ? null
    : new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(refillMs + 21 * 24 * 60 * 60 * 1000));

  // [KHAL-A1] Safe fallback: the transfer section (alias/CVU copy rows,
  // transfer instructions, WhatsApp receipt CTA) only renders when real
  // settings came from global_settings. Without them the customer sees the
  // booking confirmation + online payment — never a dummy CVU to copy.
  const hasTransferDetails = payment.alias.length > 0 && payment.cvu.length > 0;
  const [payerEmail, setPayerEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handlePayOnline() {
    if (!bookingId || !serviceId || isRedirecting) {
      return;
    }
    setCheckoutError(null);
    setIsRedirecting(true);
    try {
      const result = await createCheckoutPreference(bookingId, serviceId, payerEmail.trim());
      if (result.ok && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setCheckoutError(t('checkoutError'));
    } catch {
      setCheckoutError(t('checkoutError'));
    } finally {
      setIsRedirecting(false);
    }
  }

  return (
    <div className="space-y-4">
      {payment.depositStatus === 'pending' ? (
        <div role="status" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm font-semibold text-amber-300">{t('depositPendingTitle')}</p>
          <p className="mt-1 text-sm text-amber-200/90">{t('depositPendingBody', { amount: depositAmount })}</p>
        </div>
      ) : (
        <div
          role="status"
          className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4"
        >
          <p className="text-sm font-semibold text-emerald-300">{t('depositConfirmedTitle')}</p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-sm">
        <p className="text-sm text-zinc-400">
          {payment.isDeposit ? t('depositAmountLabel') : t('amountDue')}
        </p>
        <p className="mt-1 text-3xl font-bold text-white">{depositAmount}</p>
        {payment.isDeposit ? (
          <>
            <p className="mt-2 text-xs text-zinc-500">
              {t('totalLabel', { amount: formatCents(payment.totalCents, payment.currencyCode) })}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {t('remainderAtStore', { amount: remainder })}
            </p>
          </>
        ) : null}
      </div>

      {refillDate ? (
        <div role="note" className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <p className="text-sm text-emerald-200/90">
            {t('refillSuggestion', { date: refillDate })}
          </p>
        </div>
      ) : null}

      {hasTransferDetails ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">{t('transferTo')}</p>
          <CopyRow label={t('alias')} value={payment.alias} />
          <CopyRow label={t('cvu')} value={payment.cvu} />
        </div>
      ) : null}

      {hasTransferDetails ? (
        <p className="text-sm text-slate-600">{t('instructions', { amount: depositAmount })}</p>
      ) : null}

      {bookingId && serviceId ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
          <label htmlFor="mp-payer-email" className="text-sm font-semibold text-slate-700">
            {t('payOnlineTitle')}
          </label>
          <input
            id="mp-payer-email"
            type="email"
            autoComplete="email"
            value={payerEmail}
            onChange={(event) => setPayerEmail(event.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:offset-2 focus-visible:outline-slate-500"
          />
          <button
            type="button"
            onClick={handlePayOnline}
            disabled={isRedirecting || payerEmail.trim().length === 0}
            className="w-full rounded-full bg-sky-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRedirecting ? t('redirecting') : t('payOnline')}
          </button>
          {checkoutError ? (
            <p role="alert" className="text-sm text-red-600">
              {checkoutError}
            </p>
          ) : null}
        </div>
      ) : null}

      {payment.whatsappPhone.length > 0 ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:bg-emerald-800"
        >
          {t('sendComprobante')}
        </a>
      ) : null}
    </div>
  );
}
