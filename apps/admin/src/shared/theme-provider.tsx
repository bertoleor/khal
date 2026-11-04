'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * khal v2 theme system (D12): dark default, light available via the
 * typographic toggle. Persisted per device; follows the system preference on
 * first visit (approved demo behavior, fondo-demo-khal.html).
 *
 * attribute="class" sets html.light / html.dark - the same signal the
 * 21st.dev flow-gradient component watches (checkTheme), so the toggle
 * drives the whole page: tokens (html.light) AND the gradient background.
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
