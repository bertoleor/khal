import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface FormErrorProps {
  error: string | null;
  inline?: boolean; // Force inline display (default: auto responsive)
}

/**
 * FormError - Responsive error display
 * - Mobile (≤640px): Fixed bottom toast with slide-up animation
 * - Desktop (>640px): Inline error message
 * - Can be forced inline with `inline={true}`
 */
export function FormError({ error, inline = false }: FormErrorProps) {
  const t = useTranslations('common');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!error) return null;

  const showToast = !inline && isMobile;

  if (showToast) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-safe animate-slide-up"
        role="alert"
        aria-live="assertive"
      >
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] p-4">
            <div className="flex items-start gap-3">
              <svg
                className="flex-shrink-0 mt-0.5 w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="flex-1 text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('form-error-dismiss'))}
                className="flex-shrink-0 p-1 text-red-400 hover:text-red-300 transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline display (desktop or forced)
  return (
    <p
      className="text-xs text-red-400 mt-1 flex items-center gap-1.5 animate-fade-in"
      role="alert"
      aria-live="assertive"
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <span>{error}</span>
    </p>
  );
}
