import type { ComponentProps } from 'react';

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
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white outline-none transition-colors placeholder-zinc-500 focus:border-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      />
    </label>
  );
}
