import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  // One stub server shared by all specs: recordings and fixtures are
  // in-process state, so tests must not race each other on them.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  // The happy path walks through several on-demand-compiled dev routes; the
  // stub warms them up, but retries and dev-server noise need headroom.
  timeout: 180_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3100',
    // Real Argentina visitor: Accept-Language es-AR negotiates the Spanish
    // storefront through next-intl's middleware (headless Chromium defaults
    // to en-US, which would render the /en tree and break es assertions).
    locale: 'es-AR',
    timezone: 'America/Argentina/Buenos_Aires',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // One command, two servers: the zero-dep Supabase REST stub on
    // 127.0.0.1:54321 (apps/web/e2e/server.mjs) which then spawns
    // `next dev` as a child on port 3100 with Supabase env vars pointing
    // at the stub. Server-side fetches (server components / actions) can NOT
    // be intercepted by browser-level page.route(), so the stub must be a
    // real HTTP server. Port 3100 avoids clashing with sibling khal
    // worktrees running plain `next dev` on 3000.
    command: 'node apps/web/e2e/server.mjs',
    // Health check target: the stub answers 503 until it has warmed every
    // route the happy path touches (on-demand dev compilation can take
    // minutes on cold filesystems), so the slow part lives INSIDE this boot
    // phase and specs always start against hot routes.
    url: 'http://127.0.0.1:54321/e2e/create-booking-calls',
    // Never reuse an existing stub: it is STATEFUL (records create_booking
    // payloads the spec asserts on, exposes a warmup gate). A stale stub
    // from a previous run would leak its recordings into the spec.
    reuseExistingServer: false,
    // Cold-route compile MEASURED on the Windows dev box: /es ~117s, each
    // deeper dynamic route 2-3 min, sequential warmup of all three routes
    // ≈ 8-12 min worst case on an idle disk. This machine routinely runs
    // 5-6 sibling khal worktrees whose builds saturate the disk, which
    // measured >20 min for the first route alone (KHAL-A6 retry, 2026-10-03)
    // — 2400s covers that hostile case; CI (ubuntu, tmpfs) stays far under.
    timeout: 2_400_000,
  },
});
