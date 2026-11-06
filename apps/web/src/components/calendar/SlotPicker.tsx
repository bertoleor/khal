import { SlotPickerProps } from './types';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useEffect, useRef } from 'react';

export function SlotPicker({
  date,
  serviceId,
  slots,
  onSelect,
  onClose,
  className = '',
}: SlotPickerProps) {
  const dateFnsLocale = date.includes('-AR') ? es : enUS; // fallback, actual locale from parent
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap and close on overlay click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    // Focus first slot button
    const firstSlot = contentRef.current?.querySelector('button');
    (firstSlot as HTMLElement)?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 
        ? `${hours}h ${mins}min` 
        : `${hours}h`;
    }
    return `${minutes}min`;
  };

  const availableSlots = slots.filter(s => s.isAvailable);
  const formattedDate = format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: dateFnsLocale });

  if (availableSlots.length === 0) {
    return (
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-picker-title"
      >
        <div 
          ref={contentRef}
          className="bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-sm mx-4 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 id="slot-picker-title" className="text-lg font-semibold text-white">
              {formattedDate}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-8 text-center">
            <svg className="w-12 h-12 mx-auto text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-zinc-400 text-sm">No hay horarios disponibles para este día</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Elegir otro día
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-picker-title"
    >
      <div 
        ref={contentRef}
        className={\`
          bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-white/10 w-full max-w-sm mx-4
          overflow-hidden animate-slide-up sm:animate-fade-in
          \${className}
        \`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 id="slot-picker-title" className="text-lg font-semibold text-white">
            {formattedDate}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Slots list */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-4 space-y-2">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelect(slot)}
              className={\`
                w-full flex items-center justify-between p-4 rounded-xl border
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
                touch-manipulation active:scale-[0.98]
                bg-white/5 border-white/10 text-white hover:bg-white/10
              \`}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-lg font-mono-khal font-semibold tabular-nums">
                  {formatTime(slot.startMinutes)}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatDuration(slot.durationMinutes)}
                </span>
              </div>
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors rounded-lg min-h-[44px] touch-manipulation"
          >
            Volver al calendario
          </button>
        </div>
      </div>
    </div>
  );
}
