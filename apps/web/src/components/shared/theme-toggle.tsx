'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Typographic mode toggle (D12 - "igual al hero aprobado"): mono uppercase
 * label showing the mode you switch TO. Mounted-gated to avoid hydration
 * mismatch (next-themes resolves the theme client-side).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme !== 'light';
  const nextMode = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(nextMode)}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={`pointer-events-auto font-mono-khal text-[10px] uppercase tracking-[3px] text-faint transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        mounted ? '' : 'invisible'
      }`}
    >
      {nextMode} mode
    </button>
  );
}
