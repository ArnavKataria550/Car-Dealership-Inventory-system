import { Button } from './Button';

/** "We couldn't load …" banner with a Retry button, announced as an alert. */
export function LoadError({
  what,
  message,
  onRetry,
}: {
  /** What failed to load, e.g. "the inventory". */
  what: string;
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <strong className="font-semibold">We couldn't load {what}.</strong>{' '}
        {message ?? 'Please try again.'}
      </p>
      <Button variant="dark" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
