import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

/**
 * Breadcrumbs responsive:
 * - Mobile: solo botón "Atrás" con ChevronLeft
 * - Desktop: breadcrumbs completos con separadores
 */
export function Breadcrumbs({ 
  items, 
  className = '' 
}: { 
  items: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations('common');

  return (
    <nav 
      className={`flex items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Mobile back button */}
      <Link
        href={items.length > 1 ? (items[items.length - 2].href ?? '/') : '/'}
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] touch-manipulation"
        aria-label="Volver"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="truncate max-w-[120px]">{items.length > 1 ? items[items.length - 2].label : 'Volver'}</span>
      </Link>

      {/* Desktop breadcrumbs */}
            <ol 
              data-testid="desktop-breadcrumbs"
              className="hidden lg:flex items-center gap-1.5" 
              role="navigation" 
              aria-label="Breadcrumb"
            >
        {items.map((item, index) => (
          <li key={item.href || item.label}>
            {index > 0 && (
              <span className="text-zinc-500" aria-hidden="true">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-white truncate max-w-[200px]" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
