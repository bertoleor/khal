import { useState, useCallback, useMemo } from 'react';
import { 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  parseISO
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { CalendarSlot, CalendarMonth, CalendarSelection } from './types';

export interface UseCalendarReturn {
  // State
  currentMonth: Date;
  selectedDate: Date | null;
  selection: CalendarSelection | null;
  
  // Computed
  monthSlots: CalendarSlot[];
  days: Date[];
  monthLabel: string;
  
  // Actions
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  selectDate: (date: Date) => void;
  selectSlot: (slotId: string) => void;
  clearSelection: () => void;
  setMonth: (date: Date) => void;
}

export function useCalendar(
  slots: CalendarSlot[],
  initialMonth?: Date,
  locale: 'es-AR' | 'en' = 'es-AR'
): UseCalendarReturn {
  const dateFnsLocale = locale === 'es-AR' ? es : enUS;
  
  // State
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  // Filter slots for current month
  const monthSlots = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return slotDate >= monthStart && slotDate <= monthEnd;
    });
  }, [slots, currentMonth]);
  
  // Generate calendar days (including padding days from prev/next month)
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: dateFnsLocale }); // Monday start for AR
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale: dateFnsLocale });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth, locale]);
  
  // Month label for header
  const monthLabel = useMemo(() => {
    return format(currentMonth, 'LLLL yyyy', { locale: dateFnsLocale });
  }, [currentMonth, locale]);
  
  // Navigation
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);
  
  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);
  
  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);
  
  const setMonth = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);
  
  // Selection
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedSlotId(null);
  }, []);
  
  const selectSlot = useCallback((slotId: string) => {
    setSelectedSlotId(slotId);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedDate(null);
    setSelectedSlotId(null);
  }, []);
  
  // Build selection object
  const selection = useMemo((): CalendarSelection | null => {
    if (!selectedDate) return null;
    return {
      date: format(selectedDate, 'yyyy-MM-dd'),
      slotId: selectedSlotId ?? undefined,
    };
  }, [selectedDate, selectedSlotId]);
  
  return {
    currentMonth,
    selectedDate,
    selection,
    monthSlots,
    days,
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    selectSlot,
    clearSelection,
    setMonth,
  };
}

// Helper to get slots for a specific day
export function getSlotsForDay(
  slots: CalendarSlot[],
  date: Date
): CalendarSlot[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  return slots.filter(slot => slot.date === dateStr && slot.isAvailable);
}

// Helper to check if day has available slots
export function dayHasAvailability(
  slots: CalendarSlot[],
  date: Date
): boolean {
  return getSlotsForDay(slots, date).length > 0;
}

// Helper to check if day is fully booked
export function dayIsFullyBooked(
  slots: CalendarSlot[],
  date: Date
): boolean {
  const daySlots = slots.filter(slot => slot.date === format(date, 'yyyy-MM-dd'));
  return daySlots.length > 0 && daySlots.every(s => !s.isAvailable);
}

// Helper to check if day is in the past
export function dayIsPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}
