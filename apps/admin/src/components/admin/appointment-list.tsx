'use client';

import { transitionAppointment as transitionAppointmentAction } from '@/lib/actions/appointments';
import { formatCents } from '@khal/utils';
import {
  VALID_APPOINTMENT_TRANSITIONS,
  type Appointment,
  type AppointmentStatus,
} from '@khal/validations';
import { useTranslations } from 'next-intl';

const DESTRUCTIVE_STATUSES: ReadonlySet<AppointmentStatus> = new Set(['cancelado', 'no_asistio']);

/**
 * i18n key for each transition button — exhaustive switch over the status
 * union (compile-checked named access, no dynamic key indexing).
 */
function transitionActionKey(to: AppointmentStatus): string {
  switch (to) {
    case 'confirmado':
      return 'appointments.confirm';
    case 'cancelado':
      return 'appointments.cancel';
    case 'no_asistio':
      return 'appointments.noShow';
    case 'pendiente':
      // Unreachable through the state machine (no transition targets
      // pendiente), but the switch stays exhaustive over the union; the
      // status label is the only sensible key for it.
      return 'appointments.status.pendiente';
  }
}

function handleTransition(formData: FormData, confirmMessage: string): void {
  const to = String(formData.get('to') ?? '') as AppointmentStatus;
  if (DESTRUCTIVE_STATUSES.has(to)) {
    // Destructive transitions require an explicit confirmation (WCAG a11y-ops: no
    // single-click destructive actions in the admin schedule). Native confirm is
    // the repo's minimal-choice fix; a two-step UI is a product decision that is
    // intentionally NOT made here (see DOCS/auditoria-a11y-2026-09-29.md H5).
    if (typeof window !== 'undefined' && !window.confirm(confirmMessage)) {
      return;
    }
  }
  void transitionAppointmentAction(formData);
}

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pendiente: 'bg-amber-400',
  confirmado: 'bg-emerald-400/100',
  cancelado: 'bg-white/20',
  no_asistio: 'bg-red-500',
};

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const t = useTranslations('Admin');

  if (appointments.length === 0) {
    return <p className="mt-6 text-zinc-400">{t('appointments.empty')}</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {appointments.map((appointment) => (
        <li
          key={appointment.id}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-3"
        >
          <span aria-hidden className={`h-3 w-3 rounded-full ${STATUS_DOT[appointment.status]}`} />
          <span className="sr-only">{t(`appointments.status.${appointment.status}`)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white">{appointment.clientName}</p>
            <p className="truncate text-sm text-zinc-400">
              {appointment.time} · {appointment.serviceName}
            </p>
          </div>
          <span className="text-sm font-medium text-zinc-300">
            {formatCents(appointment.priceCents, 'ARS')}
          </span>
          <div className="flex gap-1">
            {VALID_APPOINTMENT_TRANSITIONS[appointment.status].map((to) => (
              <form
                key={to}
                action={(formData) => handleTransition(formData, t(transitionActionKey(to)))}
              >
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="to" value={to} />
                <button
                  type="submit"
                  className={
                    to === 'confirmado'
                      ? 'rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                      : 'rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400'
                  }
                >
                  {t(transitionActionKey(to))}
                </button>
              </form>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
