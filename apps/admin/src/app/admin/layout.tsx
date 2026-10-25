import { AdminNav } from '@/components/admin/admin-nav';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { getTranslations } from 'next-intl/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('Admin.nav');

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-contrast"
      >
        Ir al contenido
      </a>
      {/* D13: admin = sólido oscuro (o papel en claro), SIN animación — el
          fondo lo da el body, sin lienzo. */}
      <header className="sticky top-0 z-10 border-b border-hairline bg-background/70 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="font-wordmark text-[17px] leading-none text-foreground">
              {t('brand')}
            </span>
            <AdminNav
              links={[
                { href: '/admin', label: t('agenda') },
                { href: '/admin/clientes', label: t('clientes') },
                { href: '/admin/servicios', label: t('servicios') },
                { href: '/admin/bloqueos', label: t('bloqueos') },
              ]}
            />
          </div>
          <ThemeToggle />
        </nav>
      </header>
      {children}
    </div>
  );
}
