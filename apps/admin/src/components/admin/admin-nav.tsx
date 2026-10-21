'use client';

import { Link, usePathname } from '@/i18n/navigation';

export interface AdminNavLink {
  href: string;
  label: string;
}

/** Nav admin con `aria-current="page"` en el link activo (auditoría A2). */
export function AdminNav({ links }: { links: AdminNavLink[] }) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
          className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
