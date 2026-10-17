'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/**
 * Staff sign-in (khal-admin-100-operable T3).
 *
 * Two flows, one component:
 *  - "code" (default): signInWithOtp -> 6-digit code by email -> verifyOtp.
 *    `shouldCreateUser: false` keeps strangers from minting accounts; only
 *    the provisioned staff email can receive codes.
 *  - "password": for staff that already set a password (reset flow).
 *
 * On success the ssr browser client stores the session cookies, and we
 * hard-navigate to /admin so the server components re-render with the
 * authenticated context.
 */
export function LoginForm() {
  const t = useTranslations('Admin.login');
  const router = useRouter();

  const [mode, setMode] = useState<'code' | 'password'>('code');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapError(err: { message: string }): string {
    const m = err.message.toLowerCase();
    if (m.includes('invalid login')) return t('errors.invalid');
    if (m.includes('email not confirmed')) return t('errors.notConfirmed');
    if (m.includes('expired') || m.includes('otp') || m.includes('token'))
      return t('errors.badCode');
    if (m.includes('rate') || m.includes('too many') || m.includes('limit'))
      return t('errors.rateLimit');
    if (m.includes('signup') || m.includes('not found') || m.includes('unable to'))
      return t('errors.notStaff');
    return t('errors.generic');
  }

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        setError(mapError(otpError));
        return;
      }
      setStep('code');
    } catch {
      setError(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (verifyError) {
        setError(mapError(verifyError));
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: pwError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (pwError) {
        setError(mapError(pwError));
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40';
  const buttonClass =
    'w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-black hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-60';
  const secondaryClass =
    'text-sm font-medium text-zinc-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400';

  return (
    <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm">
      {error !== null && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {mode === 'code' && step === 'email' && (
        <form className="space-y-4" onSubmit={requestCode} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300" htmlFor="login-email">
              {t('email')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              className={inputClass}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? t('sending') : t('sendCode')}
          </button>
          <button
            type="button"
            className={secondaryClass}
            onClick={() => {
              setMode('password');
              setError(null);
            }}
          >
            {t('usePassword')}
          </button>
        </form>
      )}

      {mode === 'code' && step === 'code' && (
        <form className="space-y-4" onSubmit={verifyCode} noValidate>
          <p className="text-sm text-zinc-400">{t('codeSent')}</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300" htmlFor="login-code">
              {t('code')}
            </label>
            <input
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              className={`${inputClass} text-center text-lg tracking-[0.4em]`}
              placeholder={t('codePlaceholder')}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? t('verifying') : t('verify')}
          </button>
          <button
            type="button"
            className={secondaryClass}
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
          >
            {t('back')}
          </button>
        </form>
      )}

      {mode === 'password' && (
        <form className="space-y-4" onSubmit={signInWithPassword} noValidate>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-zinc-300"
              htmlFor="login-email-pw"
            >
              {t('email')}
            </label>
            <input
              id="login-email-pw"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              className={inputClass}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-zinc-300"
              htmlFor="login-password"
            >
              {t('password')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? t('verifying') : t('signIn')}
          </button>
          <button
            type="button"
            className={secondaryClass}
            onClick={() => {
              setMode('code');
              setStep('email');
              setError(null);
            }}
          >
            {t('useCode')}
          </button>
        </form>
      )}
    </div>
  );
}
