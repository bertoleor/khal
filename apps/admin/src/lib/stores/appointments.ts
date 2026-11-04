import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Appointment, AppointmentStatus } from '@khal/validations';
import type { Store } from '@/shared/action-base';

/** Database row type (snake_case) */
interface AppointmentRow {
  id: string;
  organization_id: string;
  provider_id: string;
  service_id: string;
  client_id: string;
  scheduled_at: string;
  ends_at: string;
  status: AppointmentStatus;
  hold_expires_at: string;
  hold_released_at: string | null;
  amount_due_cents: number;
  currency_code: string;
  deposit_mode_applied: string | null;
  idempotency_key: string | null;
  phone_hash: string | null;
  ip_hash: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Map database row to Appointment type (camelCase) */
function mapRowToAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientName: row.client_id, // Note: this would need a join to get client name
    serviceName: row.service_id, // Note: this would need a join to get service name
    date: row.scheduled_at.split('T')[0],
    time: row.scheduled_at.split('T')[1].substring(0, 5),
    status: row.status,
    priceCents: row.amount_due_cents,
  };
}

/** Map Appointment input to database row */
function mapAppointmentToRow(input: Partial<Appointment>): Partial<AppointmentRow> {
  const row: Partial<AppointmentRow> = {};
  if (input.id) row.id = input.id;
  if (input.clientName) row.client_id = input.clientName; // This is actually client_id
  if (input.serviceName) row.service_id = input.serviceName; // This is actually service_id
  if (input.date && input.time) {
    row.scheduled_at = `${input.date}T${input.time}:00`;
  }
  if (input.status) row.status = input.status;
  if (input.priceCents) row.amount_due_cents = input.priceCents;
  return row;
}

/**
 * Supabase-backed AppointmentStore implementing Store<Appointment>.
 * All queries are organization-scoped via the JWT org_id claim.
 */
export class SupabaseAppointmentStore implements Store<Appointment> {
  private async getClient() {
    return getSupabaseServerClient();
  }

  async list(): Promise<Appointment[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToAppointment);
  }

  async get(id: string): Promise<Appointment | undefined> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    return mapRowToAppointment(data);
  }

  async create(input: Omit<Appointment, 'id'>): Promise<Appointment> {
    const supabase = await this.getClient();
    const row = mapAppointmentToRow(input as Appointment);
    const { data, error } = await supabase
      .from('appointments')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToAppointment(data);
  }

  async update(id: string, input: Partial<Appointment>): Promise<Appointment> {
    const supabase = await this.getClient();
    const row = mapAppointmentToRow(input);
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToAppointment(data);
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('appointments')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  /**
   * Transition appointment status with server-side validation.
   * Compatible with withAuthTransition (accepts object with id and to).
   */
  async transition(input: { id: string; to: AppointmentStatus }): Promise<Appointment> {
    const { id, to } = input;
    const current = await this.get(id);
    if (!current) throw new Error('Cita no encontrada');

    // Server-side transition validation
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      pendiente: ['confirmado', 'cancelado'],
      confirmado: ['cancelado', 'no_asistio'],
      cancelado: [],
      no_asistio: [],
    };

    if (!validTransitions[current.status]?.includes(to)) {
      throw new Error(`Transición inválida: ${current.status} -> ${to}`);
    }

    return this.update(id, { status: to });
  }
}

/** Singleton instance for backward compatibility with existing actions */
export const appointmentsStore = new SupabaseAppointmentStore();
