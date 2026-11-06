import { DayPickerProps } from 'react-day-picker';

export interface CalendarSlot {
  id: string;
  serviceId: string;
  date: string;           // YYYY-MM-DD
  startMinutes: number;   // 0-1439
  durationMinutes: number;
  isAvailable: boolean;
  providerId?: string;
}

export interface CalendarMonth {
  year: number;
  month: number;          // 0-11
  slots: CalendarSlot[];  // Para pintar disponibilidad
}

export interface CalendarSelection {
  date: string;           // Día seleccionado (YYYY-MM-DD)
  slotId?: string;        // Slot elegido (opcional)
}

export interface SlotPickerProps {
  date: string;           // YYYY-MM-DD
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
}

export interface CalendarHeaderProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  locale?: string;
  className?: string;
}

export interface CalendarGridProps {
  month: Date;
  slots: CalendarSlot[];
  selectedDate?: Date;
  onDayClick: (date: Date, slots: CalendarSlot[]) => void;
  locale?: string;
  className?: string;
}

// Extend react-day-picker props for our customization
export interface CalendarProps extends Omit<DayPickerProps, 'components' | 'classNames'> {
  serviceId: string;
  slots: CalendarSlot[];
  onDateSelect?: (date: Date, slots: CalendarSlot[]) => void;
  onSlotSelect?: (slot: CalendarSlot) => void;
  locale?: 'es-AR' | 'en';
  className?: string;
  // View mode
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
}
