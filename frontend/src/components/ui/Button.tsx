import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';

import { buttonClasses, type ButtonVariant } from './button-classes';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables the button; `loadingText` replaces the label. */
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={buttonClasses(variant, className)}
      {...buttonProps}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

/** A router link that looks like a Button. */
export function ButtonLink({
  variant = 'primary',
  className,
  ...linkProps
}: LinkProps & { variant?: ButtonVariant }) {
  return <Link className={buttonClasses(variant, className)} {...linkProps} />;
}
