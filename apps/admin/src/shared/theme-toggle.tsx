"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Typographic mode toggle (D12): mono uppercase label showing the mode you switch TO.
 * Accessible: no invisible hack, proper focus ring with token, translate="no" for "mode".
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
      className="pointer-events-auto font-mono-khal text-[10px] uppercase tracking-[3px] text-faint transition-[color] duration-160 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ opacity: mounted ? 1 : 0, pointerEvents: mounted ? 'auto' : 'none' }}
    >
      <span translate="no">{nextMode}</span> mode
    </button>
  );
}
