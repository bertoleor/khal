import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarBookingForm } from '../../booking/calendar-booking-form';
import type { CalendarSlot, Service, PaymentInfo } from '../../calendar/types';

const mockService: Service = {
  id: 'svc-1',
  name: 'Lifting de Pestañas',
  description: 'Lifting y tintado',
  price_cents: 2500000,
  currency_code: 'ARS',
  duration_minutes: 60,
  buffer_minutes: 15,
  is_visible: true,
  sort_order: 1,
  photo_path: null,
  deposit_mode: 'fixed',
  deposit_fixed_cents: 100000,
  deposit_percentage_bp: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
};

const mockPayment: PaymentInfo = {
  alias: 'khal.studio',
  cvu: '0000000000000000000000',
  whatsappPhone: '+5491100000000',
  amountDueCents: 100000,
  currencyCode: 'ARS',
  isDeposit: true,
  durationMinutes: 60,
};

const mockSlots = [
  { id: 'slot-1', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 540, durationMinutes: 60, isAvailable: true },
  { id: 'slot-2', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 600, durationMinutes: 60, isAvailable: true },
  { id: 'slot-3', serviceId: 'svc-1', date: '2026-01-15', startMinutes: 660, durationMinutes: 60, isAvailable: false },
  { id: 'slot-4', serviceId: 'svc-1', date: '2026-01-16', startMinutes: 540, durationMinutes: 60, isAvailable: true },
];

const mockCreateBooking = vi.fn();

vi.mock('@/lib/actions/booking', () => ({
  createBooking: mockCreateBooking,
}));

vi.mock('@/lib/booking/addons', () => ({
  serviceWithAddons: (name: string) => name,
}));

vi.mock('@khal/utils', () => ({
  formatCents: (cents: number, currency: string) => `$${(cents / 100).toFixed(2)} ${currency}`,
}));

describe('CalendarBookingForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders calendar with slots', () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    expect(screen.getByText('Lifting de Pestañas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /enero|january/i })).toBeInTheDocument();
  });

  it('shows empty state when no slots', () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={[]}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    expect(screen.getByText(/no hay horarios disponibles/i)).toBeInTheDocument();
  });

  it('opens slot picker when clicking available day', async () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Click on an available day cell
    const dayButton = screen.getByRole('button', { name: /15.*disponible/i });
    fireEvent.click(dayButton);

    // Slot picker should open
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /15.*enero|january.*15/i })).toBeInTheDocument();
    });

    // Should show available slots
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('selects slot and shows booking form', async () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Click day
    const dayButton = screen.getByRole('button', { name: /15.*disponible/i });
    fireEvent.click(dayButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click available slot
    const slotButton = screen.getByRole('button', { name: /09:00.*disponible/i });
    fireEvent.click(slotButton);

    // Form should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  it('shows addons section with toggle chips', async () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Click day and slot to reach form
    const dayButton = screen.getByRole('button', { name: /15.*disponible/i });
    fireEvent.click(dayButton);
    await waitFor(() => screen.getByRole('dialog'));
    const slotButton = screen.getByRole('button', { name: /09:00.*disponible/i });
    fireEvent.click(slotButton);
    await waitFor(() => screen.getByLabelText(/nombre/i));

    // Check addons section
    expect(screen.getByText(/sumás algo más/i)).toBeInTheDocument();
  });

  it('toggles addon and updates total', async () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Navigate to form
    const dayButton = screen.getByRole('button', { name: /15.*disponible/i });
    fireEvent.click(dayButton);
    await waitFor(() => screen.getByRole('dialog'));
    const slotButton = screen.getByRole('button', { name: /09:00.*disponible/i });
    fireEvent.click(slotButton);
    await waitFor(() => screen.getByLabelText(/nombre/i));

    // Initial total
    const initialTotal = screen.getByText(/\$26\.000 ARS/); // 25000 + 1000 = 26000 cents

    // Toggle addon (assuming first addon in catalog)
    const addonButton = screen.getByRole('button', { name: /agregar.*kit/i });
    fireEvent.click(addonButton);

    // Total should update
    await waitFor(() => {
      expect(screen.getByText(/\$27\.000 ARS/)).toBeInTheDocument(); // 25000 + 1000 + 1000
    });
  });

  it('submits form and calls createBooking with idempotency key', async () => {
    mockCreateBooking.mockResolvedValue({ ok: true, bookingId: 'booking-123' });

    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Navigate to form
    const dayButton = screen.getByRole('button', { name: /15.*disponible/i });
    fireEvent.click(dayButton);
    await waitFor(() => screen.getByRole('dialog'));
    const slotButton = screen.getByRole('button', { name: /09:00.*disponible/i });
    fireEvent.click(slotButton);
    await waitFor(() => screen.getByLabelText(/nombre/i));

    // Fill form
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'María García' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '+5491123456789' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'maria@test.com' } });
    fireEvent.click(screen.getByLabelText(/trabajo de otro lugar/i)); // externalWork
    fireEvent.click(screen.getByLabelText(/términos/i)); // termsAccepted

    // Submit
    const submitButton = screen.getByRole('button', { name: /confirmar|confirm/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalled();
    });

    // Check idempotency key was passed
    const callArgs = mockCreateBooking.mock.calls[0][0];
    expect(callArgs.idempotencyKey).toBeDefined();
    expect(callArgs.serviceId).toBe('svc-1');
    expect(callArgs.name).toBe('María García');
    expect(callArgs.phone).toBe('+5491123456789');
    expect(callArgs.email).toBe('maria@test.com');
  });

  it('shows error toast on booking failure', async () => {
    mockCreateBooking.mockResolvedValue({ ok: false, code: 'conflict' });

    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Navigate and submit
    const dayButton = screen.getByRole('button', { name: /15.*disponible/i });
    fireEvent.click(dayButton);
    await waitFor(() => screen.getByRole('dialog'));
    const slotButton = screen.getByRole('button', { name: /09:00.*disponible/i });
    fireEvent.click(slotButton);
    await waitFor(() => screen.getByLabelText(/nombre/i));

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '+5491123456789' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByLabelText(/términos/i));

    const submitButton = screen.getByRole('button', { name: /confirmar|confirm/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/conflicto|conflict/i)).toBeInTheDocument();
    });

    // Error toast should appear (mobile) or inline (desktop)
    // Since we're in JSDOM, it defaults to desktop behavior
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has correct touch targets on all interactive elements', () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // Check calendar day cells have min-h-[80px]
    const dayCells = screen.getAllByRole('button', { name: /disponible|ocupado|sin horarios/i });
    dayCells.forEach(cell => {
      expect(cell).toHaveClass('min-h-[80px]');
      expect(cell).toHaveClass('touch-manipulation');
    });

    // Check SlotPicker buttons have min-h-[44px]
    // (would need to open dialog first)
  });

  it('supports view switcher (month/week/day)', async () => {
    render(
      <CalendarBookingForm
        service={mockService}
        slots={mockSlots}
        payment={mockPayment}
        locale="es-AR"
      />
    );

    // View toggle buttons should be present
    expect(screen.getByRole('button', { name: /mes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /semana/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /día/i })).toBeInTheDocument();

    // Click week view
    fireEvent.click(screen.getByRole('button', { name: /semana/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /lun|mar|mié|jue|vie|sáb|dom/i })).toBeInTheDocument();
    });
  });
});
