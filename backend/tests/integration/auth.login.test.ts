import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';

describe('POST /api/auth/login', () => {
  const app = createApp();
  const credentials = { email: 'arnav@example.com', password: 'supersecret' };

  beforeEach(async () => {
    await resetDatabase();
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Arnav Kataria', ...credentials })
      .expect(201);
  });
  afterAll(disconnectDatabase);

  it('200: returns a JWT and the user without the password hash', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials);

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: 'Arnav Kataria',
      email: 'arnav@example.com',
      role: 'USER',
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('issues a token signed with JWT_SECRET that identifies the user and expires in 1 hour', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials);

    const payload = jwt.verify(response.body.token, env.JWT_SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe(response.body.user.id);
    expect(payload.role).toBe('USER');
    expect(payload.exp! - payload.iat!).toBe(60 * 60);
  });

  it('accepts the email in any letter case', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'Arnav@Example.com' });

    expect(response.status).toBe(200);
  });

  it('401: wrong password and unknown email give the same response', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'nobody@example.com' });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    });
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it.each([
    ['email is missing', { password: 'supersecret' }, 'email'],
    ['email is invalid', { email: 'not-an-email', password: 'supersecret' }, 'email'],
    ['password is missing', { email: 'arnav@example.com' }, 'password'],
  ])('400: when %s', async (_case, body, field) => {
    const response = await request(app).post('/api/auth/login').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
  });
});
