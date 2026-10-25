'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * khal v2 theme system (D12): dark default, light available via the
 * typographic toggle. Persisted per device; follows the system preference on
 * first visit (approved demo behavior, fondo-demo-khal.html).
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
