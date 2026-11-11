import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/current/path',
}));

describe('Breadcrumbs (E6 — responsive breadcrumbs)', () => {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Lifting de Pestañas' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mobile back button (lg:hidden)', () => {
    render(<Breadcrumbs items={items} />);
    
    const backBtn = screen.getByLabelText('Volver');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveClass('lg:hidden');
    expect(backBtn).toHaveClass('min-h-\[44px\]');
    expect(backBtn).toHaveClass('touch-manipulation');
  });

  it('mobile back button shows previous item label', () => {
    render(<Breadcrumbs items={items} />);
    
    const backBtn = screen.getByLabelText('Volver');
    expect(backBtn).toHaveTextContent('Servicios');
  });

  it('mobile back button links to previous item href', () => {
    render(<Breadcrumbs items={items} />);
    
    const backBtn = screen.getByLabelText('Volver');
    expect(backBtn).toHaveAttribute('href', '/servicios');
  });

  it('mobile back button shows ChevronLeft icon', () => {
    render(<Breadcrumbs items={items} />);
    
    const icon = screen.getByLabelText('Volver').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('falls back to "/" when only one item', () => {
    const singleItem = [{ label: 'Solo uno' }];
    render(<Breadcrumbs items={singleItem} />);
    
    const backBtn = screen.getByLabelText('Volver');
    expect(backBtn).toHaveAttribute('href', '/');
    expect(backBtn).toHaveTextContent('Volver');
  });

  it('falls back to "/" when previous item has no href', () => {
    const noHrefItems = [{ label: 'A' }, { label: 'B' }];
    render(<Breadcrumbs items={noHrefItems} />);
    
    const backBtn = screen.getByLabelText('Volver');
    expect(backBtn).toHaveAttribute('href', '/');
  });

  it('renders desktop breadcrumbs (hidden lg:flex)', () => {
      render(<Breadcrumbs items={items} />);
    
      const ol = screen.getByTestId('desktop-breadcrumbs');
      expect(ol).toBeInTheDocument();
      expect(ol).toHaveClass('hidden');
      expect(ol).toHaveClass('lg:flex');
    });

  it('desktop breadcrumbs show all items with separators', () => {
    render(<Breadcrumbs items={items} />);
    
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Servicios' })).toHaveAttribute('href', '/servicios');
    expect(screen.getByText('Lifting de Pestañas')).toBeInTheDocument();
  });

  it('last item has aria-current="page"', () => {
    render(<Breadcrumbs items={items} />);
    
    const lastItem = screen.getByText('Lifting de Pestañas');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
    expect(lastItem).toHaveClass('font-medium');
  });

  it('non-last items are links', () => {
    render(<Breadcrumbs items={items} />);
    
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Servicios' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Breadcrumbs items={items} className="custom-class" />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-class');
  });

  it('links have focus-visible styles', () => {
    render(<Breadcrumbs items={items} />);
    
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('focus-visible:outline-none');
      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:ring-accent');
    });
  });
});
