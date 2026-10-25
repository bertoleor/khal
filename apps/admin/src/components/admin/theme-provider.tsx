'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * khal admin v2 theme system (D13): solid dark default, light available via
 * the typographic toggle. Persisted per device; system preference on first
 * visit. NO animated background in admin, ever (dueña's phone budget).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
