import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * KHAL-F4 — DB contract guard: processed_events dedupe constraint must satisfy
 * the webhook's `onConflict: 'event_key'` upsert.
 *
 * Regression discovered live against production on 2026-09-26 (G0 nightly):
 * migration 0004 created a *partial* unique index
 *   `... (event_key) WHERE event_key IS NOT NULL`
 * but Postgres 42P10 requires ON CONFLICT's inferable-index match: a partial
 * index does NOT satisfy a bare `ON CONFLICT (event_key)` arbiter, so the MP
 * webhook claim failed with
 *   ERROR 42P10: there is no unique or exclusion constraint matching the
 *   ON CONFLICT specification
 * on every approved payment (HTTP 500 dedup_failed → MP keeps retrying → no
 * booking is ever confirmed).
 *
 * The unit suite never caught this because @supabase/supabase-js is mocked —
 * the SQL never runs. This guard reads the migration SQL and asserts the
 * exact Postgres semantics the webhook depends on, evaluated over the
 * ACCUMULATED state of all migrations (0004 created the column nullable +
 * partial index; 0005 forward-fixes it because 0004 is immutable in prod —
 * it already ran and is registered in supabase_migrations.schema_migrations).
 *
 * Assertions:
 *   1. event_key becomes NOT NULL somewhere across migrations (0005).
 *   2. The FINAL unique index on processed_events(event_key) is NOT partial —
 *      a full unique index exists and no partial variant survives.
 *   3. The webhook actually claims via onConflict: 'event_key'.
 *
 * Source: kanban t_058bb58a (drift fix + live probe), migrations 0004/0005,
 * apps/web/src/app/api/webhooks/mercadopago/route.ts (claim block).
 */

const REPO_ROOT = join(__dirname, '..', '..', '..');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase', 'migrations');
const WEBHOOK_FILE = join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'app',
  'api',
  'webhooks',
  'mercadopago',
  'route.ts'
);

function readMigrations(): string[] {
  const files = [
    '0004_processed_events_event_key.sql',
    '0005_processed_events_event_key_not_null_full_index.sql',
  ];
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf-8'));
}

function finalState(sqls: string[]): string {
  // Fold migrations in order, tracking the CREATE INDEX statement that wins.
  // Postgres naming rule: last CREATE UNIQUE INDEX on the same name wins.
  let indexStmt = '';
  for (const sql of sqls) {
    const idxStart = sql.search(/create\s+unique\s+index\s+processed_events_event_key_key/i);
    if (idxStart >= 0) {
      const stmt = sql.slice(idxStart);
      const semi = stmt.indexOf(';');
      indexStmt = stmt.slice(0, semi).toLowerCase();
    }
  }
  return indexStmt;
}

describe('migrations 0004+0005: processed_events.event_key dedupe contract', () => {
  const sqls = readMigrations();
  const combined = sqls.join('\n;\n');
  const finalIndex = finalState(sqls);

  it('0005 exists (forward fix over immutable 0004)', () => {
    expect(sqls.length).toBe(2);
    expect(combined).toMatch(
      /alter\s+table\s+public\.processed_events\s+alter\s+column\s+event_key\s+set\s+not\s+null/i
    );
  });

  it('event_key ends NOT NULL across the accumulated state', () => {
    // 0005 must contain SET NOT NULL (0004 may not — the column was born nullable).
    const fix = sqls[1];
    expect(
      fix,
      'migration 0005 must SET NOT NULL on event_key so a plain (non-partial) ' +
        'unique index is valid. 0004 is immutable (already applied in prod).'
    ).toMatch(/alter\s+column\s+event_key\s+set\s+not\s+null/i);
  });

  it('final unique index on event_key is NOT partial — bare ON CONFLICT (event_key) must infer it (Postgres 42P10)', () => {
    expect(finalIndex.length).toBeGreaterThan(0);
    expect(
      finalIndex,
      'the surviving index must be a full unique index: a partial index ' +
        '(WHERE ...) cannot be inferred by bare ON CONFLICT (event_key); the ' +
        'webhook upsert explodes with 42P10 in production. 0005 must drop the ' +
        'partial index and create a full one.'
    ).not.toContain('where');
  });

  it('0005 drops the partial index before creating the full one', () => {
    const fix = sqls[1];
    // Schema-qualified DROP (public.…) is the canonical form.
    expect(fix).toMatch(/drop\s+index\s+(?:public\.)?processed_events_event_key_key/i);
    expect(fix).toMatch(/create\s+unique\s+index\s+(?:public\.)?processed_events_event_key_key/i);
  });
});

describe('MP webhook claim uses the onConflict event_key arbiter', () => {
  const route = readFileSync(WEBHOOK_FILE, 'utf-8');

  it("claim upsert targets onConflict: 'event_key'", () => {
    expect(route).toMatch(/onConflict:\s*'event_key'/);
  });

  it('claim sets ignoreDuplicates (DO NOTHING) so MP retries ack as duplicates', () => {
    expect(route).toMatch(/ignoreDuplicates:\s*true/);
  });
});
