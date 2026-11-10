import React from 'react';
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
    }, { timeout: 3000 });
  });

  it('mobile drawer has backdrop blur', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      // The backdrop is a sibling of the dialog panel - use partial class match
      const dialog = screen.getByRole('dialog');
      const backdrop = dialog.parentElement?.querySelector('[class*="backdrop-blur"]');
      expect(backdrop).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('mobile drawer panel has shadow', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      // The panel is the direct child of the fixed container
      const dialog = screen.getByRole('dialog');
      const panel = dialog.querySelector('.fixed.inset-y-0.right-0');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass('shadow-xl');
    }, { timeout: 3000 });
  });

  it('mobile drawer contains navigation links', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Conocenos' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('closes drawer on close button click', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });
    
    fireEvent.click(screen.getByLabelText('Cerrar menú'));
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('closes drawer when navigation link clicked', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });
    
    fireEvent.click(screen.getByRole('link', { name: 'Catálogo' }));
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('mobile drawer links have 44px touch targets', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    await waitFor(() => screen.getByRole('dialog'), { timeout: 3000 });
    
    const links = screen.getAllByRole('link', { name: /Catálogo|Conocenos/ });
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-\[44px\]');
      expect(link).toHaveClass('touch-manipulation');
    });
  });

  it('includes ThemeToggle in mobile drawer', async () => {
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    
    // The ThemeToggle is rendered in the drawer, wait for it
    await waitFor(() => {
      const drawer = screen.getByRole('dialog');
      expect(drawer.querySelector('[data-testid="theme-toggle"]')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('hides hamburger on desktop (sm breakpoint)', () => {
    render(<Header />);
    
    const menuBtn = screen.getByLabelText('Abrir menú');
    expect(menuBtn).toHaveClass('sm:hidden');
  });
});
