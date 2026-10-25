import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ToastContext, type ToastInput, type ToastTone } from './toast-context';

const AUTO_DISMISS_MS = 4000;

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

let nextToastId = 0;

/** Renders toasts in a polite live region in the bottom-right corner. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, tone = 'success' }: ToastInput) => {
    setToasts((current) => [...current, { id: nextToastId++, message, tone }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.tone === 'error';

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl bg-ink-950 px-4 py-3 text-sm text-paper shadow-card-hover"
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${
          isError ? 'bg-red-500 text-white' : 'bg-accent text-ink-950'
        }`}
      >
        {isError ? '!' : '✓'}
      </span>
      <p className="flex-1 leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 rounded-md px-1 text-stone-400 transition hover:text-paper"
      >
        ×
      </button>
    </div>
  );
}
