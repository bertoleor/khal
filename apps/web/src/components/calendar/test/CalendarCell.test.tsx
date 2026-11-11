import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarCell } from '../CalendarCell';
import type { CalendarSlot } from '../types';

const mockSlots: CalendarSlot[] = [
  { id: '1', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 540, durationMinutes: 60, isAvailable: true },
  { id: '2', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 600, durationMinutes: 60, isAvailable: false },
];

const mockDate = new Date('2026-01-15');

describe('CalendarCell', () => {
  const defaultProps = {
    date: mockDate,
    slots: mockSlots,
    isSelected: false,
    isToday: false,
    isOutsideMonth: false,
    disabled: false,
    onClick: vi.fn(),
    locale: 'es-AR' as const,
  };

  it('renders day number', () => {
    render(<CalendarCell {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows availability indicator for available slots', () => {
    render(<CalendarCell {...defaultProps} />);
    const dot = screen.getByTestId('availability-dot');
    expect(dot).toHaveClass('bg-emerald-400');
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 available slot
  });

  it('shows fully booked indicator when all slots taken', () => {
    const bookedSlots: CalendarSlot[] = [
      { id: '1', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 540, durationMinutes: 60, isAvailable: false },
      { id: '2', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 600, durationMinutes: 60, isAvailable: false },
    ];
    render(<CalendarCell {...defaultProps} slots={bookedSlots} />);
    const dot = screen.getByTestId('availability-dot');
    expect(dot).toHaveClass('bg-red-400');
  });

  it('shows no slots indicator when no slots', () => {
    render(<CalendarCell {...defaultProps} slots={[]} />);
    // Should not show availability indicator
    expect(screen.queryByTestId('availability-dot')).not.toBeInTheDocument();
  });

  it('shows today ring when isToday', () => {
    render(<CalendarCell {...defaultProps} isToday />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ring-2');
    expect(button).toHaveClass('ring-emerald-400');
  });

  it('shows selected ring when isSelected', () => {
    render(<CalendarCell {...defaultProps} isSelected />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ring-2');
    expect(button).toHaveClass('ring-emerald-400');
    expect(button).toHaveClass('ring-offset-2');
  });

  it('shows outside month opacity when isOutsideMonth', () => {
    render(<CalendarCell {...defaultProps} isOutsideMonth />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-30');
  });

  it('disables past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    render(<CalendarCell {...defaultProps} date={pastDate} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-40');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('disables outside month dates', () => {
    render(<CalendarCell {...defaultProps} isOutsideMonth disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onClick when clicked and not disabled', () => {
    render(<CalendarCell {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    render(<CalendarCell {...defaultProps} disabled />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  it('has correct aria attributes', () => {
    render(<CalendarCell {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-selected', 'false');
    expect(button).toHaveAttribute('aria-disabled', 'false');
  });

  it('shows slot count for available slots', () => {
    render(<CalendarCell {...defaultProps} />);
    // Should show count of available slots (1)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CalendarCell {...defaultProps} className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has touch-manipulation and min-h-[80px] classes', () => {
    render(<CalendarCell {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[80px]');
    expect(button).toHaveClass('touch-manipulation');
  });
});
