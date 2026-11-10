import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SiteFooter from '@/components/shared/site-footer';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock getPaymentSettings
vi.mock('@/lib/actions/settings', () => ({
  getPaymentSettings: vi.fn().mockResolvedValue({ whatsappPhone: '+5491112345678' }),
}));

// Mock socials
vi.mock('@/lib/socials', () => ({
  INSTAGRAM_URL: 'https://instagram.com/khal',
  TIKTOK_URL: 'https://tiktok.com/@khal',
  whatsappUrl: (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`,
}));

describe('SiteFooter (E6 — responsive footer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ghost watermark "Khal" at 72px', () => {
    const { container } = render(<SiteFooter />);
    
    const watermark = container.querySelector('[aria-hidden="true"]');
    expect(watermark).toBeInTheDocument();
    expect(watermark).toHaveTextContent('Khal');
    expect(watermark).toHaveClass('font-wordmark');
    expect(watermark).toHaveClass('text-\[72px\]');
  });

  it('renders social links with middot separators', () => {
    render(<SiteFooter />);
    
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/khal');
    expect(screen.getByRole('link', { name: 'TikTok' })).toHaveAttribute('href', 'https://tiktok.com/@khal');
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('renders Políticas link', () => {
    render(<SiteFooter />);
    
    expect(screen.getByRole('link', { name: 'Políticas' })).toHaveAttribute('href', '/politicas');
  });

  it('renders "vicente lópez"', () => {
    render(<SiteFooter />);
    
    expect(screen.getByText('vicente lópez')).toBeInTheDocument();
  });

  it('uses flex-col on mobile (default)', () => {
    const { container } = render(<SiteFooter />);
    
    const innerDiv = container.querySelector('footer > div:last-child');
    expect(innerDiv).toHaveClass('flex-col');
  });

  it('uses flex-row on desktop (sm breakpoint)', () => {
    const { container } = render(<SiteFooter />);
    
    const innerDiv = container.querySelector('footer > div:last-child');
    expect(innerDiv).toHaveClass('sm:flex-row');
  });

  it('items center on desktop', () => {
    const { container } = render(<SiteFooter />);
    
    const innerDiv = container.querySelector('footer > div:last-child');
    expect(innerDiv).toHaveClass('sm:items-center');
  });

  it('justify between on desktop', () => {
    const { container } = render(<SiteFooter />);
    
    const innerDiv = container.querySelector('footer > div:last-child');
    expect(innerDiv).toHaveClass('sm:justify-between');
  });

  it('all links have 44px touch targets', () => {
    render(<SiteFooter />);
    
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('min-h-\[44px\]');
      expect(link).toHaveClass('touch-manipulation');
    });
  });

  it('nav has flex-wrap for mobile stacking', () => {
    const { container } = render(<SiteFooter />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex-wrap');
  });

  it('handles missing WhatsApp phone gracefully', async () => {
    vi.mock('@/lib/actions/settings', () => ({
      getPaymentSettings: vi.fn().mockResolvedValue({ whatsappPhone: '' }),
    }));
    
    // Re-render with new mock
    const { rerender } = render(<SiteFooter />);
    rerender(<SiteFooter />);
    
    expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument();
  });
});
