# Delta for admin-operations

## ADDED Requirements

### Requirement: Operations calendar views

The admin MUST render an operations calendar in Day and Week views with appointment cards and status dots (yellow = pending, green = confirmed). On mobile, complex tables MUST collapse to card layouts (ADMIN-02).

#### Scenario: Day/week calendar

- WHEN an admin opens the operations calendar
- THEN appointments render as cards with status dots, switchable between Day and Week views

### Requirement: Catalog and bulk management

The admin MUST edit price, toggle visibility, add services, and apply bulk actions through server actions that always persist to the database (no dead buttons, ADMIN-01).

#### Scenario: Price edit with audit

- WHEN an admin changes a service price
- THEN the change persists and appends an immutable `audit_logs` entry (DB-05)

### Requirement: RBAC on admin routes

Every `/admin/*` route MUST be protected by server middleware verifying role on each request; the server is always the authority (ADMIN-04). Every server action MUST validate authentication, resource ownership, and Zod input (ARCH-05).

#### Scenario: Unauthorized admin access

- WHEN a viewer-role or unauthenticated user accesses an admin mutation
- THEN the server rejects it; client-side hiding is never trusted as security

### Requirement: Confirm, reschedule, cancel with audit trail

Admin booking actions (confirm payment → green, reschedule, cancel) MUST mutate state through the strict enum and record audit entries.

#### Scenario: Reschedule

- WHEN an admin reschedules a booking to a new slot
- THEN the slot change is validated against availability and recorded in `audit_logs`