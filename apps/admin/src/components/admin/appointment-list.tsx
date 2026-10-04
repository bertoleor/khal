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

const ACTION_KEY: Record<string, string> = {
  confirmado: 'appointments.confirm',
  cancelado: 'appointments.cancel',
  no_asistio: 'appointments.noShow',
};

function handleTransition(formData: FormData, confirmMessage: string): void {
  const to = String(formData.get('to') ?? '') as AppointmentStatus;
  if (DESTRUCTIVE_STATUSES.has(to)) {
    // Destructive transitions require an explicit confirmation (WCAG a11y-ops: no
    // single-click destructive actions in the admin schedule). Native confirm is
    // the repo's minimal-choice fix; a two-step UI is a product decision that is
    // intentionally NOT made here (see docs/auditoria-a11y-2026-09-29.md H5).
    if (typeof window !== 'undefined' && !window.confirm(confirmMessage)) {
      return;
    }
  }
  void transitionAppointmentAction(formData);
}

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pendiente: 'bg-amber-400',
  confirmado: 'bg-emerald-500',
  cancelado: 'bg-slate-300',
  no_asistio: 'bg-red-500',
};

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const t = useTranslations('Admin');

  if (appointments.length === 0) {
    return <p className="mt-6 text-slate-500">{t('appointments.empty')}</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {appointments.map((appointment) => (
        <li
          key={appointment.id}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3"
        >
          <span aria-hidden className={`h-3 w-3 rounded-full ${STATUS_DOT[appointment.status]}`} />
          <span className="sr-only">{t(`appointments.status.${appointment.status}`)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{appointment.clientName}</p>
            <p className="truncate text-sm text-slate-500">
              {appointment.time} · {appointment.serviceName}
            </p>
          </div>
          <span className="text-sm font-medium text-slate-700">
            {formatCents(appointment.priceCents, 'ARS')}
          </span>
          <div className="flex gap-1">
            {VALID_APPOINTMENT_TRANSITIONS[appointment.status].map((to) => (
              <form key={to} action={(formData) => handleTransition(formData, t(ACTION_KEY[to]))}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="to" value={to} />
                <button
                  type="submit"
                  className={
                    to === 'confirmado'
                      ? 'rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                      : 'rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700'
                  }
                >
                  {t(ACTION_KEY[to])}
                </button>
              </form>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
