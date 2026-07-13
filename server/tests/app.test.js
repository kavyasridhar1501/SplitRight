const request = require('supertest');
const { app } = require('./helpers');

describe('GET /health', () => {
  it('reports ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('unknown routes', () => {
  it('returns a 404 JSON payload', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
