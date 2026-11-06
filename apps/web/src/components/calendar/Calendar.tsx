import { CalendarProps } from './types';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarWeek } from './CalendarWeek';
import { CalendarDay } from './CalendarDay';
import { SlotPicker } from './SlotPicker';
import { useCalendar } from './useCalendar';
import { useState } from 'react';

export function Calendar({
  serviceId,
  slots,
  onDateSelect,
  onSlotSelect,
  locale = 'es-AR',
  className = '',
  view = 'month',
  onViewChange,
  weekStart,
  onWeekChange,
  dayDate,
  onDayChange,
}: CalendarProps) {
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [selectedDaySlots, setSelectedDaySlots] = useState<CalendarProps['slots']>([]);

  const {
    currentMonth,
    selectedDate,
    selection,
    days,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    selectSlot,
    clearSelection,
  } = useCalendar(slots, undefined, locale);

  // Use controlled or uncontrolled week/day
  const effectiveWeekStart = weekStart ?? startOfWeek(currentMonth, { weekStartsOn: 1 });
  const effectiveDayDate = dayDate ?? selectedDate ?? new Date();

  const handleDayClick = (date: Date, daySlots: typeof slots) => {
    selectDate(date);
    if (daySlots.length > 0) {
      setSelectedDaySlots(daySlots);
      setShowSlotPicker(true);
    }
    onDateSelect?.(date, daySlots);
  };

  const handleSlotSelect = (slot: typeof slots[0]) => {
    selectSlot(slot.id);
    onSlotSelect?.(slot);
    setShowSlotPicker(false);
  };

  const handleSlotPickerClose = () => {
    setShowSlotPicker(false);
    if (!selection?.slotId) {
      clearSelection();
    }
  };

  // Import startOfWeek from date-fns
  const { startOfWeek } = require('date-fns');

  return (
    <div className={\`bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden \${className}\`} role="region" aria-label="Calendario de reservas">
      {/* Header with navigation */}
      <CalendarHeader
        month={view === 'month' ? currentMonth : effectiveWeekStart}
        onPrev={view === 'month' ? goToPrevMonth : () => onWeekChange?.(subWeeks(effectiveWeekStart, 1))}
        onNext={view === 'month' ? goToNextMonth : () => onWeekChange?.(addWeeks(effectiveWeekStart, 1))}
        onToday={view === 'month' ? goToToday : () => onWeekChange?.(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        locale={locale}
      />

      {/* View toggle */}
      {onViewChange && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-white/5">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              aria-pressed={view === v}
              className={\`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
                min-h-[44px] touch-manipulation
                \${view === v
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }\`}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
          ))}
        </div>
      )}

      {/* View content */}
      {view === 'month' && (
        <>
          <CalendarGrid
            month={currentMonth}
            slots={slots}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            locale={locale}
          />

          {/* Slot Picker Modal/Bottom Sheet */}
          {showSlotPicker && selectedDate && (
            <SlotPicker
              date={selection!.date}
              serviceId={serviceId}
              slots={selectedDaySlots}
              onSelect={handleSlotSelect}
              onClose={handleSlotPickerClose}
            />
          )}

          {/* Empty state message */}
          {!selectedDate && slots.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-500">
              <p className="text-sm">
                {locale === 'es-AR' 
                  ? 'No hay horarios disponibles para este servicio' 
                  : 'No slots available for this service'}
              </p>
            </div>
          )}
        </>
      )}

      {view === 'week' && (
        <CalendarWeek
          weekStart={effectiveWeekStart}
          slots={slots}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
          onWeekChange={onWeekChange ?? (() => {})}
          locale={locale}
        />
      )}

      {view === 'day' && (
        <CalendarDay
          date={effectiveDayDate}
          slots={slots}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
          onDateChange={onDayChange ?? (() => {})}
          locale={locale}
        />
      )}
    </div>
  );
}

// Import subWeeks, addWeeks, startOfWeek for the inline handlers
import { subWeeks, addWeeks, startOfWeek } from 'date-fns';
