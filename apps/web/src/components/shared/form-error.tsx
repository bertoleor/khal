import { useEffect, useState } from 'react';

/**
 * FormError - Responsive error display
 * Mobile: fixed bottom toast with auto-dismiss
 * Desktop: inline error near the form
 */
export function FormError({
  error,
  visible = true,
  onDismiss,
  variant = 'auto', // 'auto' | 'toast' | 'inline'
}: {
  error: string | null;
  visible?: boolean;
  onDismiss?: () => void;
  variant?: 'auto' | 'toast' | 'inline';
}) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (visible && error) {
      setShow(true);
      if (variant === 'toast' || (variant === 'auto' && typeof window !== 'undefined' && window.innerWidth < 640)) {
        const timer = setTimeout(() => {
          setShow(false);
          onDismiss?.();
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [visible, error, variant, onDismiss]);

  if (!mounted || !show || !error) {
    return null;
  }

  const isMobile = variant === 'toast' || (variant === 'auto' && typeof window !== 'undefined' && window.innerWidth < 640);

  if (isMobile) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-4 sm:w-[320px]"
        role="alert"
        aria-live="assertive"
      >
        <div className="bg-red-500/90 backdrop-blur-sm border border-red-500/30 rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-sm text-white leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => { setShow(false); onDismiss?.(); }}
              className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" role="alert" aria-live="polite">
      <p className="mt-1.5 ml-3.5 text-[10.5px] text-red-400 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-2 text-red-300 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded p-0.5"
            aria-label="Descartar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </p>
    </div>
  );
}
