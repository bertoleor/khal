import { defineConfig, devices } from '@playwright/test';

/**
 * [ORN-205] Visual regression config — pixel-diff baselines (skill pixel-perfect).
 *
 * Deliberately SEPARATE from playwright.config.ts (functional e2e): `pnpm e2e`
 * keeps running only the booking happy path. This config is only picked up via
 * `pnpm e2e:visual` / `--config playwright.visual.config.ts`, so CI steps stay
 * explicit about which suite they run.
 *
 * The webServer is the SAME zero-dep Supabase REST stub as the functional suite
 * (apps/web/e2e/server.mjs): it spawns `next dev` on 3100 with Supabase env vars
 * pointing at deterministic fixtures (seed.sql mirror). Server components fetch
 * over real HTTP that browser-level page.route() can never intercept, so
 * screenshots are only reproducible against the stub. There is intentionally NO
 * BASE_URL override in CI: the stub is the single source of truth — pointing at
 * staging would drift the data and silently break baseline determinism.
 */
export default defineConfig({
  testDir: './tests',
  // tests/ also hosts vitest unit tests (tests/unit/*.test.ts) — foreign to
  // this suite: Playwright's default testMatch (*.spec.ts OR *.test.ts) would
  // load them and crash on the vitest import. Match ONLY *.spec.ts.
  testMatch: '**/*.spec.ts',
  snapshotDir: './snapshots',
  // {testFileDir}/{testFileName} keeps the path readable without .ts-as-directory quirk
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFileDir}/{testFileName}/{arg}{ext}',

  // One stub-backed dev server shared by all specs. workers > 1 only adds
  // screenshot timing variance against a single dev server — the functional
  // suite pins workers for the same reason.
  fullyParallel: false,
  workers: 1,

  // ⚠️ Visual regression tests should NOT retry.
  // A retry overwrites diff artifacts, making it impossible to diagnose whether
  // the failure was a flake or a real regression. Fix flakiness with the visual
  // fixture (tests/fixtures/visual.ts) instead of masking it with retries.
  retries: 0,

  // Stop after 10 failures in CI — don't waste time if something is globally broken.
  // 0 means "no limit" (unintuitive API — 0 ≠ "stop immediately").
  maxFailures: process.env.CI ? 10 : 0,

  // CI:    'none' — missing baseline = test fails. Baselines must be committed.
  //        ⚠️ New tests added in a PR will fail in CI until baselines are generated
  //        via update-snapshots.yml and committed. This is intentional.
  // Local: 'missing' — create new baselines automatically, never overwrite existing.
  //        Use `pnpm e2e:visual -- --update-snapshots` to overwrite changed ones.
  updateSnapshots: process.env.CI ? 'none' : 'missing',

  reporter: process.env.CI
    ? [['dot'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'on-failure', outputFolder: 'playwright-report' }]],

  // Headroom for the first navigation into a route the stub's warmup gate does
  // NOT pre-compile (e.g. /es/politicas): on-demand `next dev` compile can take
  // 2-3 min on slow filesystems. Warmed routes finish in seconds.
  timeout: 300_000,
  navigationTimeout: 240_000,

  use: {
    // The stub spawns `next dev` on 3100 (see webServer below). /es is the
    // canonical storefront locale — specs navigate to /es routes explicitly
    // instead of relying on Accept-Language negotiation.
    baseURL: process.env.BASE_URL || 'http://localhost:3100',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    // khal's identity is iOS-strict dark (#000000 canvas): lock the emulated
    // scheme so a future light-mode experiment can't silently flip baselines.
    colorScheme: 'dark',
    // Freeze the particle aura and any motion-driven UI: baselines capture the
    // reduced-motion state (deterministic), not a mid-animation frame.
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  expect: {
    toHaveScreenshot: {
      // animations: 'disabled' freezes CSS transitions + Web Animations API at
      // screenshot time via DevTools protocol. This is already the default.
      animations: 'disabled',
      // 30s stability window: in dev mode the first tests after a cold boot run
      // while on-demand compilation still streams chunks in the background —
      // two consecutive screenshots can't agree within the 5s default on a
      // loaded host. Once the page is settled, comparison takes <2s; only
      // genuinely unstable pages pay the full window.
      timeout: 30_000,
      maxDiffPixelRatio: 0.01, // allow up to 1% of pixels to differ
      // threshold: per-pixel color sensitivity (0–1).
      // 0.05 = a pixel must differ by >5% of full color range to count as changed.
      // Increase to 0.1 or 0.2 only if font anti-aliasing causes false positives.
      threshold: 0.05,
    },
  },

  projects: [
    {
      // Pilot viewport: Desktop only. Keeping the first cross-OS baseline matrix
      // minimal is deliberate — Tablet/Mobile projects are trivially additive
      // later (see references/examples/playwright.config.ts in the skill).
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  webServer: {
    // Same one-command-two-servers stub as the functional suite: zero-dep
    // Supabase REST stub on 127.0.0.1:54321 which spawns `next dev` (port 3100,
    // Supabase env vars pointing back at the stub, MP credentials neutralized).
    // Never reuse an existing stub — it is STATEFUL (records create_booking
    // payloads the functional spec asserts on).
    command: 'node apps/web/e2e/server.mjs',
    // Health check target: the stub answers 503 until it has warmed every route
    // the happy path touches, so the slow part (on-demand dev compilation)
    // lives INSIDE this boot phase and specs start against hot routes.
    url: 'http://127.0.0.1:54321/e2e/create-booking-calls',
    reuseExistingServer: false,
    // Cold-route compile MEASURED on the Windows dev box: ≈ 8-12 min worst case.
    // CI (ubuntu, tmpfs) compiles in a fraction of that.
    timeout: 1_200_000,
  },
});
