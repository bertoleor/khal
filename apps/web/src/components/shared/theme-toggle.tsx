'use client';

import { useHydrated } from '@/lib/use-hydrated';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Toggle claro/oscuro tipográfico (D12) — sin caja, sol/luna lucide,
 * mono chiquito, igual al aprobado en docs/ux-flows/fondo-demo-khal.html
 * (#khal-toggle). Persiste en el dispositivo (next-themes localStorage).
 * SSR-safe: antes de hidratar asumimos dark (el default) y corregimos al
 * montar — el gate `mounted` hace que el primer render del cliente sea
 * idéntico al HTML del servidor (React 19 estricto con hidratación).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = !mounted || resolvedTheme !== 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Cambiar modo claro/oscuro"
      className="flex items-center gap-2 bg-transparent p-1.5 font-mono-khal text-[10px] uppercase tracking-[2.5px] text-faint transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
