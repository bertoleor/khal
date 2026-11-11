import { 
  startOfDay,
  addDays,
  isSameDay,
  format,
  parseISO,
  getSlotsForDay,
  dayHasAvailability,
  dayIsFullyBooked,
  dayIsPast
} from './useCalendar';
import type { CalendarDayProps, CalendarSlot } from './types';
import { es, enUS } from 'date-fns/locale';

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
};

export function CalendarDay({
  date,
  slots,
  selectedDate,
  onDayClick,
  onDateChange,
  locale = 'es-AR',
  className = '',
}: CalendarDayProps) {
  const dateFnsLocale = locale === 'es-AR' ? es : enUS;
  
  const daySlots = getSlotsForDay(slots, date);
  const availableSlots = daySlots.filter(s => s.isAvailable);
  const isToday = isSameDay(date, new Date());
  const isPast = dayIsPast(date);
  const isSelected = selectedDate && isSameDay(date, selectedDate);

  const dayLabel = format(date, 'EEEE, d MMMM yyyy', { locale: dateFnsLocale });
  const shortLabel = format(date, 'EEE d', { locale: dateFnsLocale });

  return (
    <div className={`bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden ${className}`} role="region" aria-label="Vista día">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, -1))}
          aria-label={locale === 'es-AR' ? 'Día anterior' : 'Previous day'}
          disabled={isPast}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-sm font-medium text-white capitalize truncate">{dayLabel}</span>
          {isToday && (
            <span className="text-xs text-emerald-400 font-mono-khal uppercase tracking-wider">
              {locale === 'es-AR' ? 'Hoy' : 'Today'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDateChange(addDays(date, 1))}
          aria-label={locale === 'es-AR' ? 'Día siguiente' : 'Next day'}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {daySlots.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">
              {locale === 'es-AR' ? 'No hay horarios para este día' : 'No slots for this day'}
            </p>
            <p className="text-sm">
              {locale === 'es-AR' 
                ? 'No hay disponibilidad configurada. Selecciona otro día.' 
                : 'No availability configured. Select another day.'}
            </p>
          </div>
        ) : (
          <>
            {availableSlots.length === 0 && daySlots.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-300">
                  {locale === 'es-AR' 
                    ? 'Todos los horarios están ocupados para este día' 
                    : 'All slots are booked for this day'}
                </p>
              </div>
            )}
            
            <ul className="space-y-2" role="list" aria-label="Horarios disponibles">
              {daySlots.map((slot) => (
                <li key={slot.id}>
                  <button
                    type="button"
                    onClick={() => !slot.isAvailable ? undefined : onDayClick(date, [slot])}
                    disabled={!slot.isAvailable || isPast}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 touch-manipulation active:scale-[0.98] ${slot.isAvailable 
                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                        : 'bg-red-500/10 border-red-500/20 text-red-300 cursor-not-allowed opacity-60'}`}
                    aria-label={`${formatTime(slot.startMinutes)}, ${formatDuration(slot.durationMinutes)} ${slot.isAvailable ? '' : 'ocupado'}`}
                    aria-disabled={!slot.isAvailable || isPast}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-start min-w-[80px]">
                        <span className="text-xl font-mono-khal font-semibold tabular-nums text-white">
                          {formatTime(slot.startMinutes)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatDuration(slot.durationMinutes)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        {slot.isAvailable ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
                            <span className="text-sm font-medium text-emerald-300">
                              {locale === 'es-AR' ? 'Disponible' : 'Available'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" aria-hidden="true" />
                            <span className="text-sm font-medium text-red-300">
                              {locale === 'es-AR' ? 'Ocupado' : 'Booked'}
                            </span>
                          </>
                        )}
                      </div>

                      <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {!slot.isAvailable && (
                      <span className="text-sm text-red-400 ml-auto">
                        {locale === 'es-AR' ? 'No disponible' : 'Unavailable'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/10 bg-white/5">
        <p className="text-xs text-zinc-500 text-center">
          {locale === 'es-AR' 
            ? 'Volver a vista mes para ver disponibilidad completa' 
            : 'Back to month view for full availability'}
        </p>
      </div>
    </div>
  );
}
