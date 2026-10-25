import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled input whose error is announced to screen readers via aria-describedby. */
export function TextField({ label, error, hint, className = '', ...inputProps }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`block w-full rounded-xl border bg-white px-4 py-3 text-ink-950 shadow-xs transition
          placeholder:text-stone-400 focus:outline-none focus:ring-4
          ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
              : 'border-stone-300 focus:border-accent focus:ring-accent/20'
          }`}
        {...inputProps}
      />
      {message && (
        <p id={messageId} className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-stone-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
