const request = require('supertest');
const app = require('../server');

async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/auth/register').send(payload);
  return { res, cookie: res.headers['set-cookie'], user: res.body.data?.user };
}

async function createGroup(cookie, name = 'Roommates') {
  const res = await request(app).post('/groups').set('Cookie', cookie).send({ name });
  return res.body.data.group;
}

module.exports = { app, registerUser, createGroup };
