'use client';

import { Link, usePathname } from '@/i18n/navigation';

export interface AdminNavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminNavProps {
  links: AdminNavLink[];
  isCollapsed?: boolean;
}

/** Nav admin con `aria-current="page"` en el link activo (auditoría A2).
 * Soporta modo colapsado (solo iconos) y expandido (icono + label). */
export function AdminNav({ links, isCollapsed = false }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1" role="navigation" aria-label="Navegación de administración">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            aria-current={pathname === link.href ? 'page' : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              min-h-[44px] touch-manipulation
              ${isCollapsed
                ? 'justify-center px-2'
                : 'justify-start'
              }
              ${pathname === link.href
                ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            {link.icon && <span className="flex-shrink-0 w-5 h-5 text-current" aria-hidden="true">{link.icon}</span>}
            {!isCollapsed && <span className="truncate">{link.label}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
