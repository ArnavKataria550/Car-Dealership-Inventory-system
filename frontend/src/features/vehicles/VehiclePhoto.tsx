import { useState } from 'react';

/** A listing photo that falls back to a neutral placeholder if the image cannot load. */
export function VehiclePhoto({
  src,
  title,
  dimmed = false,
  className = '',
}: {
  src: string;
  title: string;
  dimmed?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-200 to-stone-300 text-stone-500">
        <svg
          viewBox="0 0 24 24"
          className="size-10"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z"
          />
        </svg>
        <span className="text-xs font-medium">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`size-full object-cover transition duration-500 group-hover:scale-105 ${className} ${
        dimmed ? 'opacity-60 grayscale-[60%]' : ''
      }`}
    />
  );
}
