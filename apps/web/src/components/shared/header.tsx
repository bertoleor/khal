export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/60 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded-full focus:bg-emerald-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
      >
        Ir al contenido
      </a>
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold tracking-tight text-white">Khal</span>
      </div>
    </header>
  );
}
