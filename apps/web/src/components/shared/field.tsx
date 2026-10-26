import type { ComponentProps } from 'react';

/**
 * v7 field (S12 delicacy, preview §4 "tus datos"): a mono kicker label over
 * a 12px-radius glass input (padding 10px 14px) — the approved reservar
 * anatomy. Consumed by the booking form only.
 */
export function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: ComponentProps<'input'>['type'];
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 ml-3.5 block font-mono-khal text-[8px] uppercase tracking-[2px] text-faint">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-sm border border-hairline bg-surface px-3.5 py-2.5 text-[12.5px] text-foreground outline-none backdrop-blur-lg transition-colors placeholder:text-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </label>
  );
}
