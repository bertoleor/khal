# Delta for calendar-exceptions

## ADDED Requirements

### Requirement: Calendar exception manager

The admin MUST create, edit, and delete calendar blocks (holidays, vacations, unplanned events) in a `calendar_exceptions` table, soft-deleted (SCH-03, DB-04).

#### Scenario: Create holiday block

- WHEN an admin creates a holiday block for a date range
- THEN the block persists and is immediately excluded from availability

### Requirement: Exception subtraction from availability

Blocked periods in `calendar_exceptions` MUST be automatically subtracted from the dynamic availability calculation (SCH-01/SCH-03).

#### Scenario: Blocked range not offered

- WHEN a block overlaps offered hours
- THEN no slot within the block is offered to clients

### Requirement: Per-provider exception scope

An exception MUST be able to scope to a specific provider's schedule or to the whole store, reflecting the provider-as-first-class model.

#### Scenario: Provider-scoped vacation

- WHEN a vacation block targets one provider
- THEN only that provider's availability is reduced; other providers remain available