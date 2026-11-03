"use client";

import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type IconButtonVariant = 'primary' | 'glass' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
  children: React.ReactNode;
}

const baseStyles = 'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.985]';

const variantStyles = {
  primary: 'rounded-full bg-accent text-accent-contrast hover:bg-accent-soft',
  glass: 'rounded-full border border-hairline bg-surface/90 text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] hover:bg-surface-hover',
  ghost: 'rounded-full text-foreground hover:bg-surface-hover',
} as const;

const sizeStyles = {
  sm: 'p-2',
  md: 'p-[10px]',
  lg: 'p-3',
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'glass', size = 'md', 'aria-label': ariaLabel, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        aria-label={ariaLabel}
        {...props}
      >
        <span className="flex items-center justify-center" aria-hidden="true">
          {children}
        </span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
  children: React.ReactNode;
}
