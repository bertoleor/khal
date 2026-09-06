# Delta for booking-engine

## ADDED Requirements

### Requirement: Dynamic availability calculation

Availability MUST be computed in real time and MUST NOT be pre-generated as empty database rows (SCH-01). The formula is: (Business Hours + Personal Schedule) − (Confirmed Appointments + Blocked Exceptions).

#### Scenario: Slot grid rendering

- WHEN a client requests availability for a day
- THEN the system computes open slots dynamically from business hours minus confirmed appointments and calendar exceptions
- AND never reads pre-generated slot rows

### Requirement: Service duration and buffer blocking

Each service MUST declare `duration_minutes` and `buffer_minutes`. Adjacent slots MUST be blocked automatically to account for the service duration plus buffer (SCH-02).

#### Scenario: Duration + buffer blocks neighboring slots

- WHEN a 60-minute service with a 15-minute buffer is booked at 10:00
- THEN slots from 10:00 through 11:15 are unavailable to other clients for that provider

### Requirement: Provider as first-class entity

The system MUST model providers as a distinct first-class entity (a `providers` table/concept) with independent schedules, services, and availability. No schema or logic may hardcode a single provider, even though this release ships only one.

#### Scenario: Multiple providers with separate schedules

- WHEN a second provider is introduced in the future
- THEN it has its own schedule and service list without schema changes or single-provider assumptions

### Requirement: UTC storage with fixed business timezone

All datetimes MUST be stored in UTC (DB-01). Availability MUST be calculated against the business timezone `America/Argentina/Buenos_Aires` (TZ-01/TZ-02), and the selected slot converted back to UTC before persistence.

#### Scenario: Timezone-correct slot persistence

- WHEN a client selects 14:00 local Buenos Aires time
- THEN the stored booking is the UTC equivalent, and display converts back to the recipient's timezone

### Requirement: Double-booking prevention

Booking slot acquisition MUST use `SELECT ... FOR UPDATE` row locking inside a serializable transaction so that two concurrent clients cannot claim the same slot (CONCURRENCIA-01 Level 2).

#### Scenario: Concurrent booking race

- WHEN two clients submit the same slot simultaneously
- THEN exactly one acquires the lock and the other is rejected with an explicit conflict result
- AND no double-booking is possible under concurrent load

### Requirement: Ghost-turn TTL release

A tentatively-held slot (`Bloqueado_Temporalmente` ghost lock) MUST be released automatically if the booking remains pending beyond 15 minutes. A cron job MUST run every 5 minutes to detect and release expired locks (JOBS-01).

#### Scenario: Stuck pending slot released

- WHEN a booking stays `pendiente` longer than 15 minutes
- THEN a 5-minute cron releases the temporary slot hold and returns it to availability
- AND the `pendiente` booking record is retained for manual owner review

### Requirement: Calendar exception subtraction

Blocked periods from `calendar_exceptions` MUST be excluded from the availability calculation (SCH-03).

#### Scenario: Holiday excluded

- WHEN a holiday is blocked in `calendar_exceptions`
- THEN slots overlapping that period are never offered regardless of business hours