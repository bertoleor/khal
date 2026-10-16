import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Migration 0010 textual contract (khal-admin-100-operable T6) — mirrors the
 * migration-0006/0007 contract pattern: static source asserts so the SQL
 * keeps its security shape through future edits.
 *
 * Contract: bucket `service-photos` is created idempotently, public read,
 * staff-only writes (org_role admin/manager — NOT plain authenticated),
 * 4MB file limit, live-apply ledger row, and a working down migration.
 */

const MIG = join(__dirname, '..', '..', '..', 'supabase', 'migrations');
const UP = join(MIG, '0010_service_photos_bucket.sql');
const DOWN = join(MIG, '0010_service_photos_bucket.down.sql');

describe('0010 service-photos bucket (contract)', () => {
  it('has both up and down migration files', () => {
    expect(existsSync(UP)).toBe(true);
    expect(existsSync(DOWN)).toBe(true);
  });

  it('up: creates the bucket idempotently inside a transaction', () => {
    const sql = readFileSync(UP, 'utf-8');
    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
    expect(sql).toMatch(/insert\s+into\s+storage\.buckets/);
    expect(sql).toContain("'service-photos'");
    expect(sql).toMatch(/on conflict\s+\(id\)\s+do nothing/);
  });

  it('up: caps object size at 4MB at the bucket level', () => {
    const sql = readFileSync(UP, 'utf-8');
    // Column list names the limit; VALUES carries the 4MB byte cap.
    expect(sql).toContain('file_size_limit');
    expect(sql).toMatch(/4194304/);
  });

  it('up: public read policy scoped to the bucket', () => {
    const sql = readFileSync(UP, 'utf-8');
    expect(sql).toMatch(
      /create policy "service_photos_public_read"\s+on storage\.objects\s+for select/
    );
    expect(sql).toContain("bucket_id = 'service-photos'");
  });

  it('up: write policies are staff-only (org_role admin/manager, never bare authenticated)', () => {
    const sql = readFileSync(UP, 'utf-8');
    for (const op of ['insert', 'update', 'delete']) {
      const re = new RegExp(
        `create policy "service_photos_${op}"\\s+on storage\\.objects\\s+for ${op}\\s+to authenticated`
      );
      expect(sql).toMatch(re);
    }
    expect(sql).toContain("public.org_role() in ('admin', 'manager')");
    // The write policies must not be open to anon or plain authenticated:
    expect(sql).not.toMatch(/for all\s+to authenticated/);
  });

  it('up: registers the ledger row for supabase db push parity', () => {
    const sql = readFileSync(UP, 'utf-8');
    expect(sql).toMatch(/insert\s+into\s+supabase_migrations\.schema_migrations/);
    expect(sql).toContain("'0010'");
  });

  it('down: drops the policies, the bucket and the ledger row', () => {
    const sql = readFileSync(DOWN, 'utf-8');
    expect(sql).toMatch(/drop policy if exists "service_photos_public_read" on storage\.objects/);
    expect(sql).toMatch(/delete\s+from\s+storage\.buckets\s+where\s+id\s*=\s*'service-photos'/);
    expect(sql).toMatch(
      /delete\s+from\s+supabase_migrations\.schema_migrations\s+where\s+version\s*=\s*'0010'/
    );
  });
});
