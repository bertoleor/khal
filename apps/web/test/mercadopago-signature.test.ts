import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { verifyMercadoPagoSignature } from '@/lib/mercadopago';

// Unit tests for the MP webhook signature gate (KHAL-F4 WEBHOOKS-01 layer 3).
// Manifest (per MP docs): `id:{data.id};request-id:{x-request-id};ts:{ts};`
// signed with MP_WEBHOOK_SECRET; `v1` compared in constant time.
// Docs: mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/payment-notifications

const SECRET = 'test-webhook-secret';
const DATA_ID = '1234567890';
const REQUEST_ID = 'bb56a2f1-6aae-46ac-982e-9dcd3581d08e';
const TS = '1742505638683';

function sign(manifest: string, secret = SECRET): string {
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

function validHeaders(overrides?: { manifest?: string }): { signature: string; requestId: string } {
  const manifest = overrides?.manifest ?? `id:${DATA_ID};request-id:${REQUEST_ID};ts:${TS};`;
  return {
    signature: `ts=${TS},v1=${sign(manifest)}`,
    requestId: REQUEST_ID,
  };
}

describe('verifyMercadoPagoSignature', () => {
  it('acepta una firma válida sobre el manifest completo', () => {
    const { signature, requestId } = validHeaders();
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        signatureHeader: signature,
        requestIdHeader: requestId,
        dataId: DATA_ID,
      })
    ).toBe(true);
  });

  it('rechaza firma inválida → nunca true con v1 corrupto', () => {
    const { requestId } = validHeaders();
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        signatureHeader: `ts=${TS},v1=${'a'.repeat(64)}`,
        requestIdHeader: requestId,
        dataId: DATA_ID,
      })
    ).toBe(false);
  });

  it('rechaza cuando el secret no coincide (atacante no puede firmar)', () => {
    const { signature, requestId } = validHeaders();
    expect(
      verifyMercadoPagoSignature({
        secret: 'wrong-secret',
        signatureHeader: signature,
        requestIdHeader: requestId,
        dataId: DATA_ID,
      })
    ).toBe(false);
  });

  it('rechaza manifest con data.id distinto (replay cross-evento)', () => {
    // Firma valida para OTRO data.id — no debe validar para este.
    const { requestId } = validHeaders();
    const signature = `ts=${TS},v1=${sign(`id:999999;request-id:${REQUEST_ID};ts:${TS};`)}`;
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        signatureHeader: signature,
        requestIdHeader: requestId,
        dataId: DATA_ID,
      })
    ).toBe(false);
  });

  it('manifiesto corto sin x-request-id: acepta manifest omitiendo el par (doc MP)', () => {
    // MP doc: omit pairs whose values are not present in the request.
    const shortManifest = `id:${DATA_ID};ts:${TS};`;
    const signatureHeader = `ts=${TS},v1=${sign(shortManifest)}`;
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        signatureHeader,
        requestIdHeader: null,
        dataId: DATA_ID,
      })
    ).toBe(true);
  });

  it('header x-signature ausente o malformado → false', () => {
    expect(
      verifyMercadoPagoSignatureSafe({
        secret: SECRET,
        signatureHeader: null,
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      })
    ).toBe(false);
    expect(
      verifyMercadoPagoSignatureSafe({
        secret: SECRET,
        signatureHeader: 'garbage-no-pairs',
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      })
    ).toBe(false);
    expect(
      verifyMercadoPagoSignatureSafe({
        secret: SECRET,
        signatureHeader: 'ts=1', // v1 missing
        requestIdHeader: REQUEST_ID,
        dataId: DATA_ID,
      })
    ).toBe(false);
  });
});

// Helper: la función real — los tres casos del último test usan la misma puerta.
function verifyMercadoPagoSignatureSafe(input: Parameters<typeof verifyMercadoPagoSignature>[0]) {
  return verifyMercadoPagoSignature(input);
}
