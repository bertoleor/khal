import { z } from 'zod';

// G3 — query params that Mercado Pago appends to the back_url after Checkout Pro
// (payment_id, external_reference, collection_id, status, …). Only well-formed
// values may reach the UI: payment ids are digits-only (MP ids are numeric),
// external_reference is the booking uuid we set when creating the preference.
// Everything else is dropped (fail-soft: the page renders fine without them).

const singleValue = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value[0] : value));

const paymentIdSchema = z
  .string()
  .trim()
  .regex(/^\d{1,15}$/, 'payment id must be 1-15 digits');

const externalReferenceSchema = z.uuid();

export interface PagoSearchParams {
  paymentId: string | null;
  externalReference: string | null;
}

/**
 * Sanitizes the MP back_url query params for the /pago return pages.
 * Never throws: malformed or absent params resolve to null.
 */
export function parsePagoSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): PagoSearchParams {
  const raw = z.object({
    payment_id: singleValue.optional(),
    collection_id: singleValue.optional(),
    external_reference: singleValue.optional(),
  });

  const parsed = raw.safeParse(searchParams);
  if (!parsed.success) {
    return { paymentId: null, externalReference: null };
  }

  const paymentCandidate = parsed.data.payment_id ?? parsed.data.collection_id;
  const paymentId = paymentIdSchema.safeParse(paymentCandidate ?? '');
  const externalReference = externalReferenceSchema.safeParse(parsed.data.external_reference ?? '');

  return {
    paymentId: paymentId.success ? paymentId.data : null,
    externalReference: externalReference.success ? externalReference.data : null,
  };
}
