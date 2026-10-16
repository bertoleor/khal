import BackgroundMesh from '@/components/BackgroundMesh';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';

const BASE_URL = process.env.APP_URL ?? 'https://khal-ornellas-projects-c7276f45.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Khal | Agenda de pestañas',
    template: '%s | Khal',
  },
  description:
    'Turnos online para estudios de pestañas en Vicente López, Buenos Aires: elegí tu servicio, reservá al instante y confirmá por WhatsApp.',
  openGraph: {
    title: 'Khal | Agenda de pestañas',
    description:
      'Turnos online para estudios de pestañas en Vicente López, Buenos Aires: elegí tu servicio, reservá al instante y confirmá por WhatsApp.',
    url: BASE_URL,
    siteName: 'Khal',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  other: {
    'geo.region': 'AR-B',
    'geo.placename': 'Vicente López',
    'geo.position': '-34.5361;-58.4750',
    ICBM: '-34.5361, -58.4750',
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // next-intl 3.x does NOT auto-inherit messages into the client provider
  // (inherit-by-default landed in v4, PR #1682) — pass them explicitly or
  // every 'use client' component renders raw keys (booking.pickDay).
  const messages = await getMessages();

  return (
    <html lang={locale === 'es' ? 'es-AR' : locale}>
      <body className="bg-black">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BeautySalon',
              name: 'Khal',
              description: 'Estudio de pestañas en Vicente López con agenda de turnos online.',
              url: BASE_URL,
              sameAs: ['https://www.instagram.com/khal.estudiook/'],
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Vicente López',
                addressRegion: 'Buenos Aires',
                addressCountry: 'AR',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -34.5361,
                longitude: -58.475,
              },
              openingHours: 'Mo-Sa 09:00-18:00',
            }),
          }}
        />
        <BackgroundMesh />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
