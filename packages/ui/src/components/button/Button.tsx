"use client";

import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'glass' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-[-0.005em] transition-[background-color,border-color,color] duration-160 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] min-h-[44px] touch-manipulation';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'rounded-full bg-accent text-accent-contrast hover:bg-accent-soft shadow-[0_4px_16px_var(--shadow-elevated)]',
  glass: 'rounded-full border border-hairline bg-surface/90 text-foreground backdrop-blur-lg shadow-[inset_0_1px_0_var(--glass-highlight)] hover:bg-surface-hover',
  ghost: 'rounded-full text-foreground hover:bg-surface-hover',
  outline: 'rounded-full border border-hairline bg-transparent text-foreground hover:bg-surface-hover',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-[17px] py-[11px] text-[13px]',
  lg: 'px-6 py-3 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, iconPosition = 'left', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon && iconPosition === 'left' ? (
          <span className="mr-2" aria-hidden="true">{icon}</span>
        ) : null}
        {children}
        {icon && iconPosition === 'right' && <span className="ml-2" aria-hidden="true">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type { ButtonProps };
