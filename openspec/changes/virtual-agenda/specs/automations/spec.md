# Delta for automations

## ADDED Requirements

### Requirement: Async WhatsApp reminder 24h before

The system MUST dispatch a WhatsApp reminder 24 hours before a confirmed appointment, asynchronously via Database Webhooks → n8n or Upstash QStash — never synchronously in the user request path (RES-03, NOTIF-01, JOBS-01).

#### Scenario: Reminder scheduled

- WHEN a booking is confirmed
- THEN a reminder is scheduled for 24h prior, rendered in the recipient's locale and timezone at send time (I18N-COMM-01, TZ-02)

### Requirement: Async Telegram admin alert

New bookings and confirmations MUST trigger a Telegram alert to admins asynchronously, also via n8n/QStash.

#### Scenario: Alert on new booking

- WHEN a new booking is created
- THEN an admin Telegram alert is queued asynchronously without blocking the client response

### Requirement: Non-blocking third-party dispatch

All third-party dispatch MUST be decoupled so the user request completes in under 200ms; external failures MUST NOT affect the user-facing response (RES-03).

#### Scenario: External service down

- WHEN n8n or the notification provider is down
- THEN the booking request still succeeds and the notification is queued/retried without surfacing an error to the client