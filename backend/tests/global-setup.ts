import { execSync } from 'node:child_process';

/**
 * Runs once before the test suite: brings the test database's schema up to date,
 * so a fresh checkout only needs the database to exist (see README).
 * vitest.config.ts has already refused to start without TEST_DATABASE_URL.
 */
export default function migrateTestDatabase(): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
