import { randomUUID } from 'node:crypto';

import { env } from '../../src/config/env.js';
import type { Role } from '../../src/modules/auth/auth.types.js';
import { JwtTokenService } from '../../src/modules/auth/token.service.js';
import { prisma } from './database.js';

const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

/**
 * Inserts a user straight into the test database and returns a valid
 * `Authorization` header for them, so protected-route tests do not have to
 * go through register + login (which have their own tests).
 */
export async function createUserWithToken(role: Role = 'USER') {
  const user = await prisma.user.create({
    data: {
      name: role === 'ADMIN' ? 'Test Admin' : 'Test User',
      email: `${role.toLowerCase()}-${randomUUID()}@example.com`,
      passwordHash: 'not-used-by-these-tests',
      role,
    },
  });
  const token = tokens.sign({ id: user.id, role: user.role });

  return { user, token, authHeader: `Bearer ${token}` };
}
