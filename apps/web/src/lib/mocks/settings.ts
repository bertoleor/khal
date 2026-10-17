// SUPERSEDED by global_settings reads (KHAL-A1 / t_f3bec8b8, migration 0008):
// the booking flow now reads the store's real alias/CVU/whatsapp from
// `global_settings` via lib/actions/settings.ts — this constant must NOT be
// imported anywhere (contract-tested). Kept only as the fidelity reference
// for supabase/seed.sql §6 (same precedent as lib/mocks/services.ts after
// the ORN-80 catalog swap 9fc6905).
export const storePaymentSettings = {
  alias: 'khal.estudio',
  cvu: '0000003100000000000001',
  whatsappPhone: '5491100000000',
};

export const storeSocialSettings = {
  instagramUrl: 'https://www.instagram.com/khal.estudiook/',
  instagramHandle: '@khal.estudiook',
};
