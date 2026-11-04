# Feature: khal-admin-operable

## Objective
Make khal admin panel production-ready: tests pass, mock stores replaced with Supabase, error boundaries, pagination, accessibility AA, bundle optimization.

## Branch
main

## Delivery Strategy
ask-on-risk

## Test Runner
pnpm test (vitest)

## Specs

### S1: Services server actions contract (services-actions.test.ts)
All 9 failing tests in apps/admin/test/services-actions.test.ts must pass:
- createService inserts organization_id from session
- createService rejects empty name (zod gate)
- createService rejects non-integer price (zod gate)
- createService rejects deposit_mode=fixed without deposit_fixed_cents
- updateService rejects invalid duration without UPDATE call
- uploadServicePhoto rejects non-image MIME before upload
- uploadServicePhoto rejects files > 4MB before upload
- uploadServicePhoto accepts valid image and returns public URL
- bulkIncrease upserts +10% on fetched prices

### S2: Replace mock stores with Supabase-backed implementations
- appointmentsStore → real Supabase appointments table with RLS
- clientsStore → real Supabase clients table with RLS
- Both must implement Store<T> interface from action-base.ts
- Mutations must persist and survive page reload/server restart

### S3: Error boundaries for admin routes
- Add error.tsx and global-error.tsx to admin route segments
- Graceful degradation when components crash

### S4: Pagination for service list
- ServiceManager must paginate (not render all)
- First Load JS for /admin/servicios must drop from 282 kB

### S5: Accessibility AA audit for admin
- All interactive elements: focus-visible ring with token
- Proper aria-* labels on modals, tables, form fields
- Contrast ratios meet WCAG 2.2 AA
- Keyboard navigation works for all flows

### S6: Bundle optimization for admin/servicios
- Lazy-load RichTextEditor (Tiptap) - code split
- Target First Load JS < 200 kB

## Tasks

| ID | Specs | Route | Commit |
|----|-------|-------|--------|
| T1 | S1 | inline | 59f87d0 |
| T2 | S2 | inline | 0d8954a |
| T3 | S3 | inline | 5570097 |
| T4 | S4 | inline |        |
| T5 | S5 | inline |        |
| T6 | S6 | inline |        |

## Log

L1: User requested all improvements with ODD+TDD
L2: T1 complete - services actions contract tests pass (13/13), TS clean
L3: T2 complete - mock stores replaced with Supabase-backed implementations (appointments, clients), Store interface async
L4: T3 complete - admin error boundaries verified (error.tsx, not-found.tsx at admin root catch all nested routes)
