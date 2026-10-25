import { ButtonLink } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <p className="font-display text-7xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-stone-600">
        This road doesn't go anywhere. The page may have moved or never existed.
      </p>
      <ButtonLink to="/" variant="dark" className="mt-8">
        Back to inventory
      </ButtonLink>
    </section>
  );
}
