export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'danger' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  // Amber is reserved for the main action on a screen.
  primary: 'bg-accent text-ink-950 hover:bg-accent-hover shadow-sm hover:shadow-md',
  dark: 'bg-ink-950 text-paper hover:bg-ink-800 shadow-sm hover:shadow-md',
  outline: 'border border-stone-300 bg-white text-ink-900 hover:border-ink-950',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-current hover:bg-white/10',
};

/** Shared look for buttons and button-styled links, so the two never drift apart. */
export function buttonClasses(variant: ButtonVariant = 'primary', className = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold
    transition duration-200 hover:-translate-y-px active:translate-y-0
    disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0
    ${VARIANTS[variant]} ${className}`;
}
