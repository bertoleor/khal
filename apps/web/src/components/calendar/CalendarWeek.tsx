import type { CalendarWeekProps, CalendarSlot } from './types';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfDay,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isSameWeek,
  format,
  parseISO,
  getSlotsForDay,
  dayHasAvailability,
  dayIsFullyBooked,
  dayIsPast
} from './useCalendar';
import { es, enUS } from 'date-fns/locale';

export function CalendarWeek({
  weekStart,
  slots,
  selectedDate,
  onDayClick,
  onWeekChange,
  locale = 'es-AR',
  className = '',
}: CalendarWeekProps) {
  const dateFnsLocale = locale === 'es-AR' ? es : enUS;
  
  const weekdays = locale === 'es-AR' 
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1, locale: dateFnsLocale });
  const days: Date[] = [];
  let currentDay = startOfDay(weekStart);
  while (currentDay <= weekEnd) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  const weekLabel = `${format(weekStart, 'd MMM', { locale: dateFnsLocale })} - ${format(weekEnd, 'd MMM yyyy', { locale: dateFnsLocale })}`;
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1, locale: dateFnsLocale });

  return (
    <div className={`bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden ${className}`} role="region" aria-label="Vista semana">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={() => onWeekChange(subWeeks(weekStart, 1))}
          aria-label={locale === 'es-AR' ? 'Semana anterior' : 'Previous week'}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1 min-w-0">
          <span className="text-sm font-medium text-white capitalize truncate">{weekLabel}</span>
          {isCurrentWeek && (
            <span className="text-xs text-emerald-400 font-mono-khal uppercase tracking-wider">
              {locale === 'es-AR' ? 'Semana actual' : 'Current week'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onWeekChange(addWeeks(weekStart, 1))}
          aria-label={locale === 'es-AR' ? 'Semana siguiente' : 'Next week'}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 border-b border-white/10 px-2 py-2">
        {weekdays.map((day, i) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider"
            role="columnheader"
            aria-label={locale === 'es-AR' ? ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 p-2 min-h-[400px]" role="rowgroup">
        {days.map((day, dayIndex) => {
          const daySlots = getSlotsForDay(slots, day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const disabled = dayIsPast(day);

          const hasAvailability = dayHasAvailability(slots, day);
          const isFullyBooked = dayIsFullyBooked(slots, day);
          const isPast = dayIsPast(day);

          let stateClass = '';
          let ariaLabel = format(day, 'EEEE, d MMMM yyyy', { locale: dateFnsLocale });

          if (disabled || isPast) {
            stateClass = 'opacity-40 cursor-not-allowed';
            ariaLabel += locale === 'es-AR' ? ' (no disponible)' : ' (unavailable)';
          } else if (isFullyBooked) {
            stateClass = 'bg-red-500/10 border-red-500/20';
            ariaLabel += locale === 'es-AR' ? ' (completo)' : ' (fully booked)';
          } else if (hasAvailability) {
            stateClass = 'bg-emerald-500/10 border-emerald-500/20';
            ariaLabel += locale === 'es-AR' ? ' (disponible)' : ' (available)';
          } else {
            stateClass = 'bg-white/5 border-white/10';
            ariaLabel += locale === 'es-AR' ? ' (sin horarios)' : ' (no slots)';
          }

          if (isToday) {
            stateClass += ' ring-2 ring-emerald-400';
            ariaLabel += locale === 'es-AR' ? ' (hoy)' : ' (today)';
          }

          if (isSelected) {
            stateClass += ' ring-2 ring-offset-2 ring-offset-zinc-900 ring-emerald-400 bg-emerald-500/20';
            ariaLabel += locale === 'es-AR' ? ' (seleccionado)' : ' (selected)';
          }

          return (
            <div key={`${day.toISOString()}-${dayIndex}`} className="flex flex-col min-w-0" role="gridcell">
              <button
                type="button"
                onClick={() => !disabled && onDayClick(day, daySlots)}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-selected={isSelected}
                aria-disabled={disabled}
                className={`flex flex-col items-center justify-start min-h-[120px] w-full p-2 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 touch-manipulation active:scale-[0.98] ${stateClass}`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-sm font-medium">{format(day, 'd', { locale: dateFnsLocale })}</span>
                  {isToday && (
                    <span className="text-[10px] font-mono-khal text-emerald-400 uppercase">
                      {locale === 'es-AR' ? 'Hoy' : 'Today'}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto w-full space-y-1.5 min-h-0">
                  {daySlots.length === 0 ? (
                    <span className="text-xs text-zinc-600 text-center w-full py-4">
                      {locale === 'es-AR' ? 'Sin horarios' : 'No slots'}
                    </span>
                  ) : (
                    daySlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!slot.isAvailable) return;
                          onDayClick(day, [slot]);
                        }}
                        disabled={!slot.isAvailable || disabled}
                        className={`w-full px-2 py-1.5 text-left rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 touch-manipulation ${slot.isAvailable 
                            ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' 
                            : 'bg-red-500/10 text-red-300 border border-red-500/20 cursor-not-allowed opacity-60'
                          }`}
                        aria-label={`${format(slot.startMinutes / 60, '00')}: ${slot.durationMinutes}min ${slot.isAvailable ? '' : ' no disponible'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-khal tabular-nums">
                            ${format(slot.startMinutes, '00', { locale: dateFnsLocale })}:${format((slot.startMinutes % 60), '00', { locale: dateFnsLocale })}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            ${slot.durationMinutes >= 60 
                              ? `${Math.floor(slot.durationMinutes / 60)}h ${slot.durationMinutes % 60}min`
                              : `${slot.durationMinutes}min`}
                          </span>
                        </div>
                        {!slot.isAvailable && (
                          <span className="text-[10px] text-red-400">Ocupado</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
