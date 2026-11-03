'use client';

import { cn } from '@khal/utils';
import { useTranslations } from 'next-intl';

export interface DaySlot {
  date: string;
  /** "30" — the big chip number (v7 preview §4). */
  dayNumber: string;
  /** "lun" — the tiny chip weekday label. */
  weekday: string;
  closed: boolean;
  slots: string[];
  /**
   * T-F2.3 (slots con tachados): taken starts for the day, rendered crossed
   * out and disabled. Derived by the page as candidateSlots − slots.
   */
  taken?: string[];
}

/**
 * The 1px sliding bar indicator positions for the 7-day strip (preview v7:
 * width 10%, left = 4% + index * 100/7%). Static positions, never inline
 * styles — the strip is always exactly 7 days (the page builds it that way).
 */
const BAR_POSITIONS = [
  'left-[4%]',
  'left-[18.3%]',
  'left-[32.6%]',
  'left-[47%]',
  'left-[61.3%]',
  'left-[75.6%]',
  'left-[90%]',
] as const;

/** A day chip's full state class (v7 preview §4: closed 26% ink / selected accent). */
function dayChipClass(day: DaySlot, isActive: boolean): string {
  if (day.closed) {
    return 'cursor-not-allowed border-hairline bg-surface opacity-25';
  }
  if (isActive) {
    return 'border-accent bg-accent';
  }
  return 'border-hairline bg-surface hover:bg-surface-hover';
}

/** A slot chip's full state class (taken dashed+struck / selected accent pill). */
function slotChipClass(isTaken: boolean, isSelected: boolean): string {
  if (isTaken) {
    return 'cursor-not-allowed border-dashed border-hairline bg-transparent text-faint line-through';
  }
  if (isSelected) {
    return 'border-accent bg-accent font-bold text-accent-contrast';
  }
  return 'border-hairline bg-surface text-muted hover:bg-surface-hover';
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
  const activeIndex = days.findIndex((day) => day.date === (activeDay?.date ?? ''));
  const barPosition = BAR_POSITIONS[Math.min(Math.max(activeIndex, 0), BAR_POSITIONS.length - 1)];

  return (
    <div className="space-y-4">
      <section>
        <h2 className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
          {t('pickDay')}
        </h2>
        {/* v7 day chips (S6/S12): real pills, 8/7px padding, 12.5px number,
            tiny mono weekday; the closed day rests at 26% ink. */}
        <div className="mt-1.5 flex gap-1.5">
          {days.map((day) => {
            const isActive = day.date === selectedDate;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                disabled={day.closed}
                aria-pressed={isActive}
                aria-label={
                  day.closed
                    ? `${day.weekday} ${day.dayNumber} — ${t('closed')}`
                    : `${day.weekday} ${day.dayNumber}`
                }
                className={cn(
                  'flex-1 rounded-full border pb-[7px] pt-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  dayChipClass(day, isActive)
                )}
              >
                <span
                  className={cn(
                    'block text-[12.5px] font-semibold',
                    isActive ? 'text-accent-contrast' : 'text-foreground'
                  )}
                >
                  {day.dayNumber}
                </span>
                <span
                  className={cn(
                    'block font-mono-khal text-[7px] uppercase tracking-[1.5px]',
                    isActive ? 'text-accent-contrast/70' : 'text-faint'
                  )}
                >
                  {day.weekday}
                </span>
              </button>
            );
          })}
        </div>
        {/* The delicate 1px bar (S6): no track, only the sliding segment. */}
        <div aria-hidden="true" className="relative mx-1 mt-2 h-px">
          <span
            className={cn(
              'absolute top-0 h-px w-[10%] bg-foreground/40 transition-[left] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
              barPosition
            )}
          />
        </div>
      </section>

      {activeDay && !activeDay.closed ? (
        <section>
          <h2 className="font-mono-khal text-[8px] uppercase tracking-[2.5px] text-faint">
            {t('pickSlot')}
          </h2>
          {activeDay.slots.length === 0 ? (
            <p className="mt-1.5 text-[12.5px] text-muted">{t('noSlots')}</p>
          ) : (
            <div className="mt-1.5 grid grid-cols-4 gap-[7px] sm:grid-cols-3">
              {reel.map((slot) => {
                const isTaken = !activeDay.slots.includes(slot);
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    disabled={isTaken}
                    aria-pressed={isSelected}
                    aria-label={isTaken ? `${slot} — ${t('slotTaken')}` : slot}
                    className={cn(
                      'rounded-full border py-2 text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      slotChipClass(isTaken, isSelected)
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
        <p className="text-[12.5px] text-muted">{t('closed')}</p>
      )}
    </div>
  );
}
