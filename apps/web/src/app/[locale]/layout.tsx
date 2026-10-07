import BackgroundMesh from '@/components/BackgroundMesh';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Khal — Agenda',
  description: 'Agenda virtual para estudios de estética',
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
        <BackgroundMesh />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
