import { AdminNav } from '@/components/admin/admin-nav';
import { getTranslations } from 'next-intl/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('Admin.nav');

  return (
    <div className="min-h-dvh bg-white/[0.04]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded-full focus:bg-emerald-400 focus:px-4 focus:py-2 focus:text-sm focus:text-black"
      >
        Ir al contenido
      </a>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <span className="font-semibold tracking-tight text-white">{t('brand')}</span>
          <AdminNav
            links={[
              { href: '/admin', label: t('agenda') },
              { href: '/admin/clientes', label: t('clientes') },
              { href: '/admin/servicios', label: t('servicios') },
              { href: '/admin/bloqueos', label: t('bloqueos') },
            ]}
          />
        </nav>
      </header>
      {children}
    </div>
  );
}
