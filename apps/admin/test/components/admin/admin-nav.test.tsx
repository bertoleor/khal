import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminNav } from '@/components/admin/admin-nav';
import { Link } from '@/i18n/navigation';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/servicios',
}));

// Mock i18n navigation Link
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
  usePathname: () => '/admin/servicios',
}));

describe('AdminNav (E6 — responsive admin navigation)', () => {
  const links = [
    { href: '/admin', label: 'Agenda', icon: <svg data-testid="icon-agenda" /> },
    { href: '/admin/clientes', label: 'Clientes', icon: <svg data-testid="icon-clientes" /> },
    { href: '/admin/servicios', label: 'Servicios', icon: <svg data-testid="icon-servicios" /> },
    { href: '/admin/bloqueos', label: 'Bloqueos', icon: <svg data-testid="icon-bloqueos" /> },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation list', () => {
    render(<AdminNav links={links} />);
    
    expect(screen.getByRole('navigation', { name: 'Navegación de administración' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('marks active link with aria-current="page"', () => {
    render(<AdminNav links={links} />);
    
    const activeLink = screen.getByRole('link', { name: 'Servicios' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('active link has emerald styling', () => {
    render(<AdminNav links={links} />);
    
    const activeLink = screen.getByRole('link', { name: 'Servicios' });
    expect(activeLink).toHaveClass('bg-emerald-400/10');
    expect(activeLink).toHaveClass('text-emerald-300');
    expect(activeLink).toHaveClass('border-emerald-400/20');
  });

  it('inactive links have zinc styling', () => {
    render(<AdminNav links={links} />);
    
    const inactiveLink = screen.getByRole('link', { name: 'Agenda' });
    expect(inactiveLink).toHaveClass('text-zinc-300');
    expect(inactiveLink).toHaveClass('hover:bg-white/5');
    expect(inactiveLink).toHaveClass('hover:text-white');
  });

  it('renders icons for each link', () => {
    render(<AdminNav links={links} />);
    
    expect(screen.getByTestId('icon-agenda')).toBeInTheDocument();
    expect(screen.getByTestId('icon-clientes')).toBeInTheDocument();
    expect(screen.getByTestId('icon-servicios')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bloqueos')).toBeInTheDocument();
  });

  it('icons have w-5 h-5 and flex-shrink-0', () => {
    render(<AdminNav links={links} />);
    
    const icons = screen.getAllByTestId(/icon-/);
    icons.forEach((icon) => {
      expect(icon).toHaveClass('w-5');
      expect(icon).toHaveClass('h-5');
      expect(icon).toHaveClass('flex-shrink-0');
    });
  });

  it('collapsed mode shows only icons (justify-center)', () => {
    render(<AdminNav links={links} isCollapsed={true} />);
    
    const links_el = screen.getAllByRole('link');
    links_el.forEach((link) => {
      expect(link).toHaveClass('justify-center');
      expect(link).toHaveClass('px-2');
    });
  });

  it('collapsed mode hides labels (truncate not applied)', () => {
    render(<AdminNav links={links} isCollapsed={true} />);
    
    // Labels should not be visible in collapsed mode
    expect(screen.queryByText('Agenda')).not.toBeInTheDocument();
    expect(screen.queryByText('Servicios')).not.toBeInTheDocument();
  });

  it('expanded mode shows labels (justify-start)', () => {
    render(<AdminNav links={links} isCollapsed={false} />);
    
    const links_el = screen.getAllByRole('link');
    links_el.forEach((link) => {
      expect(link).toHaveClass('justify-start');
    });
  });

  it('expanded mode shows labels', () => {
    render(<AdminNav links={links} isCollapsed={false} />);
    
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
  });

  it('all links have 44px touch targets', () => {
    render(<AdminNav links={links} />);
    
    const links_el = screen.getAllByRole('link');
    links_el.forEach((link) => {
      expect(link).toHaveClass('min-h-\[44px\]');
      expect(link).toHaveClass('touch-manipulation');
    });
  });

  it('links have focus-visible styles', () => {
    render(<AdminNav links={links} />);
    
    const links_el = screen.getAllByRole('link');
    links_el.forEach((link) => {
      expect(link).toHaveClass('focus-visible:outline-2');
      expect(link).toHaveClass('focus-visible:outline-offset-2');
      expect(link).toHaveClass('focus-visible:outline-accent');
    });
  });

  it('has space-y-1 between items', () => {
    const { container } = render(<AdminNav links={links} />);
    
    const ul = container.querySelector('ul');
    expect(ul).toHaveClass('space-y-1');
  });

  it('handles links without icons gracefully', () => {
    const linksNoIcon = [
      { href: '/admin', label: 'Agenda' },
      { href: '/admin/servicios', label: 'Servicios' },
    ];
    
    render(<AdminNav links={linksNoIcon} />);
    
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
