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

type StatusAccent = { card: string; title: string; body: string };

/**
 * Per-status accent classes — exhaustive switch over PagoStatus
 * (compile-checked named access, no dynamic key indexing).
 * v7 B/W system: exito carries no semantic green (the accent IS the ink);
 * pendiente/error keep the semantic tokens (status-pending / danger).
 */
function statusAccent(status: PagoStatus): StatusAccent {
  switch (status) {
    case 'exito':
      return {
        card: 'border-hairline bg-surface',
        title: 'text-foreground',
        body: 'text-muted',
      };
    case 'pendiente':
      return {
        card: 'border-pending/30 bg-pending/10',
        title: 'text-pending',
        body: 'text-pending/90',
      };
    case 'error':
      return {
        card: 'border-danger/30 bg-danger/10',
        title: 'text-danger',
        body: 'text-danger/90',
      };
  }
}

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
  const accent = statusAccent(status);

  return (
    <div className="space-y-4">
      <div
        role="status"
        className={`rounded-lg border p-5 backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] ${accent.card}`}
      >
        <h1 className={`text-xl font-semibold tracking-tight ${accent.title}`}>{title}</h1>
        <p className={`mt-2 text-sm leading-relaxed ${accent.body}`}>{body}</p>
        {paymentLine ? (
          <p className="mt-3 font-mono-khal text-sm text-foreground">{paymentLine}</p>
        ) : null}
      </div>

      <a
        href={backToCatalogHref}
        className="block w-full rounded-full bg-accent px-6 py-[13px] text-center text-[13.5px] font-semibold text-accent-contrast transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {backToCatalogLabel}
      </a>

      {whatsappHref && whatsappLabel ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-full border border-hairline bg-surface px-6 py-[13px] text-center text-[13.5px] font-semibold text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {whatsappLabel}
        </a>
      ) : null}
    </div>
  );
}
