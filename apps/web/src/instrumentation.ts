/**
 * [KHAL-A8] Boot-time env validation hook (t_f7b55304).
 *
 * Before this file existed, the zod schema in `src/config/env.ts` had
 * ZERO importers — a "required" contract that never ran. The audit
 * (auditoria-khal-2026-10-02.md §2-A8) called it a lying contract:
 * deploys could boot without NEXT_PUBLIC_TURNSTILE_SITE_KEY and the
 * app would silently render a keyless Turnstile widget (KHAL-A4 wiring).
 *
 * Next runs this hook once per server process (dev server start and
 * production `next start`) — exactly where a missing required var must
 * fail fast instead of degrading silently. The hook must NOT run during
 * `next build`: CI (ci.yml e2e job) builds with no env vars at all, so
 * a parse-time explosion there would break every PR. Hence the
 * NEXT_PHASE guard.
 */
export async function register(): Promise<void> {
  // PHASE_PRODUCTION_BUILD = 'phase-production-build' (Next 15.5.25,
  // verified in next/dist/shared/lib/constants.js). Import lazily so
  // the schema module (and its throw) is only pulled in at runtime.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }
  await import('./config/env');
}
