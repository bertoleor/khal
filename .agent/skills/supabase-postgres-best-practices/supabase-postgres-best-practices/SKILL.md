---
name: supabase-postgres-best-practices
description: "Postgres best practices from Supabase: indexes, RLS, PKs, pooling."
license: MIT
metadata:
  author: supabase
  version: "1.1.1"
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Rules across 8 categories, prioritized by impact.

Source: official `supabase/agent-skills` repo, `skills/supabase-postgres-best-practices/`. Full reference set (30+ files) lives in the source repo; only the CRITICAL/HIGH-impact rules are inlined below. For the rest, fetch `https://raw.githubusercontent.com/supabase/agent-skills/main/skills/supabase-postgres-best-practices/references/<name>.md`.

## When to Apply

- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|---|---|---|---|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## References (full list in source repo)

- `references/query-missing-indexes.md` (inlined below)
- `references/query-partial-indexes.md`
- `references/query-composite-indexes.md`
- `references/query-index-types.md`
- `references/conn-pooling.md` / `conn-limits.md` / `conn-prepared-statements.md` / `conn-idle-timeout.md`
- `references/security-rls-basics.md` (inlined below)
- `references/security-rls-performance.md` / `security-privileges.md`
- `references/schema-primary-keys.md` (inlined below)
- `references/schema-constraints.md` / `schema-foreign-key-indexes.md` / `schema-partitioning.md`
- `references/lock-advisory.md`
- `references/data-n-plus-one.md` / `data-batch-inserts.md` / `data-pagination.md` / `data-upsert.md`
- `references/monitor-explain-analyze.md` / `monitor-pg-stat-statements.md` / `monitor-vacuum-analyze.md`
- `references/advanced-full-text-search.md` / `advanced-jsonb-indexing.md`

## Rule: Add Indexes on WHERE and JOIN Columns (CRITICAL)

Queries filtering or joining on unindexed columns cause full table scans, which become exponentially slower as tables grow.

Incorrect (sequential scan on large table):
```sql
select * from orders where customer_id = 123;
-- EXPLAIN: Seq Scan on orders (cost=0.00..25000.00 ...)
```

Correct (index scan):
```sql
create index orders_customer_id_idx on orders (customer_id);
select * from orders where customer_id = 123;
-- EXPLAIN: Index Scan using orders_customer_id_idx (...)
```

For JOIN columns, always index the foreign key side:
```sql
create index orders_customer_id_idx on orders (customer_id);
select c.name, o.total from customers c join orders o on o.customer_id = c.id;
```

## Rule: Enable RLS for Multi-Tenant Data (CRITICAL)

RLS enforces data access at the database level, ensuring users only see their own data.

Incorrect (application-level filtering only — a bug exposes all rows):
```sql
select * from orders where user_id = $current_user_id;
select * from orders;  -- Returns ALL orders if filtering bypassed
```

Correct (database-enforced RLS):
```sql
alter table orders enable row level security;
create policy orders_user_policy on orders
  for all to authenticated
  using (user_id = auth.uid());
alter table orders force row level security;
```

## Rule: Select Optimal Primary Key Strategy (HIGH)

Primary key choice affects insert performance, index size, and replication efficiency.

Guidelines:
- **Single database** → `bigint generated always as identity` (sequential, 8 bytes, SQL-standard).
- **Distributed/exposed IDs** → UUIDv7 (`create extension pg_uuidv7;` then `uuid_generate_v7()`) or ULID — time-ordered, no fragmentation.
- **Avoid random UUIDv4 as PK on large tables** — random = scattered inserts = index fragmentation.
- `serial` works but `identity` is SQL-standard and preferred for new apps.

```sql
-- Identity (preferred for single DB)
create table users (
  id bigint generated always as identity primary key
);

-- UUIDv7 for distributed systems
create extension pg_uuidv7;
create table orders (
  id uuid default uuid_generate_v7() primary key
);
```

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security