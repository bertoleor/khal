# Delta for bookings

## ADDED Requirements

### Requirement: Guest express reservation

Clients MUST be able to create a booking without an account using an express form (name, phone, email — no password). Account creation MUST be deferred, never a precondition for booking (AUTH-02).

#### Scenario: Guest submits booking

- WHEN a guest submits the express form with name, phone, and email
- THEN a booking is created without requiring authentication or registration
- AND account creation is offered only post-purchase

### Requirement: Strict appointment status enum

Bookings MUST use a strict enum, never boolean flags: `pendiente` (awaiting-payment) → `confirmado` | `cancelado` | `no_asistio`. Manual confirmation is the only path out of `pendiente`; the state remains `pendiente` until an owner/manager explicitly confirms (binding decision 2).

#### Scenario: Manual confirmation gate

- WHEN a booking is created
- THEN it enters `pendiente` and receives no automatic confirmation
- AND it transitions to `confirmado` only after an explicit owner/manager action

### Requirement: Idempotency and spam protection

The booking endpoint MUST enforce idempotency and limit one `pendiente` booking per phone number and per IP. Submission MUST be protected by Turnstile/reCAPTCHA/honeypot plus rate limiting (SEC-03, RLIM-01, WEBHOOKS-01 L1). The submit button MUST disable immediately on click (UX-04).

#### Scenario: Duplicate pending booking rejected

- WHEN a phone/IP already has an active `pendiente` booking
- THEN a new submission is rejected and no duplicate slot is held

#### Scenario: Rapid resubmission prevented

- WHEN a user clicks submit rapidly
- THEN the button disables (`isPending`) and shows an inline spinner, preventing ghost duplicate submissions

### Requirement: Soft deletes and audit trail on mutation

Bookings MUST be soft-deleted (never `DELETE`), and reschedule/cancel actions MUST append to `audit_logs` with before/after snapshots (DB-04, DB-05).

#### Scenario: Cancellation with audit

- WHEN an owner cancels a booking
- THEN the record is soft-deleted and an immutable audit entry records the action with before/after snapshots