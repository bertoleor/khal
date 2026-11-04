import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
}

/**
 * Writes an audit log entry to the audit_logs table.
 * Fail-closed: never throws, logs error and returns false on failure.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<boolean> {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) {
      console.error('[AUDIT] Auth failed:', authResult.error);
      return false;
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: authResult.ctx.userId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before_snapshot: entry.beforeSnapshot ?? null,
      after_snapshot: entry.afterSnapshot ?? null,
    });

    if (error) {
      console.error('[AUDIT] Failed to write audit log:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[AUDIT] Unexpected error:', err);
    return false;
  }
}

/**
 * Convenience function for logging service CRUD operations.
 */
export async function auditService(
  action: 'create' | 'update' | 'delete' | 'toggle_visibility',
  serviceId: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Promise<void> {
  await writeAuditLog({
    action: 'service_' + action,
    entity: 'service',
    entityId: serviceId,
    beforeSnapshot: before ?? null,
    afterSnapshot: after ?? null,
  });
}

/**
 * Convenience function for logging client blacklist toggle.
 */
export async function auditClientBlacklist(
  clientId: string,
  isBlacklisted: boolean
): Promise<void> {
  await writeAuditLog({
    action: isBlacklisted ? 'client_blacklist' : 'client_unblacklist',
    entity: 'client',
    entityId: clientId,
    afterSnapshot: { is_blacklisted: isBlacklisted },
  });
}

/**
 * Convenience function for logging booking status changes.
 */
export async function auditBooking(
  action: 'confirm' | 'cancel' | 'no_show' | 'reconfirm',
  bookingId: string,
  beforeStatus: string,
  afterStatus: string
): Promise<void> {
  await writeAuditLog({
    action: 'booking_' + action,
    entity: 'appointment',
    entityId: bookingId,
    beforeSnapshot: { status: beforeStatus },
    afterSnapshot: { status: afterStatus },
  });
}

/**
 * Convenience function for logging login attempts.
 */
export async function auditLogin(
  email: string,
  success: boolean,
  error?: string
): Promise<void> {
  await writeAuditLog({
    action: success ? 'login_success' : 'login_failed',
    entity: 'auth',
    entityId: email,
    afterSnapshot: { error: error ?? null },
  });
}
