// G3 — /pago return pages. Presentational component for the three Mercado Pago
// back_url targets (exito / pendiente / error). All copy arrives as props
// (translated in the server pages), so the render is locale-agnostic and the
// WhatsApp CTA disappears entirely when no phone is configured (fail-soft —
// same doctrine as the manual transfer section in payment-step, KHAL-A1).

export type PagoStatus = 'exito' | 'pendiente' | 'error';

export interface PagoResultProps {
  status: PagoStatus;
  title: string;
  body: string;
  /** Pre-formatted "Pago N.º {id}" line; null when no id survived sanitization. */
  paymentLine: string | null;
  backToCatalogLabel: string;
  backToCatalogHref: string;
  /** Null when no WhatsApp phone is configured: the CTA must not render broken. */
  whatsappLabel: string | null;
  whatsappHref: string | null;
}

const STATUS_ACCENT: Record<PagoStatus, { card: string; title: string; body: string }> = {
  exito: {
    card: 'border-emerald-400/30 bg-emerald-400/10',
    title: 'text-emerald-300',
    body: 'text-emerald-200/90',
  },
  pendiente: {
    card: 'border-amber-400/30 bg-amber-400/10',
    title: 'text-amber-300',
    body: 'text-amber-200/90',
  },
  error: {
    card: 'border-red-400/30 bg-red-400/10',
    title: 'text-red-300',
    body: 'text-red-200/90',
  },
};

export function PagoResult({
  status,
  title,
  body,
  paymentLine,
  backToCatalogLabel,
  backToCatalogHref,
  whatsappLabel,
  whatsappHref,
}: PagoResultProps) {
  const accent = STATUS_ACCENT[status];

  return (
    <div className="space-y-4">
      <div role="status" className={`rounded-2xl border p-5 backdrop-blur-sm ${accent.card}`}>
        <h1 className={`text-xl font-semibold tracking-tight ${accent.title}`}>{title}</h1>
        <p className={`mt-2 text-sm leading-relaxed ${accent.body}`}>{body}</p>
        {paymentLine ? <p className="mt-3 font-mono text-sm text-zinc-100">{paymentLine}</p> : null}
      </div>

      <a
        href={backToCatalogHref}
        className="block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:bg-emerald-800"
      >
        {backToCatalogLabel}
      </a>

      {whatsappHref && whatsappLabel ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-full border border-white/20 px-6 py-3 text-center text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:bg-white/20"
        >
          {whatsappLabel}
        </a>
      ) : null}
    </div>
  );
}
