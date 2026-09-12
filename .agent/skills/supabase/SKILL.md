---
name: supabase
description: "Official Supabase skill: DB, Auth, RLS, migrations, MCP, SSR."
license: Apache-2.0
metadata:
  author: supabase
  version: "0.1.2"
---

# Supabase

Source: official `supabase/agent-skills` repository (canonical Supabase guidance, maintained by Supabase). Installed manually into Hermes global skills. Update source: `https://github.com/supabase/agent-skills` → `skills/supabase/SKILL.md`.

## Core Principles

**1. Supabase changes frequently — verify against changelog and current docs before implementing.**
Do not rely on training data for Supabase features. Function signatures, config.toml settings, and API conventions change between versions.

First, fetch `https://supabase.com/changelog.md` (a lightweight summary index), scan for `breaking-change` tags relevant to your task, and follow the linked page for any that apply. Then look up the relevant topic using the documentation access methods below.

**2. Verify your work.**
After implementing any fix, run a test query to confirm the change works. A fix without verification is incomplete.

**3. Recover from errors, don't loop.**
If an approach fails after 2-3 attempts, stop and reconsider. Try a different method, check documentation, inspect the error more carefully, and review relevant logs when available.

**4. Exposing tables to the Data API:** Depending on Data API settings, newly created tables may not be automatically exposed via the Data (REST) API. If so, `anon` and `authenticated` roles need explicit access grant. This is separate from RLS, which controls which _rows_ are visible once a table is accessible.

When a SQL-created table is unexpectedly inaccessible, check Data API settings and whether roles were granted via explicit `GRANT` SQL. When granting public access, always enable RLS too.

**5. RLS in exposed schemas.**
Enable RLS on every table in any exposed schema (includes `public` by default). After enabling RLS, create policies that match the actual access model rather than defaulting every table to the same `auth.uid()` pattern.

## Security Checklist (MANDATORY for auth, RLS, views, storage, or user data)

These are Supabase-specific traps that silently create vulnerabilities:

- **Never use `user_metadata` claims in JWT-based authorization.** `raw_user_meta_data` is user-editable and can appear in `auth.jwt()`, so it is unsafe for RLS. Store authorization data in `raw_app_meta_data` / `app_metadata` instead.
- **Deleting a user does not invalidate existing access tokens.** Sign out or revoke sessions first; keep JWT expiry short; validate `session_id` against `auth.sessions` for strict guarantees.
- **`app_metadata`/`auth.jwt()` claims are stale until the token refreshes.**
- **Never expose `service_role` or secret key in public clients.** Prefer publishable keys. In Next.js, any `NEXT_PUBLIC_` env var reaches the browser.
- **Views bypass RLS by default.** Postgres 15+: `CREATE VIEW ... WITH (security_invoker = true)`. Older: revoke access from `anon`/`authenticated` or move to unexposed schema.
- **UPDATE requires a SELECT policy.** Without it, updates silently return 0 rows — no error.
- **`auth.role()` is deprecated — use the `TO` clause.** `auth.role() = 'authenticated'` breaks silently with anonymous sign-ins. Use `TO authenticated` / `TO anon` directly on the policy.
- **`TO authenticated` alone is authentication without authorization (BOLA/IDOR).** Combine with an ownership predicate:
  ```sql
  create policy "example" on table_name for select
    to authenticated
    using ( (select auth.uid()) = user_id );
  ```
- **UPDATE policies require both `USING` and `WITH CHECK`.** Without `WITH CHECK`, a user can reassign a row's `user_id` to another user.
- **`SECURITY DEFINER` functions bypass RLS.** Never add it to resolve a permission error — it silently removes access control. Prefer `SECURITY INVOKER`.
- **`SECURITY DEFINER` functions in `public` are callable by all roles.** Postgres grants `EXECUTE` to `PUBLIC` by default. If genuinely needed, keep in a non-exposed schema, include an `auth.uid()` check, and run `supabase db advisors`.
- **Storage upsert requires INSERT + SELECT + UPDATE.** Granting only INSERT allows uploads but replaces silently fail.
- **Always pin package versions and commit lockfiles** for `supabase-js`, `@supabase/ssr`, `supabase-py`, etc.

For anything not covered, fetch `https://supabase.com/docs/guides/security/product-security.md`.

## Supabase CLI

Always discover commands via `--help` — never guess. Structure changes between versions.

```bash
supabase --help
supabase <group> --help
supabase <group> <command> --help
```

Known gotchas:
- `supabase db query` requires CLI v2.79.0+ → use MCP `execute_sql` or `psql` as fallback.
- `supabase db advisors` requires CLI v2.81.3+ → use MCP `get_advisors` as fallback.
- Imperative migrations: create files with `supabase migration new <name>` first. Never invent a filename. Declarative schema projects generate migrations from `supabase/schemas/`.
- Check `supabase --version`; consult CLI docs/GitHub releases for version-specific details.

## Supabase MCP Server

In berto's Hermes setup the Supabase MCP tools are the `mcp__supabase__*` family (29 tools: `list_projects`, `list_tables`, `execute_sql`, `get_advisors`, `apply_migration`, `query_logs`, etc.).

Troubleshooting connection issues, in order:
1. Check reachability: `curl -so /dev/null -w "%{http_code}" https://mcp.supabase.com/mcp` — a `401` (no token) means the server is up.
2. Verify `.mcp.json` has the correct server URL `https://mcp.supabase.com/mcp`.
3. If tools aren't visible, re-authenticate (OAuth 2.1 flow).

## Supabase Documentation

Before implementing any Supabase feature, find the relevant docs, in priority order:
1. MCP `search_docs` tool (preferred).
2. Fetch docs pages as markdown — append `.md` to any docs URL.
3. Web search for Supabase-specific topics.

## Making Schema Changes

Decide which workflow the project uses.

### A: Declarative schemas
When `supabase/schemas/` exists or `config.toml` sets `schema_paths`, edit the schema state files, then generate and review the migration. Do not hand-write a migration first.

### B: Imperative migrations
When the project does not use declarative schemas:

- **Iterate** with `execute_sql` (MCP) or `supabase db query` (CLI) directly — no migration history entries until you're ready.
- **Do NOT use `apply_migration`** to change a local schema — it writes a migration history entry on every call, preventing iteration and producing empty/conflicting diffs.

**When ready to commit:**
1. Run advisors → `supabase db advisors` (CLI 2.81.3+) or MCP `get_advisors`. Fix issues.
2. Review the Security Checklist if changes touch views, functions, triggers, or storage.
3. Generate migration → `supabase db pull <descriptive-name> --local --yes`.
4. Verify → `supabase migration list --local`.

## Debugging

When hitting a Supabase error (REST API, Postgres, PostgREST, empty result, unexpected RLS block, Auth/Realtime/Edge/Storage failure), fetch the Monitoring and Debugging docs (`https://supabase.com/docs/guides/monitoring-and-debugging.md`) before diagnosing from memory. Same docs cover slow queries and missing indexes.

## Reference Guides

- Skill Feedback → `references/skill-feedback.md` — MUST read when the user reports this skill gave incorrect guidance or missing info.

## Note on berto's App Router integration

Golden pattern (from official guidance + berto's stack): per-request `createServerClient` from `@supabase/ssr` with the cookie store — never the classic `createClient` (drops RLS user context server-side). Regenerate typed client after every migration (`supabase gen types typescript --project-id <ref> --schema public > src/types/database.types.ts`).