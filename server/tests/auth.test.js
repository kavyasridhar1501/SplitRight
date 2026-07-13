const request = require('supertest');
const { app, registerUser } = require('./helpers');

describe('POST /auth/register', () => {
  it('creates a new account and sets an auth cookie', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('ada@example.com');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Short Pw',
      email: 'short@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6/);
  });

  it('rejects duplicate emails', async () => {
    await registerUser({ email: 'dupe@example.com' });
    const res = await request(app).post('/auth/register').send({
      name: 'Someone Else',
      email: 'dupe@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  it('lowercases email on registration', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Case Test',
      email: 'MixedCase@Example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('mixedcase@example.com');
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerUser({ email: 'login@example.com', password: 'password123' });
    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('login@example.com');
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  it('rejects an incorrect password', async () => {
    await registerUser({ email: 'wrongpw@example.com', password: 'password123' });
    const res = await request(app).post('/auth/login').send({
      email: 'wrongpw@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('clears the auth cookie', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/);
  });
});

describe('GET /auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user when authenticated', async () => {
    const { cookie, user } = await registerUser({ email: 'me@example.com' });
    const res = await request(app).get('/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/auth/me').set('Cookie', ['token=garbage']);
    expect(res.status).toBe(401);
  });
});
