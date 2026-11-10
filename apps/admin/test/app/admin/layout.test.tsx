import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLayout from '@/app/admin/layout';

// Mock next-intl
vi.mock('next-intl', () => ({
  getTranslations: () => Promise.resolve((key: string) => {
    const translations: Record<string, string> = {
      'Admin.nav.agenda': 'Agenda',
      'Admin.nav.clientes': 'Clientes',
      'Admin.nav.servicios': 'Servicios',
      'Admin.nav.bloqueos': 'Bloqueos',
      'Admin.nav.brand': 'Admin',
    };
    return translations[key] || key;
  }),
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/servicios',
}));

// Mock ThemeToggle
vi.mock('@/components/admin/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" aria-label="Toggle theme" />,
}));

// Mock AdminNav
vi.mock('@/components/admin/admin-nav', () => ({
  AdminNav: ({ links, isCollapsed }: any) => (
    <nav data-testid="admin-nav" data-collapsed={isCollapsed}>
      {links?.map((l: any) => (
        <a key={l.href} href={l.href} data-testid={`nav-${l.label.toLowerCase()}`}>
          {l.icon ? <span data-testid={`icon-${l.label.toLowerCase()}`} /> : null}
          {!isCollapsed && <span>{l.label}</span>}
        </a>
      ))}
    </nav>
  ),
}));

describe('AdminLayout (E6 — responsive admin layout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skip link for accessibility', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    const skipLink = screen.getByText('Ir al contenido');
    expect(skipLink).toHaveAttribute('href', '#main');
  });

  it('renders mobile sidebar toggle button (FAB)', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    const fab = screen.getByLabelText('Abrir navegación');
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveClass('lg:hidden');
    expect(fab).toHaveClass('fixed');
    expect(fab).toHaveClass('bottom-4');
    expect(fab).toHaveClass('right-4');
    expect(fab).toHaveClass('min-h-\[44px\]');
    expect(fab).toHaveClass('min-w-\[44px\]');
    expect(fab).toHaveClass('touch-manipulation');
    expect(fab).toHaveClass('rounded-full');
    expect(fab).toHaveClass('bg-emerald-400');
  });

  it('opens mobile sidebar drawer on FAB click', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    fireEvent.click(screen.getByLabelText('Abrir navegación'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cerrar navegación')).toBeInTheDocument();
    });
  });

  it('mobile sidebar has backdrop overlay', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    fireEvent.click(screen.getByLabelText('Abrir navegación'));
    
    await waitFor(() => {
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\/50.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });
  });

  it('mobile sidebar slides in from left', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    fireEvent.click(screen.getByLabelText('Abrir navegación'));
    
    await waitFor(() => {
      const sidebar = screen.getByLabelText('Navegación de administración');
      expect(sidebar).toHaveClass('translate-x-0');
    });
  });

  it('closes mobile sidebar on backdrop click', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    fireEvent.click(screen.getByLabelText('Abrir navegación'));
    await waitFor(() => screen.getByLabelText('Navegación de administración'));
    
    fireEvent.click(document.querySelector('.fixed.inset-0.bg-black\/50.backdrop-blur-sm')!);
    
    await waitFor(() => {
      expect(screen.queryByLabelText('Navegación de administración')).not.toBeInTheDocument();
    });
  });

  it('closes mobile sidebar on close button', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    fireEvent.click(screen.getByLabelText('Abrir navegación'));
    await waitFor(() => screen.getByLabelText('Navegación de administración'));
    
    fireEvent.click(screen.getByLabelText('Cerrar navegación'));
    
    await waitFor(() => {
      expect(screen.queryByLabelText('Navegación de administración')).not.toBeInTheDocument();
    });
  });

  it('sidebar header shows "Admin" wordmark when expanded', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    // Default is expanded
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('sidebar header shows collapse button when expanded', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Colapsar navegación')).toBeInTheDocument();
    });
  });

  it('sidebar header shows expand button when collapsed', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    // Click collapse button
    fireEvent.click(screen.getByLabelText('Colapsar navegación'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('Expandir navegación')).toBeInTheDocument();
    });
  });

  it('toggles sidebar collapse/expand', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    // Collapse
    fireEvent.click(screen.getByLabelText('Colapsar navegación'));
    await waitFor(() => {
      expect(screen.getByLabelText('Expandir navegación')).toBeInTheDocument();
    });
    
    // Expand
    fireEvent.click(screen.getByLabelText('Expandir navegación'));
    await waitFor(() => {
      expect(screen.getByLabelText('Colapsar navegación')).toBeInTheDocument();
    });
  });

  it('collapsed sidebar has w-16 width', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    fireEvent.click(screen.getByLabelText('Colapsar navegación'));
    
    await waitFor(() => {
      const sidebar = screen.getByLabelText('Navegación de administración');
      expect(sidebar).toHaveClass('w-16');
    });
  });

  it('expanded sidebar has w-64 width', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    await waitFor(() => {
      const sidebar = screen.getByLabelText('Navegación de administración');
      expect(sidebar).toHaveClass('w-64');
    });
  });

  it('renders AdminNav in sidebar', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    });
  });

  it('renders ThemeToggle in sidebar footer', async () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  it('header is sticky top-0 with backdrop blur', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    const header = screen.getByRole('banner').closest('header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
    expect(header).toHaveClass('z-10');
    expect(header).toHaveClass('backdrop-blur');
    expect(header).toHaveClass('bg-background/70');
  });

  it('header shows brand wordmark', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('header shows AdminNav (desktop nav)', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
  });

  it('header shows ThemeToggle', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('main content has lg:ml-64 offset for sidebar', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('lg:ml-64');
    expect(main).toHaveClass('lg:ml-\[calc\(16rem\+1rem\)\]');
    expect(main).toHaveClass('min-h-\[calc\(100vh-56px\)\]');
  });

  it('hides FAB on desktop (lg:hidden)', () => {
    render(<AdminLayout><div id="main">Content</div></AdminLayout>);
    
    const fab = screen.getByLabelText('Abrir navegación');
    expect(fab).toHaveClass('lg:hidden');
  });
});
