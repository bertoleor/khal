import { describe, it, expect, vi, beforeEach, act } from 'vitest';
import { renderHook, act as renderHookAct } from '@testing-library/react';
import { useCalendar, getSlotsForDay, dayHasAvailability, dayIsFullyBooked, dayIsPast } from '../useCalendar';
import type { CalendarSlot } from '../types';

// Mock slots with dates matching format 'yyyy-MM-dd'
const mockSlots: CalendarSlot[] = [
  { id: '1', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 540, durationMinutes: 60, isAvailable: true },
  { id: '2', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 600, durationMinutes: 60, isAvailable: true },
  { id: '3', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 660, durationMinutes: 60, isAvailable: false },
  { id: '4', serviceId: 'svc-1', date: '2026-01-16', startMinutes: 540, durationMinutes: 60, isAvailable: true },
  { id: '5', serviceId: 'svc-1', date: '2026-01-16', startMinutes: 600, durationMinutes: 60, isAvailable: false },
  { id: '6', serviceId: 'svc-1', date: '2026-01-16', startMinutes: 660, durationMinutes: 60, isAvailable: false },
];

// Add a fully booked day (2026-01-17) - all slots unavailable
const fullyBookedSlot: CalendarSlot = { id: '7', serviceId: 'svc-1', date: '2026-01-17', startMinutes: 540, durationMinutes: 60, isAvailable: false };
const mockSlotsWithFullyBooked = [...mockSlots, fullyBookedSlot];

describe('useCalendar helpers', () => {
  describe('getSlotsForDay', () => {
    it('returns only available slots for a given day', () => {
      const slots = getSlotsForDay(mockSlots, new Date('2026-01-15'));
      expect(slots).toHaveLength(2);
      expect(slots.every(s => s.isAvailable)).toBe(true);
      expect(slots.map(s => s.startMinutes)).toEqual([540, 600]);
    });

    it('returns empty array for day with no slots', () => {
      const slots = getSlotsForDay(mockSlots, new Date('2026-01-20'));
      expect(slots).toHaveLength(0);
    });

    it('returns empty array for day with only unavailable slots', () => {
      const slots = getSlotsForDay(mockSlotsWithFullyBooked, new Date('2026-01-17'));
      expect(slots).toHaveLength(0);
    });
  });

  describe('dayHasAvailability', () => {
    it('returns true when day has available slots', () => {
      expect(dayHasAvailability(mockSlots, new Date('2026-01-15'))).toBe(true);
      expect(dayHasAvailability(mockSlots, new Date('2026-01-16'))).toBe(true);
    });

    it('returns false when day has no available slots', () => {
      expect(dayHasAvailability(mockSlotsWithFullyBooked, new Date('2026-01-17'))).toBe(false);
    });
  });

  describe('dayIsFullyBooked', () => {
    it('returns true when all slots are booked', () => {
      expect(dayIsFullyBooked(mockSlotsWithFullyBooked, new Date('2026-01-17'))).toBe(true);
    });

    it('returns false when some slots are available', () => {
      expect(dayIsFullyBooked(mockSlots, new Date('2026-01-15'))).toBe(false);
    });

    it('returns false when day has no slots', () => {
      expect(dayIsFullyBooked(mockSlots, new Date('2026-01-20'))).toBe(false);
    });
  });

  describe('dayIsPast', () => {
    it('returns true for dates before today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(dayIsPast(yesterday)).toBe(true);
    });

    it('returns false for today', () => {
      expect(dayIsPast(new Date())).toBe(false);
    });

    it('returns false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(dayIsPast(tomorrow)).toBe(false);
    });
  });
});

describe('useCalendar hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct month', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    expect(result.current.currentMonth).toEqual(new Date('2026-01-15'));
    expect(result.current.monthLabel).toContain('enero');
    expect(result.current.monthLabel).toContain('2026');
  });

  it('navigates to previous month', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    act(() => {
      result.current.goToPrevMonth();
    });
    expect(result.current.currentMonth.getMonth()).toBe(11); // December
    expect(result.current.currentMonth.getFullYear()).toBe(2025);
  });

  it('navigates to next month', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    act(() => {
      result.current.goToNextMonth();
    });
    expect(result.current.currentMonth.getMonth()).toBe(1); // February
    expect(result.current.currentMonth.getFullYear()).toBe(2026);
  });

  it('navigates to today', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    act(() => {
      result.current.goToNextMonth();
      result.current.goToToday();
    });
    expect(result.current.currentMonth.getMonth()).toBe(new Date().getMonth());
  });

  it('selects a date and clears selection', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    const date = new Date('2026-01-20');
    act(() => {
      result.current.selectDate(date);
    });
    expect(result.current.selectedDate).toEqual(date);
    expect(result.current.selection?.date).toBe('2026-01-20');

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedDate).toBeNull();
    expect(result.current.selection).toBeNull();
  });

  it('selects a slot', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    act(() => {
      result.current.selectSlot('slot-123');
    });
    expect(result.current.selection?.slotId).toBe('slot-123');
  });

  it('generates correct days for calendar grid', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    const days = result.current.days;
    expect(days.length).toBeGreaterThanOrEqual(28);
    expect(days.length).toBeLessThanOrEqual(42);
    expect(days.every(d => d instanceof Date)).toBe(true);
  });

  it('filters monthSlots correctly', () => {
    const { result } = renderHook(() => useCalendar(mockSlots, new Date('2026-01-15'), 'es-AR'));
    const janSlots = result.current.monthSlots;
    expect(janSlots.length).toBeGreaterThan(0);
    expect(janSlots.every(s => s.date.startsWith('2026-01'))).toBe(true);

    act(() => {
      result.current.goToNextMonth();
    });
    const febSlots = result.current.monthSlots;
    expect(febSlots.every(s => s.date.startsWith('2026-02'))).toBe(true);
  });
});
