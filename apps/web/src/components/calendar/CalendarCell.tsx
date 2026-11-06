import { CalendarCellProps } from './types';
import { format, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export function CalendarCell({
  date,
  slots,
  isSelected,
  isToday,
  isOutsideMonth,
  disabled,
  onClick,
  className = '',
  locale = 'es-AR',
}: CalendarCellProps) {
  const dateFnsLocale = locale === 'es-AR' ? es : enUS;
  const dayNumber = format(date, 'd', { locale: dateFnsLocale });
  const hasAvailability = slots.length > 0;
  const isFullyBooked = slots.length > 0 && slots.every(s => !s.isAvailable);
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  // Determine cell state
  let stateClass = '';
  let ariaLabel = format(date, 'EEEE, d MMMM yyyy', { locale: dateFnsLocale });

  if (disabled || isPast) {
    stateClass = 'opacity-40 cursor-not-allowed';
    ariaLabel += locale === 'es-AR' ? ' (no disponible)' : ' (unavailable)';
  } else if (isFullyBooked) {
    stateClass = 'bg-red-500/20 border-red-500/30 text-red-300';
    ariaLabel += locale === 'es-AR' ? ' (completo)' : ' (fully booked)';
  } else if (hasAvailability) {
    stateClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
    ariaLabel += locale === 'es-AR' ? ' (disponible)' : ' (available)';
  } else {
    stateClass = 'bg-white/5 border-white/10 text-zinc-400';
    ariaLabel += locale === 'es-AR' ? ' (sin horarios)' : ' (no slots)';
  }

  if (isToday) {
    stateClass += ' ring-2 ring-emerald-400';
    ariaLabel += locale === 'es-AR' ? ' (hoy)' : ' (today)';
  }

  if (isSelected) {
    stateClass += ' ring-2 ring-offset-2 ring-offset-zinc-900 ring-emerald-400 bg-emerald-500/30';
    ariaLabel += locale === 'es-AR' ? ' (seleccionado)' : ' (selected)';
  }

  if (isOutsideMonth) {
    stateClass += ' opacity-30';
    ariaLabel += locale === 'es-AR' ? ' (fuera de mes)' : ' (outside month)';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isPast}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-disabled={disabled || isPast}
      className={\`
        relative flex flex-col items-center justify-center min-h-[80px] w-full
        rounded-lg border transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
        touch-manipulation active:scale-[0.98]
        \${stateClass} \${className}
      \`}
    >
      <span className="text-lg font-medium">{dayNumber}</span>
      
      {/* Availability indicator */}
      {!disabled && !isPast && !isOutsideMonth && (
        <div className="mt-1.5 flex items-center justify-center gap-1">
          {hasAvailability && !isFullyBooked && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-[10px] font-mono-khal text-emerald-300">
                {slots.filter(s => s.isAvailable).length}
              </span>
            </>
          )}
          {isFullyBooked && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
      )}
    </button>
  );
}
