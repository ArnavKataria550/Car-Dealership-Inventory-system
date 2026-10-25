import { BRAND_NAME, BRAND_TAGLINE } from './config/brand';

/** Root component. Routing and authentication are added in the following commits. */
export function App() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-950 px-6 text-paper">
      <div className="text-center">
        <h1 className="text-5xl font-semibold">
          {BRAND_NAME}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-3 text-stone-400">{BRAND_TAGLINE}</p>
      </div>
    </main>
  );
}
