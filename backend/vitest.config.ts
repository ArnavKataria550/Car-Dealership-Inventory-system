import 'dotenv/config';

import { defineConfig } from 'vitest/config';

// Integration tests must never touch the development database, so the suite
// refuses to start unless a dedicated test database is configured.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be set to run the test suite (see .env.example)');
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Allows the suite to run before the first test exists (scaffold commits).
    passWithNoTests: true,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      // Minimum bcrypt cost keeps hashing fast in tests; production uses the default.
      BCRYPT_ROUNDS: '4',
    },
    // Integration test files share one database, so run files one at a time.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/generated/**'],
      reporter: ['text', 'html', 'json-summary'],
    },
  },
});
