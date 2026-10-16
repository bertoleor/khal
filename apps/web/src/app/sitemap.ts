import type { MetadataRoute } from 'next';

const BASE = process.env.APP_URL ?? 'https://khal-ornellas-projects-c7276f45.vercel.app';

// Static app: the seeded catalog UUIDs (supabase/seed.sql) are stable, so the
// service detail routes are enumerable at build time.
const SERVICE_IDS = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['es', 'en'];
  const now = new Date();

  const home = locales.map((locale) => ({
    url: `${BASE}/${locale}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 1,
  }));

  const policies = locales.map((locale) => ({
    url: `${BASE}/${locale}/politicas`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }));

  const services = locales.flatMap((locale) =>
    SERVICE_IDS.map((id) => ({
      url: `${BASE}/${locale}/servicios/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  return [...home, ...policies, ...services];
}
