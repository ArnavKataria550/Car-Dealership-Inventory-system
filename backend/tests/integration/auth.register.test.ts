import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';

describe('POST /api/auth/register', () => {
  const app = createApp();
  const validBody = { name: 'Arnav Kataria', email: 'arnav@example.com', password: 'supersecret' };

  beforeEach(resetDatabase);
  afterAll(disconnectDatabase);

  it('201: creates the user and returns it without the password hash', async () => {
    const response = await request(app).post('/api/auth/register').send(validBody);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      id: expect.any(String),
      name: 'Arnav Kataria',
      email: 'arnav@example.com',
      role: 'USER',
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('persists the user with a bcrypt hash, not the plain password', async () => {
    await request(app).post('/api/auth/register').send(validBody);

    const stored = await prisma.user.findUnique({ where: { email: 'arnav@example.com' } });
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('ignores a role in the body: everyone registers as USER', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, role: 'ADMIN' });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('USER');
  });

  it('409: rejects an email that is already registered, ignoring case', async () => {
    await request(app).post('/api/auth/register').send(validBody);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, email: 'ARNAV@Example.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it.each([
    ['name is missing', { email: 'arnav@example.com', password: 'supersecret' }, 'name'],
    ['name is blank', { ...validBody, name: '   ' }, 'name'],
    ['email is invalid', { ...validBody, email: 'not-an-email' }, 'email'],
    ['password is shorter than 8 characters', { ...validBody, password: 'short12' }, 'password'],
    [
      'password is longer than 72 characters',
      { ...validBody, password: 'x'.repeat(73) },
      'password',
    ],
  ])('400: when %s', async (_case, body, field) => {
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
  });

  it('400: rejects malformed JSON', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": "Arnav",');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MALFORMED_JSON');
  });
});
