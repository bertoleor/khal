import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '@/components/shared/header';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

// Mock ThemeToggle
vi.mock('@/components/shared/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" aria-label="Toggle theme" />,
}));

describe('Header (E6 — mobile nav drawer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skip link for accessibility', () => {
    render(<Header />);
    
    const skipLink = screen.getByText('Ir al contenido');
    expect(skipLink).toHaveAttribute('href', '#main');
    expect(skipLink).toHaveClass('sr-only');
  });

  it('renders wordmark kicker', () => {
    render(<Header />);
    
    expect(screen.getByText('estudio de pestañas · VL')).toBeInTheDocument();
  });

  it('renders ThemeToggle', () => {
    render(<Header />);
    
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('shows mobile hamburger menu button', () => {
    render(<Header />);
    
    const menuBtn = screen.getByLabelText('Abrir menú');
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveClass('sm:hidden');
    expect(menuBtn).toHaveClass('min-h-\[44px\]');
    expect(menuBtn).toHaveClass('min-w-\[44px\]');
    expect(menuBtn).toHaveClass('touch-manipulation');
  });

  it('opens mobile drawer on hamburger click', async () => {
    render(<Header />);
    
    const menuBtn = screen.getByLabelText('Abrir menú');
    fireEvent.click(menuBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Menú' })).toBeInTheDocument();
      expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
    });
  });

  it('mobile drawer has backdrop blur and fade-in animation', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      const backdrop = screen.getByTestId('mobile-menu-backdrop');
      expect(backdrop).toHaveClass('backdrop-blur-sm');
      expect(backdrop).toHaveClass('animate-fade-in');
    });
  });

  it('mobile drawer slides in from right', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('animate-slide-in');
      expect(drawer).toHaveClass('shadow-xl');
    });
  });

  it('mobile drawer contains navigation links', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Conocenos' })).toBeInTheDocument();
    });
  });

  it('closes drawer on backdrop click', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'));
    
    fireEvent.click(screen.getByTestId('mobile-menu-backdrop'));
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes drawer on close button click', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'));
    
    fireEvent.click(screen.getByLabelText('Cerrar menú'));
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes drawer when navigation link clicked', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'));
    
    fireEvent.click(screen.getByRole('link', { name: 'Catálogo' }));
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('mobile drawer links have 44px touch targets', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'));
    
    const links = screen.getAllByRole('link', { name: /Catálogo|Conocenos/ });
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-\[44px\]');
      expect(link).toHaveClass('touch-manipulation');
    });
  });

  it('includes ThemeToggle in mobile drawer', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  it('hides hamburger on desktop (sm breakpoint)', () => {
    render(<Header />);
    
    const menuBtn = screen.getByLabelText('Abrir menú');
    expect(menuBtn).toHaveClass('sm:hidden');
  });
});
