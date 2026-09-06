import type { ComponentProps } from "react";

export function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: ComponentProps<"input">["type"];
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
      />
    </label>
  );
}
