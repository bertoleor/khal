# ADR-0002 — Payment flow: dual (Mercado Pago checkout + manual transfer)
> Parte de: [[projects/khal/README|README]] · Relacionados: [[ADR-0001]] · [[06-estado-gates]] · [[03-funciones]]

- Status: accepted (recorded 2026-10-15; decision effectively taken in code earlier).
- Context: gate G3 (P0) required la dueña to choose between MP checkout and
  manual-only. `payment-step.tsx` implements BOTH: MP checkout AND the manual
  flow with alias/CVU copy rows + WhatsApp link, alongside `/pago/exito|error|pendiente` routes.
- Decision: keep **dual flow** — MP checkout as the automated path, manual
  transfer (alias/CVU + WhatsApp) as the always-available official path.
  Not manual-only, not MP-only.
- Consequences: no single-provider lock-in; the dueña can operate while MP
  credentials are provisioned. UNVERIFIED live: `MP_ACCESS_TOKEN` /
  `MP_WEBHOOK_SECRET` are not yet verified against production; the manual flow
  needs operational follow-up (confirming transfers by hand) — owner decides
  if/when MP goes live to retire that manual burden.
