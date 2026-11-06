import { CalendarGridProps } from './types';
import { CalendarCell } from './CalendarCell';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  getSlotsForDay,
  dayHasAvailability,
  dayIsFullyBooked,
  dayIsPast
} from './useCalendar';
import { es, enUS } from 'date-fns/locale';

export function CalendarGrid({
  month,
  slots,
  selectedDate,
  onDayClick,
  locale = 'es-AR',
  className = '',
}: CalendarGridProps) {
  const dateFnsLocale = locale === 'es-AR' ? es : enUS;
  
  // Weekday headers (Monday start for AR)
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const weekdayLabels = locale === 'es-AR' 
    ? weekdays 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate calendar days
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: dateFnsLocale });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale: dateFnsLocale });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className={\`overflow-x-auto \${className}\`} role="grid" aria-label="Calendario">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 border-b border-white/10 px-2 py-2">
        {weekdayLabels.map((day, i) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider"
            role="columnheader"
            aria-label={locale === 'es-AR' ? weekdays[i] : weekdayLabels[i]}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0 p-2" role="rowgroup">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="contents" role="row">
            {week.map((day, dayIndex) => {
              const daySlots = getSlotsForDay(slots, day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const isOutsideMonth = !isSameMonth(day, month);
              const disabled = dayIsPast(day) || isOutsideMonth;

              return (
                <CalendarCell
                  key={\`\${day.toISOString()}-\${dayIndex}\`}
                  date={day}
                  slots={daySlots}
                  isSelected={isSelected}
                  isToday={isToday}
                  isOutsideMonth={isOutsideMonth}
                  disabled={disabled}
                  onClick={() => !disabled && onDayClick(day, daySlots)}
                  locale={locale}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
