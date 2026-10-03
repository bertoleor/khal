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

  // KHAL-A6: messages must be passed explicitly to the client provider.
  // Without them every Client Component that calls useTranslations renders
  // raw keys ("booking.pickDay" instead of "Elegí el día") — the entire
  // booking form (SlotPicker, BookingForm, PaymentStep) rendered raw keys
  // instead of Spanish labels. Surfaced by the A6 E2E happy path.
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-black">
        <BackgroundMesh />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
