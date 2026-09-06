"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buildWhatsAppLink, formatCents } from "@khal/utils";

export interface PaymentInfo {
  alias: string;
  cvu: string;
  whatsappPhone: string;
  amountDueCents: number;
  totalCents: number;
  currencyCode: string;
  isDeposit: boolean;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const t = useTranslations("payment");
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
        className="shrink-0 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700"
      >
        {copied ? t("copied") : t("copy")}
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
  const t = useTranslations("payment");
  const message = t("whatsappMessage", { service: serviceName, date, slot });
  const link = buildWhatsAppLink(payment.whatsappPhone, message);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 p-5 text-center">
        <p className="text-sm text-slate-500">{t("amountDue")}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">
          {formatCents(payment.amountDueCents, payment.currencyCode)}
        </p>
        {payment.isDeposit ? (
          <p className="mt-2 text-xs text-slate-500">
            {t("remainderAtStore", {
              amount: formatCents(
                payment.totalCents - payment.amountDueCents,
                payment.currencyCode,
              ),
            })}
          </p>
        ) : null}
      </div>

      <CopyRow label={t("alias")} value={payment.alias} />
      <CopyRow label={t("cvu")} value={payment.cvu} />

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-medium text-white"
      >
        {t("sendComprobante")}
      </a>
    </div>
  );
}