import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('Admin.nav');

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <span className="font-semibold tracking-tight text-slate-900">{t('brand')}</span>
          <Link href="/admin" className="text-sm text-slate-600">
            {t('agenda')}
          </Link>
          <Link href="/admin/clientes" className="text-sm text-slate-600">
            {t('clientes')}
          </Link>
          <Link href="/admin/servicios" className="text-sm text-slate-600">
            {t('servicios')}
          </Link>
          <Link href="/admin/bloqueos" className="text-sm text-slate-600">
            {t('bloqueos')}
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
