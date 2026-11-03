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

  if (!mounted) {
    // Render hidden but accessible placeholder to avoid layout shift
    return (
      <button
        type="button"
        aria-hidden="true"
        style={{ opacity: 0, pointerEvents: 'none', position: 'absolute' }}
        className="font-mono-khal text-[10px] uppercase tracking-[3px] text-faint"
      >
        <span translate="no">{nextMode}</span> mode
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(nextMode)}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="pointer-events-auto font-mono-khal text-[10px] uppercase tracking-[3px] text-faint transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span translate="no">{nextMode}</span> mode
    </button>
  );
}
