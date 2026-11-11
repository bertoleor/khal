import type { ComponentProps } from 'react';

/**
 * v7 field (S12 delicacy, preview §4 "tus datos"): a mono kicker label over
 * a 12px-radius glass input (padding 10px 14px) — the approved reservar
 * anatomy. Consumed by the booking form only.
 * Mobile-first: label stacks above input with proper spacing.
 * Supports error state with aria-invalid and error message.
 */
export function Field({
  label,
  name,
  type,
  autoComplete,
  error,
  errorId,
}: {
  label: string;
  name: string;
  type: ComponentProps<'input'>['type'];
  autoComplete?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 ml-3.5 block font-mono-khal text-[8px] uppercase tracking-[2px] text-faint sm:text-[7px]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-sm border border-hairline bg-surface px-3.5 py-3 text-[12.5px] text-foreground outline-none backdrop-blur-lg transition-[background-color,border-color,color] duration-160 ease-out placeholder:text-faint focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation"
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 ml-3.5 text-[10.5px] text-red-400" aria-live="polite">
          {error}
        </p>
      )}
    </label>
  );
}
