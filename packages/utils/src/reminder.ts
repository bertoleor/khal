export interface ReminderParams {
  nombre: string;
  hora: string;
}

/** Polite live-region role for the reminder announcement (never "alert"). */
export const REMINDER_LIVE_ROLE = 'status' as const;

/** Reservation reminder copy in es-AR voseo. */
export function formatReminderEsAR({ nombre, hora }: ReminderParams): string {
  return `Che, ${nombre}, te recordamos tu reserva de las ${hora}.`;
}
