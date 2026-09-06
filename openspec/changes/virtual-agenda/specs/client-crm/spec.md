# Delta for client-crm

## ADDED Requirements

### Requirement: Client entity from guests

The system MUST persist a client entity derived from guest bookings, linkable to an eventual auth account, with no physical deletion (DB-04).

#### Scenario: Guest becomes client record

- WHEN a guest books
- THEN a client record is created (or matched by phone/email) and linked to the booking

### Requirement: Visual tags and per-appointment notes

The admin MUST attach visual tags to clients and write per-appointment notes.

#### Scenario: Tag and note applied

- WHEN an admin tags a client (e.g. "VIP") and adds a note to an appointment
- THEN both persist and render in the CRM view

### Requirement: LTV aggregation

The admin CRM MUST aggregate client LTV, last activity, and history in a single query via SQL joins (no N+1, DB-06 / ADMIN-06).

#### Scenario: Customer 360 aggregation

- WHEN an admin opens a client profile
- THEN LTV, last login, and purchase/booking history aggregate in one round-trip without per-row loops

### Requirement: Blacklist and no-show source of truth

The client record MUST be the source of truth for no-show count and blacklist status; the admission filter (bookings/payment) MUST consult it (>2 `no_asistio` OR `is_blacklisted` → reject).

#### Scenario: No-show threshold reached

- WHEN a client's no-show count exceeds 2
- THEN the CRM marks the client for blacklist and future bookings are rejected