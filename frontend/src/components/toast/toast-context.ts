import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error';

export interface ToastInput {
  message: string;
  tone?: ToastTone;
}

export interface ToastContextValue {
  showToast(toast: ToastInput): void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Show short, non-blocking notifications. Must be used inside <ToastProvider>. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return context;
}
