import type { BookingAddonId } from '@khal/validations';

/**
 * S6 — the curated add-on module's message keys (the "addons" i18n
 * namespace). Labels live in the dictionary so es/en stay exact; the price
 * never does — it lives in BOOKING_ADDON_CATALOG (@khal/validations),
 * server-side only.
 */
function addonMessageKeys(id: BookingAddonId): { label: string; short: string } {
  switch (id) {
    case 'perfilado_cejas':
      return { label: 'perfilado_cejas', short: 'perfilado_cejas_short' };
    case 'kit_higiene':
      return { label: 'kit_higiene', short: 'kit_higiene_short' };
  }
}

/** Any next-intl translator shape (useTranslations or getTranslations scope). */
export type AddonTranslator = (key: string) => string;

/** Full module label — "Perfilado de cejas". */
function addonLabel(id: BookingAddonId, t: AddonTranslator): string {
  return t(addonMessageKeys(id).label);
}

/**
 * The service the way the recibo and the estado render it (S9/S10):
 * "Lifting + perfilado" — service name joined with the add-on shorts.
 * No add-ons -> the plain service name, never a dangling "+".
 */
export function serviceWithAddons(
  serviceName: string,
  addonIds: readonly BookingAddonId[],
  t: AddonTranslator
): string {
  if (addonIds.length === 0) {
    return serviceName;
  }
  const shorts = addonIds.map((id) => t(addonMessageKeys(id).short));
  return `${serviceName} + ${shorts.join(' + ')}`;
}
