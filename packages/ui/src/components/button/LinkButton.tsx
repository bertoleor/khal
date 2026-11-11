"use client";

import React, { forwardRef, type AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

export type LinkButtonVariant = 'primary' | 'glass' | 'ghost';
export type LinkButtonSize = 'sm' | 'md' | 'lg';

export interface LinkButtonProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  external?: boolean;
}

const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-[-0.005em] transition-[background-color,border-color,color] duration-160 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] min-h-[44px] touch-manipulation';

const variantStyles = {
  primary: 'rounded-full bg-accent text-accent-contrast hover:bg-accent-soft shadow-[0_4px_16px_var(--shadow-elevated)]',
  glass: 'rounded-full border border-hairline bg-surface/90 text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] hover:bg-surface-hover',
  ghost: 'rounded-full text-foreground hover:bg-surface-hover',
} as const;

const sizeStyles = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-[17px] py-[11px] text-[13px]',
  lg: 'px-6 py-3 text-[15px]',
} as const;

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, href, variant = 'glass', size = 'md', icon, iconPosition = 'left', children, external, ...props }, ref) => {
    const isExternal = external || href.startsWith('http');
    const Component = isExternal ? 'a' : Link;
    const linkProps = isExternal ? { href, target: '_blank', rel: 'noreferrer' } : { href };

    return (
      <Component
        ref={ref as any}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...linkProps}
        {...(Component === 'a' ? {} : props)}
      >
        {icon && iconPosition === 'left' && <span className="mr-2" aria-hidden="true">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="ml-2" aria-hidden="true">{icon}</span>}
      </Component>
    );
  }
);

LinkButton.displayName = 'LinkButton';

export interface LinkButtonProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  external?: boolean;
}
