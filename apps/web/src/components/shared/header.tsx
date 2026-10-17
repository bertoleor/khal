import { Link } from '@/i18n/navigation';

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/60 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded-full focus:bg-emerald-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Ir al contenido
      </a>
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3 sm:max-w-6xl sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-sm font-bold text-emerald-400">
            K
          </div>
          <div className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-tight text-white">
              Khal Studio
            </span>
            <span className="hidden text-[11px] leading-none text-zinc-400 sm:block">
              Vicente López, Buenos Aires
            </span>
          </div>
        </div>
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-6 text-sm sm:flex"
        >
          <Link
            href="/"
            className="font-medium text-zinc-300 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Servicios
          </Link>
          <Link
            href="/politicas"
            className="font-medium text-zinc-300 transition-colors hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Políticas
          </Link>
        </nav>
      </div>
    </header>
  );
}
