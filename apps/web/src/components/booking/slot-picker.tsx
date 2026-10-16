'use client';

import { cn } from '@khal/utils';
import { useTranslations } from 'next-intl';

export interface DaySlot {
  date: string;
  label: string;
  closed: boolean;
  slots: string[];
}

export function SlotPicker({
  days,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: {
  days: DaySlot[];
  selectedDate: string;
  selectedSlot: string | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: string) => void;
}) {
  const t = useTranslations('booking');
  const activeDay = days.find((day) => day.date === selectedDate) ?? days[0];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-zinc-400">{t('pickDay')}</h2>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => {
            const isActive = day.date === selectedDate;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                disabled={day.closed}
                aria-pressed={isActive}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors',
                  day.closed
                    ? 'cursor-not-allowed border-white/5 bg-transparent text-zinc-600'
                    : isActive
                      ? 'border-emerald-400 bg-emerald-400 font-semibold text-black'
                      : 'border-white/15 bg-white/[0.06] text-zinc-200 hover:border-white/30'
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeDay && !activeDay.closed ? (
        <section>
          <h2 className="text-sm font-medium text-zinc-400">{t('pickSlot')}</h2>
          {activeDay.slots.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{t('noSlots')}</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {activeDay.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  aria-pressed={selectedSlot === slot}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm transition-colors',
                    selectedSlot === slot
                      ? 'border-emerald-400 bg-emerald-400 font-semibold text-black'
                      : 'border-white/15 bg-white/[0.06] text-zinc-200 hover:border-white/30'
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-zinc-500">{t('closed')}</p>
      )}
    </div>
  );
}
