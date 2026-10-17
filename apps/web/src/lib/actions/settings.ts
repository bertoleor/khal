'use server';

import { createBookingSupabaseClient, readBookingSupabaseEnv } from '@/lib/supabase/booking-client';
import { z } from 'zod';

// [KHAL-A1 / t_f3bec8b8] Server-only store payment settings, straight from
// `global_settings` — the admin-editable source of truth seeded 2026-09-28
// (supabase/seed.sql §6). Migration 0008 opens the anon read surface:
// a SELECT policy scoped to the three storefront payment keys, soft-delete
// aware. The hardcoded mock constant (lib/mocks/settings.ts) is dead — a
// production customer must never be copy a dummy CVU again.
//
// Fail-soft mirrors catalog.ts/booking.ts: when Supabase env is missing
// (local dev) or the query errors, the result is null — never a throw and
// never dummy data. The payment step hides the transfer section when the
// settings are absent (safe fallback: no copyable fake CVU).

/** The exact setting_key set migration 0008 allows anon to read. */
const PAYMENT_SETTING_KEYS = ['payment_alias', 'payment_cvu', 'payment_whatsapp_phone'] as const;

export interface PaymentSettings {
  alias: string;
  cvu: string;
  whatsappPhone: string;
}

// All-or-nothing: a store missing its WhatsApp number is misconfigured, not
// "half configured" — a partial payment card is worse than none.
const valueSchemas = {
  alias: z
    .string()
    .trim()
    .min(3, 'Invalid alias')
    .max(60, 'Invalid alias')
    .regex(/^[0-9a-zA-Z.-]+$/, 'Invalid alias format'),
  cvu: z
    .string()
    .trim()
    .regex(/^\d{22}$/, 'CVU/CBU must be 22 digits'),
  whatsappPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, 'Invalid phone format'),
} as const;

/**
 * Reads the store's payment settings (alias / CVU / WhatsApp) from
 * `global_settings` through the anon client. Returns null when anything is
 * missing, invalid or soft-deleted — the caller renders no transfer details
 * rather than fake ones.
 */
export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const env = readBookingSupabaseEnv();
  if (!env) {
    return null;
  }

  const client = createBookingSupabaseClient(env);
  const { data, error } = await client
    .from('global_settings')
    .select('setting_key, value')
    .in('setting_key', [...PAYMENT_SETTING_KEYS])
    .is('deleted_at', null);

  if (error || !data) {
    return null;
  }

  const byKey = new Map<string, unknown>();
  for (const row of data) {
    byKey.set(row.setting_key, (row as { value?: unknown }).value ?? null);
  }

  // All three keys must be present with a valid, non-null string value.
  // jsonb NULL arrives as null — checked here (delete-if-null lives at the
  // map level: a missing key and a null value are the same failure).
  const alias = byKey.get('payment_alias');
  const cvu = byKey.get('payment_cvu');
  const whatsappPhone = byKey.get('payment_whatsapp_phone');
  if (alias === undefined || cvu === undefined || whatsappPhone === undefined) {
    return null;
  }

  const parsedAlias = valueSchemas.alias.safeParse(alias);
  const parsedCvu = valueSchemas.cvu.safeParse(cvu);
  const parsedPhone = valueSchemas.whatsappPhone.safeParse(whatsappPhone);
  if (!parsedAlias.success || !parsedCvu.success || !parsedPhone.success) {
    return null;
  }

  return {
    alias: parsedAlias.data,
    cvu: parsedCvu.data,
    whatsappPhone: parsedPhone.data,
  };
}
