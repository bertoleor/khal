import { Link } from '@/i18n/navigation';

/**
 * Admin Footer: simplified version for the admin panel.
 * Links to admin-specific pages.
 */
export default function SiteFooter() {
  const adminLinks: Array<{ label: string; href: string }> = [
    { label: 'Cerrar sesión', href: '/admin/login' },
  ];

  return (
    <footer className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between gap-x-4 font-mono-khal text-[8px] uppercase tracking-[2px] text-faint">
        <nav aria-label="Admin links" className="flex flex-wrap items-center gap-x-[5px] gap-y-1">
          {adminLinks.map((link, index) => (
            <span key={link.label} className="flex items-center gap-x-[5px]">
              {index > 0 && <span aria-hidden="true">·</span>}
              <Link
                href={link.href}
                className="transition-[color] duration-160 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
        <span>khal admin</span>
      </div>
    </footer>
  );
}
