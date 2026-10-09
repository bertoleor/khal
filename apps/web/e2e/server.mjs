/**
 * Standalone Supabase REST stub server for KHAL E2E (KHAL-A6).
 *
 * Runs as a real HTTP server on 127.0.0.1:54321 so the Next.js SERVER-side
 * fetches (server components, server actions, anon supabase-js client —
 * traffic a browser-level `page.route()` can never intercept) hit
 * deterministic fixtures instead of the live Supabase project.
 *
 * Playwright's `webServer.command` starts this file, which spawns `next dev`
 * as a child with Supabase env vars pointing back at itself.
 *
 * Implemented with zero dependencies: node:http + manual JSON responses.
 *
 * Fixtures mirror supabase/seed.sql (same UUIDs/payloads) so the E2E contract
 * matches what production seeds — the visible services are Lifting de
 * Pestañas, Esmaltado Semipermanente and Diseño de Cejas; Spa de Uñas is
 * seeded but NOT visible (anon RLS surface).
 *
 * The create_booking RPC answers the documented 0003 contract:
 *   jsonb { ok: bool, code: text, booking_id: uuid|null }
 * The happy path replays `ok` + a deterministic booking id, and records the
 * call so the spec can assert the shape of what the app actually sent.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';

const STUB_PORT = process.env.E2E_STUB_PORT ? Number(process.env.E2E_STUB_PORT) : 54321;
const APP_PORT = process.env.E2E_APP_PORT ? Number(process.env.E2E_APP_PORT) : 3100;

/**
 * Services mirroring supabase/seed.sql — organization_id and timestamps ride
 * along like real PostgREST rows; serviceSchema strips unknown keys and
 * normalizes SQL NULLs for optional fields (catalog.ts parseRow).
 */
const services = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    organization_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    name: 'Lifting de Pestañas',
    description:
      'Curvado y lifting de pestañas naturales con fijador de larga duración. Venir sin rímel.',
    price_cents: 4500000,
    currency_code: 'ARS',
    duration_minutes: 60,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 1,
    photo_path: null,
    deposit_mode: 'percentage',
    deposit_fixed_cents: null,
    deposit_percentage_bp: 3000,
    created_at: '2026-09-28T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
    deleted_at: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    organization_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    name: 'Esmaltado Semipermanente',
    description: 'Manicura semipermanente con tres semanas de duración.',
    price_cents: 3800000,
    currency_code: 'ARS',
    duration_minutes: 75,
    buffer_minutes: 15,
    is_visible: true,
    sort_order: 2,
    photo_path: null,
    deposit_mode: 'fixed',
    deposit_fixed_cents: 1500000,
    deposit_percentage_bp: null,
    created_at: '2026-09-28T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
    deleted_at: null,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    organization_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    name: 'Diseño de Cejas',
    description: 'Perfilado y diseño de cejas a medida de tu rostro.',
    price_cents: 2800000,
    currency_code: 'ARS',
    duration_minutes: 45,
    buffer_minutes: 10,
    is_visible: true,
    sort_order: 3,
    photo_path: null,
    deposit_mode: null,
    deposit_fixed_cents: null,
    deposit_percentage_bp: null,
    created_at: '2026-09-28T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
    deleted_at: null,
  },
];

/** Rows for other tables the anon client could theoretically touch. */
function rowsFor(table) {
  switch (table) {
    case 'services':
      return services;
    default:
      return [];
  }
}

/** Recorded create_booking RPC payloads — the spec asserts on these. */
const createBookingCalls = [];

/**
 * Warmup gate: the introspection endpoint (which Playwright's `webServer.url`
 * health check polls) answers 503 until every route the happy path touches
 * has been compiled by `next dev`. This keeps the slow part (on-demand route
 * compilation, minutes on cold filesystems) inside the webServer boot phase
 * instead of blowing up the first navigation inside a spec.
 */
let routesWarm = false;

/**
 * PostgREST subset actually used by supabase-js in the booking flow:
 * `?is_visible=eq.true`, `?id=eq.<uuid>`, plus `select` and `order` params
 * which are ignored here (ordering is applied in SQL, not as a row filter).
 */
function matches(row, searchParams) {
  for (const [key, raw] of searchParams.entries()) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') {
      continue;
    }
    const [op, ...rest] = raw.split('.');
    const expected = rest.join('.');
    const actual = row[key];
    // Fixture keys are our own static data; query params come from the
    // typed supabase-js builders, never attacker-controlled. (object-injection FP)
    if (op === 'eq') {
      if (String(actual) !== expected) {
        return false;
      }
    }
    if (op === 'neq') {
      if (String(actual) === expected) {
        return false;
      }
    }
  }
  return true;
}

function send(res, status, body, extraHeaders = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    ...extraHeaders,
  });
  res.end(json);
}

const BOOKING_ID = '99999999-9999-4999-8999-999999999999';

/**
 * get_availability RPC (0010 contract): open Mon-Sat 09:00-18:00, Sunday
 * closed — the same windows the mock fixtures advertised and the same slots
 * the create_booking stub above accepts (it answers `ok` to any of them).
 * Candidates step by the service duration while duration + buffer fits the
 * window; today additionally blocks 10:00-11:15 and 14:30-15:45, mirroring
 * the fictional blocked periods the mock schedule shipped (kept so the
 * happy-path day strip keeps having both open days and a closed Sunday).
 */
function availabilityFor(payload) {
  const pDate = typeof payload.p_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.p_date)
    ? payload.p_date
    : null;
  if (!pDate) {
    return { date: typeof payload.p_date === 'string' ? payload.p_date : null, closed: true, slots: [] };
  }
  const service = services.find((s) => s.id === payload.p_service_id);
  if (!service) {
    return { date: pDate, closed: true, slots: [] };
  }

  const [y, m, d] = pDate.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0..6 Sun..Sat
  const blocked = [];
  if (weekday !== 0) {
    const now = new Date();
    const isToday =
      now.getFullYear() === y && now.getMonth() === m - 1 && now.getDate() === d;
    if (isToday) {
      blocked.push({ start: 10 * 60, end: 11 * 60 + 15 }, { start: 14 * 60 + 30, end: 15 * 60 + 45 });
    }
  }

  const open = 9 * 60;
  const close = 18 * 60;
  const block = service.duration_minutes + service.buffer_minutes;
  const slots = [];
  if (weekday !== 0) {
    for (let start = open; start + block <= close; start += service.duration_minutes) {
      const conflicts = blocked.some((p) => p.start < start + block && start < p.end);
      if (!conflicts) {
        slots.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
      }
    }
  }
  // Zero surviving slots -> closed, mirroring the 0010 SQL.
  return { date: pDate, closed: slots.length === 0, slots };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${STUB_PORT}`);
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');

    // Test introspection: recordings of the create_booking RPC payloads the
    // app actually sent (the stub and the spec live in different processes,
    // so this is the only channel between them). This is ALSO the Playwright
    // webServer health check target (see playwright.config.ts) — it gates on
    // the dev routes being warm so specs never pay the cold compile.
    if (url.pathname === '/e2e/create-booking-calls') {
      if (!routesWarm) {
        return send(res, 503, { calls: [], warming: true });
      }
      return send(res, 200, { calls: createBookingCalls });
    }

    // Auth endpoints (supabase-js may probe /auth/v1/health etc.)
    if (url.pathname.startsWith('/auth/')) {
      return send(res, 200, { data: { user: null }, error: null });
    }

    // create_booking RPC (booking.ts action — PostgREST /rest/v1/rpc/<fn> POST)
    const rpcMatch = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/);
    if (rpcMatch) {
      let payload = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        payload = {};
      }
      if (req.method !== 'POST') {
        return send(res, 404, { message: 'not found' });
      }
      // get_availability RPC (availability.ts action — 0010 contract).
      if (rpcMatch[1] === 'get_availability') {
        // eslint-disable-next-line no-console -- stub server diagnostics
        console.log(
          `[supabase-stub] POST rpc/get_availability ${payload.p_date ?? 'unknown'} ->`,
          JSON.stringify(availabilityFor(payload))
        );
        return send(res, 200, availabilityFor(payload));
      }
      if (rpcMatch[1] !== 'create_booking') {
        return send(res, 404, { message: 'not found' });
      }
      createBookingCalls.push(payload);
      // eslint-disable-next-line no-console -- stub server diagnostics
      console.log(
        `[supabase-stub] POST rpc/create_booking from ${payload.p_name ?? 'unknown'} ->`,
        JSON.stringify({ ok: true, code: 'ok', booking_id: BOOKING_ID })
      );
      // Documented 0003 contract on success.
      return send(res, 200, { ok: true, code: 'ok', booking_id: BOOKING_ID });
    }

    const restMatch = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (!restMatch) {
      return send(res, 404, { message: 'not found' });
    }

    const table = restMatch[1];
    const accept = req.headers['accept'] ?? '';
    const isObject = accept.includes('vnd.pgrst.object');

    const filtered = rowsFor(table).filter((row) => matches(row, url.searchParams));
    return send(res, 200, isObject ? (filtered[0] ?? null) : filtered);
  });
});

server.listen(STUB_PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console -- stub server diagnostics
  console.log(`[supabase-stub] listening on http://127.0.0.1:${STUB_PORT}`);

  // Optional standalone mode: when E2E_STUB_ONLY is set the stub does NOT
  // spawn `next dev` — kept for parity with the EROS pattern.
  if (process.env.E2E_STUB_ONLY) {
    return;
  }

  // Start Next dev as a child so both servers share the webServer lifecycle.
  // Dedicated port 3100: sibling khal worktrees run plain `next dev` on 3000,
  // and this app MUST be the stub-backed instance, never a reused stranger.
  // `pnpm --filter @khal/web dev` from the repo root resolves the workspace
  // package and runs in apps/web.
  const next = spawn('pnpm', ['--filter', '@khal/web', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(APP_PORT),
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${STUB_PORT}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
      // Neutralize real credentials that could leak through Next's env
      // loading (.env.local merges with process.env): without MP credentials
      // the checkout action fails closed into the friendly "unavailable"
      // path and the test never touches the real MP API. Without an n8n
      // webhook the post-booking notification is a no-op.
      MP_ACCESS_TOKEN: '',
      MP_WEBHOOK_SECRET: '',
      N8N_WEBHOOK_URL: '',
      N8N_WEBHOOK_SECRET: '',
    },
  });
  // Warm up the routes the happy path touches: `next dev` compiles routes on
  // demand and a cold compile can take minutes on slow filesystems, which
  // would stall the FIRST navigation inside a spec (App Router soft nav does
  // not change the URL until the target route resolves). The gate only opens
  // when every route actually responded — if the app never comes up the stub
  // exits non-zero so Playwright reports a webServer failure instead of a
  // confusing connection-refused inside the spec.
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function warmRoute(path) {
    const started = Date.now();
    for (let attempt = 1; attempt <= 120; attempt++) {
      try {
        const response = await fetch(`http://127.0.0.1:${APP_PORT}${path}`, {
          redirect: 'follow',
          // Long enough to ride out an on-demand compile that's already
          // running; short enough that the retry loop stays responsive.
          // A timed-out compile keeps going server-side, so the NEXT attempt
          // lands on a hot route.
          signal: AbortSignal.timeout(90_000),
        });
        if (response.status < 500) {
          // eslint-disable-next-line no-console -- stub server diagnostics
          console.log(
            `[supabase-stub] warm ${path} -> ${response.status} in ${Date.now() - started}ms`
          );
          return true;
        }
      } catch {
        // dev server not listening yet — retry
      }
      await sleep(5000);
    }
    // eslint-disable-next-line no-console -- stub server diagnostics
    console.error(`[supabase-stub] warm ${path} FAILED after ${Date.now() - started}ms`);
    return false;
  }
  const warmup = async () => {
    // Sequential: parallel compiles thrash the same dev server.
    const okHome = await warmRoute('/es');
    const okService = await warmRoute(`/es/servicios/${services[0].id}`);
    const okReservar = await warmRoute(`/es/servicios/${services[0].id}/reservar`);
    if (!okHome || !okService || !okReservar) {
      // Fail loudly: a green gate with a dead app produces only confusing
      // ERR_CONNECTION_REFUSED failures inside the specs.
      process.exit(1);
    }
    routesWarm = true;
    // eslint-disable-next-line no-console -- stub server diagnostics
    console.log('[supabase-stub] routes warm — health check will pass');
  };
  void warmup();

  next.on('exit', (code) => {
    server.close();
    process.exit(code ?? 0);
  });
});
