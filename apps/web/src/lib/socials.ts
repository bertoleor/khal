/**
 * Studio social links (v7 — S4/S11): single source for the footer and the
 * Conocenos screen so the handles never drift between surfaces.
 *
 * Instagram is the verified handle (layout.tsx schema.org `sameAs`).
 * TikTok is a stand-in until the owner sends her real handle — the screens
 * are wired, swapping the URL is a one-line change here.
 */
export const INSTAGRAM_URL = 'https://www.instagram.com/khal.estudiook/';

export const TIKTOK_URL = 'https://www.tiktok.com/@khal.estudio';

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone}`;
}
