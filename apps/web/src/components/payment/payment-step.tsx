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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate font-mono text-sm text-slate-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        className="shrink-0 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 active:bg-slate-100"
      >
        {copied ? t('copied') : t('copy')}
      </button>
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
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">{t('depositPendingTitle')}</p>
          <p className="mt-1 text-sm text-amber-700">
            {t('depositPendingBody', { amount: depositAmount })}
          </p>
        </div>
      ) : (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">{t('depositConfirmedTitle')}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 p-5 text-center">
        <p className="text-sm text-slate-500">
          {payment.isDeposit ? t('depositAmountLabel') : t('amountDue')}
        </p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{depositAmount}</p>
        {payment.isDeposit ? (
          <>
            <p className="mt-2 text-xs text-slate-500">
              {t('totalLabel', { amount: formatCents(payment.totalCents, payment.currencyCode) })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t('remainderAtStore', { amount: remainder })}
            </p>
          </>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">{t('transferTo')}</p>
        <CopyRow label={t('alias')} value={payment.alias} />
        <CopyRow label={t('cvu')} value={payment.cvu} />
      </div>

      <p className="text-sm text-slate-600">{t('instructions', { amount: depositAmount })}</p>

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:bg-emerald-800"
      >
        {t('sendComprobante')}
      </a>
    </div>
  );
}
