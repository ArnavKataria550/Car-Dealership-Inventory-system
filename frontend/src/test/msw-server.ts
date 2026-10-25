import { setupServer } from 'msw/node';

/**
 * Fake API for component tests. It starts with no handlers; each test
 * registers exactly the responses it needs with `server.use(...)`, so tests
 * never depend on a running backend.
 */
export const server = setupServer();
