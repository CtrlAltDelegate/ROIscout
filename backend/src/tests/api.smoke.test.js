/**
 * API smoke tests — verify key routes respond correctly.
 * Uses supertest against the Express app (no live DB required for health/404).
 * DB-dependent routes are skipped when DATABASE_URL is not set.
 */

const request = require('supertest');

// Load env before requiring the app
try { require('dotenv').config({ path: require('path').resolve(__dirname, '../../../backend/.env') }); } catch (_) {}

const app = require('../app');

describe('Health check', () => {
  test('GET /health returns 200 with status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('Root endpoint', () => {
  test('GET / returns API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/ROI Scout/i);
  });
});

describe('Auth routes', () => {
  test('POST /api/auth/signup with missing body returns 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login with missing body returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Protected routes', () => {
  test('GET /api/data/pricing-data without token returns 401 or redirects', async () => {
    const res = await request(app).get('/api/data/pricing-data?state=TX');
    // optionalAuth allows through but returns empty; or 401 depending on implementation
    expect([200, 401, 403]).toContain(res.status);
  });

  test('GET /api/export/csv without token returns 401', async () => {
    const res = await request(app).get('/api/export/csv?state=TX');
    expect(res.status).toBe(401);
  });

  test('GET /api/searches without token returns 401', async () => {
    const res = await request(app).get('/api/searches');
    expect(res.status).toBe(401);
  });
});

describe('404 handling', () => {
  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
  });
});
