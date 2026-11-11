import { useState, useCallback, useMemo } from 'react';
import { 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  startOfDay,
  addDays,
  addWeeks,
  subWeeks,
  isSameWeek,
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
  currentMonth: Date;
  selectedDate: Date | null;
  selection: CalendarSelection | null;
  monthSlots: CalendarSlot[];
  days: Date[];
  monthLabel: string;
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
  
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  const monthSlots = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return slotDate >= monthStart && slotDate <= monthEnd;
    });
  }, [slots, currentMonth]);
  
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: dateFnsLocale });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale: dateFnsLocale });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth, locale]);
  
  const monthLabel = useMemo(() => {
    return format(currentMonth, 'LLLL yyyy', { locale: dateFnsLocale });
  }, [currentMonth, locale]);
  
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

export function getSlotsForDay(
  slots: CalendarSlot[],
  date: Date
): CalendarSlot[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  return slots.filter(slot => slot.date === dateStr && slot.isAvailable);
}

export function dayHasAvailability(
  slots: CalendarSlot[],
  date: Date
): boolean {
  return getSlotsForDay(slots, date).length > 0;
}

export function dayIsFullyBooked(
  slots: CalendarSlot[],
  date: Date
): boolean {
  const daySlots = slots.filter(slot => slot.date === format(date, 'yyyy-MM-dd'));
  return daySlots.length > 0 && daySlots.every(s => !s.isAvailable);
}

export function dayIsPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

// Export date-fns helpers for components
export { 
  subMonths, 
  addMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  format, 
  parseISO,
  startOfDay,
  addDays,
  addWeeks,
  subWeeks,
  isSameWeek
} from 'date-fns';
