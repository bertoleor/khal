import type { MetadataRoute } from 'next';

const BASE = process.env.APP_URL ?? 'https://khal-ornellas-projects-c7276f45.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
