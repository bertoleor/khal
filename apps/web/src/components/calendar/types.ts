import type { DayPickerProps } from 'react-day-picker';

export interface CalendarSlot {
  id: string;
  serviceId: string;
  date: string;
  startMinutes: number;
  durationMinutes: number;
  isAvailable: boolean;
  providerId?: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
  slots: CalendarSlot[];
}

export interface CalendarSelection {
  date: string;
  slotId?: string;
}

export interface SlotPickerProps {
  date: string;
  serviceId: string;
  slots: CalendarSlot[];
  onSelect: (slot: CalendarSlot) => void;
  onClose: () => void;
  className?: string;
}

export interface CalendarCellProps {
  date: Date;
  slots: CalendarSlot[];
  isSelected: boolean;
  isToday: boolean;
  isOutsideMonth: boolean;
  disabled: boolean;
  onClick: () => void;
  className?: string;
  locale?: 'es-AR' | 'en';
}

export interface CalendarHeaderProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  locale?: 'es-AR' | 'en';
  className?: string;
}

export interface CalendarGridProps {
  month: Date;
  slots: CalendarSlot[];
  selectedDate?: Date;
  onDayClick: (date: Date, slots: CalendarSlot[]) => void;
  locale?: 'es-AR' | 'en';
  className?: string;
}

export interface CalendarWeekProps {
  weekStart: Date;
  slots: CalendarSlot[];
  selectedDate?: Date;
  onDayClick: (date: Date, slots: CalendarSlot[]) => void;
  onWeekChange: (weekStart: Date) => void;
  locale?: 'es-AR' | 'en';
  className?: string;
}

export interface CalendarDayProps {
  date: Date;
  slots: CalendarSlot[];
  selectedDate?: Date;
  onDayClick: (date: Date, slots: CalendarSlot[]) => void;
  onDateChange: (date: Date) => void;
  locale?: 'es-AR' | 'en';
  className?: string;
}

export interface CalendarProps {
  serviceId: string;
  slots: CalendarSlot[];
  onDateSelect?: (date: Date, slots: CalendarSlot[]) => void;
  onSlotSelect?: (slot: CalendarSlot) => void;
  locale?: 'es-AR' | 'en';
  className?: string;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  weekStart?: Date;
  onWeekChange?: (weekStart: Date) => void;
  dayDate?: Date;
  onDayChange?: (date: Date) => void;
}
