'use client';

import { cn } from '@khal/utils';
import { useTranslations } from 'next-intl';

export interface DaySlot {
  date: string;
  label: string;
  closed: boolean;
  slots: string[];
  /**
   * T-F2.3 (slots con tachados): taken starts for the day, rendered crossed
   * out and disabled. Derived by the page as candidateSlots − slots.
   */
  taken?: string[];
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
  // Chronological reel: available + taken interleaved ('HH:MM' sorts lexically).
  const reel =
    activeDay && !activeDay.closed ? [...activeDay.slots, ...(activeDay.taken ?? [])].sort() : [];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-mono-khal text-[11px] uppercase tracking-[2px] text-faint">
          {t('pickDay')}
        </h2>
        {/* D11: typographic day strip — no boxed chips; the selected day gets a
            functional accent underline, closed days are struck through. */}
        <div className="mt-3 flex gap-5 overflow-x-auto pb-2">
          {days.map((day) => {
            const isActive = day.date === selectedDate;
            // Extracted from a nested ternary (sonarjs/no-nested-conditional).
            const dayStateClass = isActive
              ? 'border-accent text-foreground'
              : 'border-transparent text-muted hover:text-foreground';
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                disabled={day.closed}
                aria-pressed={isActive}
                className={cn(
                  'shrink-0 border-b-2 pb-1 font-mono-khal text-xs uppercase tracking-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  day.closed
                    ? 'cursor-not-allowed border-transparent text-faint line-through'
                    : dayStateClass
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
          <h2 className="font-mono-khal text-[11px] uppercase tracking-[2px] text-faint">
            {t('pickSlot')}
          </h2>
          {activeDay.slots.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('noSlots')}</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1 sm:grid-cols-4">
              {reel.map((slot) => {
                const isTaken = !activeDay.slots.includes(slot);
                const isSelected = selectedSlot === slot;
                // Extracted from a nested ternary (sonarjs/no-nested-conditional).
                const slotStateClass = isSelected
                  ? 'bg-accent font-semibold text-accent-contrast'
                  : 'text-foreground hover:text-accent-soft';
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    disabled={isTaken}
                    aria-pressed={isSelected}
                    aria-label={isTaken ? `${slot} — ${t('slotTaken')}` : slot}
                    className={cn(
                      'rounded-[2px] py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      isTaken ? 'cursor-not-allowed text-faint line-through' : slotStateClass
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-muted">{t('closed')}</p>
      )}
    </div>
  );
}
