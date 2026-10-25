import { ThemeToggle } from '@/components/shared/theme-toggle';

/**
 * Header v2 (D9 — base-diseno-v2.md §1): el header no es una barra, es el
 * arranque del contenido. Sin border-bottom, sin fondo propio, sin caja:
 * wordmark "Khal" en TAN Nightingale + kicker mono en el flujo tipográfico,
 * y el toggle de modo arriba a la derecha (igual al hero aprobado).
 * El navbar clienta NO existe (flujo lineal) — Políticas vive en el footer.
 */
export function Header() {
  return (
    <header className="relative z-10">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-contrast"
      >
        Ir al contenido
      </a>
      <div className="mx-auto flex w-full max-w-lg items-start justify-between px-4 pt-5 sm:max-w-6xl sm:px-6">
        <div>
          <p className="font-wordmark text-[17px] leading-none text-foreground">Khal</p>
          <p className="mt-1.5 font-mono-khal text-[10px] uppercase tracking-[3px] text-faint">
            estudio de pestañas · VL
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
