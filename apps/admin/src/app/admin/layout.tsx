import { AdminNav } from '@/components/admin/admin-nav';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { getTranslations } from 'next-intl/server';
import { useState } from 'react';
import { X, Menu, ChevronLeft } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('Admin.nav');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navLinks = [
    { href: '/admin', label: t('agenda'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { href: '/admin/clientes', label: t('clientes'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { href: '/admin/servicios', label: t('servicios'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V9a.5.5 0 00-1 0v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5V9a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V3a.5.5 0 00-.5-.5H9a.5.5 0 00-.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V3a.5.5 0 00-.5-.5H5a2 2 0 00-2 2v14a2 2 0 012 2h14a2 2 0 002-2v-5" /></svg> },
    { href: '/admin/bloqueos', label: t('bloqueos'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-contrast"
      >
        Ir al contenido
      </a>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-hairline
          transition-all duration-300 ease-out lg:translate-x-0
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Navegación de administración"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-3 border-b border-hairline">
            {isSidebarCollapsed ? (
                          <button
                            type="button"
                            onClick={() => setIsSidebarCollapsed(false)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] min-w-[44px] touch-manipulation"
                            aria-label="Expandir navegación"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        ) : (
              <div className="flex items-center gap-3 px-3">
                <span className="font-wordmark text-[17px] leading-none text-foreground">
                  Admin
                </span>
                <button
                                  type="button"
                                  onClick={() => setIsSidebarCollapsed(true)}
                                  className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] min-w-[44px] touch-manipulation"
                                  aria-label="Colapsar navegación"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                              </div>
                            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Navegación de administración">
            <AdminNav links={navLinks} isCollapsed={isSidebarCollapsed} />
          </nav>

          {/* Footer */}
          <div className="border-t border-hairline p-3">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle button */}
      <button
        type="button"
        className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full bg-emerald-400 p-3 text-black shadow-lg hover:bg-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Abrir navegación"
        aria-expanded={isSidebarOpen}
        aria-controls="admin-sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-hairline bg-background/70 backdrop-blur lg:ml-64 lg:ml-[calc(16rem+1rem)] transition-all duration-300">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
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
        </div>
      </header>
      <main id="main" className="lg:ml-64 lg:ml-[calc(16rem+1rem)] transition-all duration-300 min-h-[calc(100vh-56px)]">
        {children}
      </main>
    </div>
  );
}
