import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { LinkButton } from './LinkButton';
import { IconButton } from './IconButton';

describe('Button', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button', { name: 'Primary' })).toHaveClass('bg-accent');
  });

  it('renders with glass variant', () => {
    render(<Button variant="glass">Glass</Button>);
    expect(screen.getByRole('button', { name: 'Glass' })).toHaveClass('bg-surface/90');
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
    expect(screen.getByRole('button')).toContainHTML('svg');
  });

  it('handles icon position', () => {
    render(<Button icon={<span>→</span>} iconPosition="left">With Icon</Button>);
    expect(screen.getByRole('button')).toContainHTML('→');
  });
});

describe('LinkButton', () => {
  it('renders as Link for internal href', () => {
    render(<LinkButton href="/catalogo" variant="glass">Catálogo</LinkButton>);
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/catalogo');
  });

  it('renders as <a> for external href', () => {
    render(<LinkButton href="https://example.com" variant="glass" external>External</LinkButton>);
    expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('target', '_blank');
  });
});

describe('IconButton', () => {
  it('requires aria-label', () => {
    render(<IconButton aria-label="Cerrar"><svg/></IconButton>);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });
});
