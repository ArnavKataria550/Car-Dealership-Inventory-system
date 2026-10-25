import { Link } from 'react-router';

/** Shown to signed-in users who open an admin-only page. */
export function NoAccessPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-ink-950 text-2xl text-accent shadow-card">
        <span aria-hidden="true">⛔</span>
      </div>
      <h1 className="text-3xl font-semibold">You don't have access</h1>
      <p className="mt-3 text-stone-600">
        This area is only for dealership admins. If you think this is a mistake, contact your
        administrator.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-paper shadow-sm transition hover:-translate-y-px hover:bg-ink-800 hover:shadow-md"
      >
        Back to inventory
      </Link>
    </section>
  );
}
