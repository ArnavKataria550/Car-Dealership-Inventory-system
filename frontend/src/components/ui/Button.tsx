import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'dark' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Shows a spinner and disables the button; `loadingText` replaces the label. */
  loading?: boolean;
  loadingText?: string;
}

const VARIANTS: Record<Variant, string> = {
  // Amber is reserved for the main action on a screen.
  primary: 'bg-accent text-ink-950 hover:bg-accent-hover shadow-sm hover:shadow-md',
  dark: 'bg-ink-950 text-paper hover:bg-ink-800 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-current hover:bg-white/10',
};

export function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  disabled,
  className = '',
  children,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold
        transition duration-200 hover:-translate-y-px active:translate-y-0
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0
        ${VARIANTS[variant]} ${className}`}
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
