import type { CalendarHeaderProps } from './types';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export function CalendarHeader({
  month,
  onPrev,
  onNext,
  onToday,
  locale = 'es-AR',
  className = '',
}: CalendarHeaderProps) {
  const dateFnsLocale = locale === 'es-AR' ? es : enUS;
  const monthLabel = format(month, 'LLLL yyyy', { locale: dateFnsLocale });
  const isCurrentMonth = format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <header className={`flex items-center justify-between px-4 py-3 border-b border-white/10 ${className}`} role="heading" aria-level={2}>
      <button
        type="button"
        onClick={onPrev}
        aria-label={locale === 'es-AR' ? 'Mes anterior' : 'Previous month'}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex flex-col items-center gap-1 min-w-0">
        <span className="text-sm font-medium text-white capitalize truncate">{monthLabel}</span>
        {isCurrentMonth && (
          <span className="text-xs text-emerald-400 font-mono-khal uppercase tracking-wider">
            {locale === 'es-AR' ? 'Mes actual' : 'Current month'}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label={locale === 'es-AR' ? 'Mes siguiente' : 'Next month'}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </header>
  );
}
