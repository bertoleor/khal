/** khal v2 theme system - shared between admin and web.
 * Persisted per device; system preference on first visit.
 * NO animated background in admin, ever (dueña's phone budget).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider as NextThemesProvider>
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >{children}</ThemeProvider as NextThemesProvider>
  );
}