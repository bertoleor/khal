'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Toggle claro/oscuro tipográfico (D12) — sin caja, sol/luna lucide,
 * mono chiquito, igual al aprobado en docs/ux-flows/fondo-demo-khal.html
 * (#khal-toggle). Persiste en el dispositivo (next-themes localStorage).
 * SSR-safe: antes de hidratar asumimos dark (el default) y corregimos al montar.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Cambiar modo claro/oscuro"
      className="flex items-center gap-2 bg-transparent p-1.5 font-mono-khal text-[10px] uppercase tracking-[2.5px] text-muted opacity-75 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span aria-hidden="true">modo</span>
      {isDark ? (
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
