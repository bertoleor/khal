'use client';

import { addException as addExceptionAction } from '@/lib/actions/exceptions';
import type { CalendarException, ExceptionType } from '@khal/validations';
import { useTranslations } from 'next-intl';

function handleAddException(formData: FormData): void {
  void addExceptionAction(formData);
}

const TYPE_KEY: Record<ExceptionType, string> = {
  holiday: 'exceptions.addType.holiday',
  vacation: 'exceptions.addType.vacation',
  event: 'exceptions.addType.event',
  block: 'exceptions.addType.block',
};

export function ExceptionsList({ exceptions }: { exceptions: CalendarException[] }) {
  const t = useTranslations('Admin');

  return (
    <div className="mt-4 space-y-4">
      <form
        action={handleAddException}
        className="space-y-3 rounded-2xl border border-white/10 p-4"
      >
        <input
          name="title"
          placeholder={t('exceptions.addTitle')}
          aria-label={t('exceptions.addTitle')}
          required
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
        />
        <div className="flex gap-2">
          <select
            name="type"
            defaultValue="holiday"
            aria-label={t('exceptions.typeLabel')}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="holiday">{t('exceptions.addType.holiday')}</option>
            <option value="vacation">{t('exceptions.addType.vacation')}</option>
            <option value="event">{t('exceptions.addType.event')}</option>
            <option value="block">{t('exceptions.addType.block')}</option>
          </select>
          <input
            name="date"
            type="date"
            required
            aria-label={t('exceptions.dateLabel')}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-medium text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          {t('exceptions.addButton')}
        </button>
      </form>

      {exceptions.length === 0 ? (
        <p className="text-sm text-zinc-400">{t('exceptions.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 p-3"
            >
              <div>
                <p className="font-medium text-white">{exception.title}</p>
                <p className="text-sm text-zinc-400">
                  {exception.date} · {t(TYPE_KEY[exception.type])}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
