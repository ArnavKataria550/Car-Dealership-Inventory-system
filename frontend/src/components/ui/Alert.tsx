import type { ReactNode } from 'react';

type Tone = 'error' | 'info';

const TONES: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-amber-200 bg-amber-50 text-amber-900',
};

/** Inline message box. Errors use role="alert" so they are announced immediately. */
export function Alert({ tone = 'error', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
