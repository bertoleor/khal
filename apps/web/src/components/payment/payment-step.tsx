'use client';

import { buildWhatsAppLink, formatCents } from '@khal/utils';
import { useTranslations } from 'next-intl';
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
}: {
  payment: PaymentInfo;
  serviceName: string;
  date: string;
  slot: string;
}) {
  const t = useTranslations('payment');
  const message = t('whatsappMessage', { service: serviceName, date, slot });
  const link = buildWhatsAppLink(payment.whatsappPhone, message);
  const depositAmount = formatCents(payment.amountDueCents, payment.currencyCode);
  const remainder = formatCents(payment.totalCents - payment.amountDueCents, payment.currencyCode);

  return (
    <div className="space-y-4">
      {payment.depositStatus === 'pending' ? (
        <div role="status" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm font-semibold text-amber-300">{t('depositPendingTitle')}</p>
          <p className="mt-1 text-sm text-amber-200/90">
            {t('depositPendingBody', { amount: depositAmount })}
          </p>
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

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-300">{t('transferTo')}</p>
        <CopyRow label={t('alias')} value={payment.alias} />
        <CopyRow label={t('cvu')} value={payment.cvu} />
      </div>

      <p className="text-sm text-zinc-400">{t('instructions', { amount: depositAmount })}</p>

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="block w-full rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:scale-[0.98]"
      >
        {t('sendComprobante')}
      </a>
    </div>
  );
}
