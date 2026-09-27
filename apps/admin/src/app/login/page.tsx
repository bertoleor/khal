import { getTranslations } from 'next-intl/server';

/**
 * [ORN-79] Login page.
 *
 * The old page issued the client-settable `khal_role=admin` cookie as its
 * "sign-in" — any visitor could mint admin. With the mock removed, this page
 * is informational only: real sessions come from Supabase Auth (JWT with
 * `app_metadata.role`), provisioned out-of-band for staff.
 *
 * TODO (ORN-80 follow-up): replace with a real Supabase email/password sign-
 * in form once the auth service is provisioned for staff accounts.
 */
export default async function LoginPage() {
  const t = await getTranslations('Admin.login');

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
      <p className="max-w-prose text-center text-sm text-slate-600">{t('notice')}</p>
    </main>
  );
}
