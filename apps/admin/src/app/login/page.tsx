import { LoginForm } from '@/components/admin/login-form';
import { getTranslations } from 'next-intl/server';

/**
 * [khal-admin-100-operable T3] Login page — real Supabase sign-in.
 *
 * ORN-79 closed the mock-cookie "login"; this closes the other half the
 * ORN-80 TODO left open: staff sign in with their provisioned Supabase
 * account. Primary flow is a magic code (OTP) to the staff email — no
 * password ever transits the chat or the codebase — with an optional
 * password path for staff that set one. Role comes exclusively from the
 * server-issued `app_metadata.role` claim; this page grants nothing.
 */
export default async function LoginPage() {
  const t = await getTranslations('Admin.login');

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <p className="max-w-prose text-center text-sm text-slate-600">{t('subtitle')}</p>
      <LoginForm />
    </main>
  );
}
