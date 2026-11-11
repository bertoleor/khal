import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useState } from 'react';
import React from 'react';
import { X } from 'lucide-react';

/**
 * Header v2 (D9 — base-diseno-v2.md §1): el header no es una barra, es el
 * arranque del contenido. Sin border-bottom, sin fondo propio, sin caja:
 * wordmark "Khal" en TAN Nightingale + kicker mono en el flujo tipográfico,
 * y el toggle de modo arriba a la derecha (igual al hero aprobado).
 * El navbar clienta NO existe (flujo lineal) — Políticas vive en el footer.
 * Mobile: hamburger menu with slide-in drawer.
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/conocenos', label: 'Conocenos' },
  ];

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
          <p className="font-mono-khal text-[10px] uppercase tracking-[3px] text-faint">
            estudio de pestañas · VL
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {/* Mobile menu button */}
          <button
            type="button"
            className="sm:hidden p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-zinc-950 animate-slide-in shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 id="mobile-menu-title" className="font-mono-khal text-[10px] uppercase tracking-[2px] text-white">
                Menú
              </h2>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Cerrar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2" aria-label="Navegación principal">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] touch-manipulation"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
