const TIME_24H_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Format a `HH:mm` 24h string as es-AR `"H:MM h"`.
 * Pure function: no Intl, no Date, no timezone reads.
 * @throws {RangeError} when `input` is not a valid 24h `HH:mm`.
 */
export function formatTimeEsAR(input: string): string {
  const match = TIME_24H_RE.exec(input);
  if (match === null) {
    throw new RangeError(`Invalid time: ${input}`);
  }
  const hour = Number(match[1]);
  const minutes = input.slice(3, 5);
  return `${hour}:${minutes} h`;
}

/** Appointment message with rioplatense voseo. */
export function turnoMessage(hhmm: string): string {
  return `Tenés turno a las ${formatTimeEsAR(hhmm)}`;
}
