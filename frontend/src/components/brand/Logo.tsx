import { BRAND_NAME } from '../../config/brand';

interface LogoProps {
  className?: string;
  /** Show only the "D" mark on small screens (used in the navbar, where space is tight). */
  compactOnMobile?: boolean;
}

/** Drivewright wordmark: a rounded "D" mark plus the name with an amber full stop. */
export function Logo({ className = '', compactOnMobile = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#0B0B0C" />
        <path
          d="M20 16h13c10 0 17 6.6 17 16s-7 16-17 16H20z"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display text-xl font-semibold tracking-tight ${
          compactOnMobile ? 'hidden sm:inline' : ''
        }`}
      >
        {BRAND_NAME}
        <span className="text-accent">.</span>
      </span>
    </span>
  );
}
