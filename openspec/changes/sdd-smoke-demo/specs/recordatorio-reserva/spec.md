# Spec: recordatorio-reserva (reminder copy)

## SHALL
- The reminder copy MUST use es-AR voseo and include the `{nombre}` and
  `{hora}` slots.
- The reminder announcement MUST use a polite live region (`role="status"`).

## Scenarios

### Reminder copy renders with slots
- **Given** a confirmed booking for "Lucía" at "18:30"
- **When** the reminder copy is resolved
- **Then** the text SHALL be "Che, Lucía, te recordamos tu reserva de las 18:30."

### Announcement is polite
- **Given** the reminder copy is displayed
- **When** a screen reader encounters it
- **Then** it MUST be exposed via `role="status"` and MUST NOT use
  `role="alert"`.
