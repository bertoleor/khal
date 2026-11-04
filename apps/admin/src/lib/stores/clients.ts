import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Client } from '@khal/validations';
import type { Store } from '@/shared/action-base';

/** Database row type (snake_case) */
interface ClientRow {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  phone_hash: string;
  email: string | null;
  locale: string;
  timezone: string | null;
  no_show_count: number;
  is_blacklisted: boolean;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Map database row to Client type (camelCase) */
function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    tags: [], // Would need a join to client_tags
    noShowCount: row.no_show_count,
    isBlacklisted: row.is_blacklisted,
  };
}

/** Map Client input to database row */
function mapClientToRow(input: Partial<Client>): Partial<ClientRow> {
  const row: Partial<ClientRow> = {};
  if (input.id) row.id = input.id;
  if (input.name) row.name = input.name;
  if (input.phone) row.phone = input.phone;
  if (input.noShowCount !== undefined) row.no_show_count = input.noShowCount;
  if (input.isBlacklisted !== undefined) row.is_blacklisted = input.isBlacklisted;
  return row;
}

/**
 * Supabase-backed ClientStore implementing Store<Client>.
 * All queries are organization-scoped via the JWT org_id claim.
 */
export class SupabaseClientStore implements Store<Client> {
  private async getClient() {
    return getSupabaseServerClient();
  }

  async list(): Promise<Client[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .order('last_activity_at', { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToClient);
  }

  async get(id: string): Promise<Client | undefined> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    return mapRowToClient(data);
  }

  async create(input: Omit<Client, 'id'>): Promise<Client> {
    const supabase = await this.getClient();
    const row = mapClientToRow(input as Client);
    const { data, error } = await supabase
      .from('clients')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToClient(data);
  }

  async update(id: string, input: Partial<Client>): Promise<Client> {
    const supabase = await this.getClient();
    const row = mapClientToRow(input);
    const { data, error } = await supabase
      .from('clients')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToClient(data);
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  /**
   * Toggle client blacklist status.
   * Compatible with withAuthTransition (accepts object with id).
   */
  async toggleBlacklisted(input: { id: string }): Promise<Client> {
    const { id } = input;
    const client = await this.get(id);
    if (!client) throw new Error('Cliente no encontrado');
    return this.update(id, { isBlacklisted: !client.isBlacklisted });
  }
}

/** Singleton instance for backward compatibility with existing actions */
export const clientsStore = new SupabaseClientStore();
