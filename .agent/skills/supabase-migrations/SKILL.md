---
name: supabase-migrations
description: >
  Supabase migration authoring and review for PAEONIA.
  Trigger: When creating, editing, or reviewing Supabase migrations - schema, RLS, seeds.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Migration Decision Tree

```
Schema change?        → new migration file, never edit an applied one
Data policy change?   → RLS policy lives INSIDE the same migration
Test/seed data?       → seed script, never inside the migration
Changing types?       → regen types + typecheck after migrate
Reviewing a PR?       → run the PR checklist below + /db-migration workflow
```

## File Naming (REQUIRED)

```
supabase/migrations/YYYYMMDDHHMMSS_short_snake_name.sql
```

```sql
-- ✅ ALWAYS: timestamp prefix, one concern per file
-- 20260908000100_create_orders_table.sql
-- 20260908000200_orders_rls_policies.sql

-- ❌ NEVER: vague names or multiple concerns in one file
-- migration.sql, fix.sql, update_stuff.sql — NO
```

## Up/Down + Rollback Discipline (REQUIRED)

```sql
-- ✅ ALWAYS: every migration must be reversible — write the down path first
-- UP
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_centavos integer NOT NULL CHECK (amount_centavos > 0),
  status text NOT NULL DEFAULT 'pending_payment'
);

-- DOWN (document or provide)
-- DROP TABLE public.orders;

-- ❌ NEVER: irreversible DDL without a documented rollback
-- DROP COLUMN without a backfill plan — NO
-- ALTER TYPE ... USING without testing on a copy — NO
```

## RLS Policies Inside Migrations (REQUIRED)

```sql
-- ✅ ALWAYS: enable RLS and ship policies in the SAME migration as the table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ❌ NEVER: a table without RLS, or policies in a "later" migration
-- CREATE TABLE without ENABLE ROW LEVEL SECURITY — NO
```

## Seed Data Separation (REQUIRED)

```typescript
// ✅ ALWAYS: seeds live outside migrations (supabase/seed.sql or scripts)
// Migrations = schema. Seeds = data. Different lifecycles.

// ❌ NEVER: INSERT seed rows inside a schema migration
// INSERT INTO public.plans ... — NO, belongs in seed
```

## Regenerate Types + Typecheck (REQUIRED)

```bash
supabase gen types typescript --local > lib/supabase/types.ts
npx tsc --noEmit
```

```typescript
// ✅ ALWAYS: regen types after every migration, commit both together
// Migration + types.ts in the same PR — one atomic unit

// ❌ NEVER: hand-edit lib/supabase/types.ts
// ❌ NEVER: merge a migration without running typecheck after
```

## Reviewing Migrations in PRs

- [ ] File name has valid timestamp prefix and snake_case purpose.
- [ ] No edit to an already-applied migration (new file instead).
- [ ] RLS enabled + policies included for every new table.
- [ ] Rollback path documented or provided.
- [ ] No seed data mixed into schema changes.
- [ ] `lib/supabase/types.ts` regenerated and committed.
- [ ] `tsc --noEmit` passes after migration.
- [ ] Reviewed via the `/db-migration` workflow.

## CI Migration Checks

```bash
supabase db lint        # Static checks on migration SQL
supabase db reset       # Replays all migrations from scratch locally
npx tsc --noEmit        # Types still align after replay
```

```sql
-- ❌ NEVER: merge when `db reset` fails locally
-- A migration that only works on your database is broken
```

## Never Edit Applied Migrations (REQUIRED)

Once a migration has run anywhere shared (preview, staging, prod), it is immutable. Fix forward with a new migration. Editing history breaks every environment that already applied it.

## Keywords

supabase, migrations, postgres, RLS, policies, seed, types, rollback, db-migration
