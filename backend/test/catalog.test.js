import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { access } from 'node:fs/promises';
import { createCatalogApp } from '../src/catalog.js';
import samples from '../../shared/sample-properties.json' with { type: 'json' };
import { seedDemo } from '../src/seed.js';
const app = createCatalogApp();
test('public preview serves 18 illustrative homes with three existing local photos each', async () => {
  const health = await request(app).get('/api/health').expect(200);
  assert.equal(health.body.mode, 'showcase');
  const r = await request(app).get('/api/properties?limit=24').expect(200);
  assert.equal(r.body.total, 18);
  for (const p of r.body.items) {
    assert.equal(p.images.length, 3);
    assert.match(p.description, /illustrative sample listing/);
    for (const image of p.images)
      await access(new URL('../../frontend/public' + image.url, import.meta.url));
  }
  const detail = await request(app)
    .get('/api/properties/' + r.body.items[0].id)
    .expect(200);
  assert.equal(detail.body.title, r.body.items[0].title);
});
test('preview supports city, type, purpose filters and pagination', async () => {
  const r = await request(app)
    .get('/api/properties?location=Mumbai&purpose=Rent&type=Apartment')
    .expect(200);
  assert.equal(r.body.total, 1);
  assert.equal(r.body.items[0].location, 'Mumbai');
  const page = await request(app).get('/api/properties?limit=2&page=2').expect(200);
  assert.equal(page.body.items.length, 2);
  assert.equal(page.body.pages, 9);
  await request(app).get('/api/properties?minPrice=bad').expect(400);
  await request(app).get('/api/properties/missing').expect(404);
});
test('preview never accepts passwords, listings or bookings', async () => {
  for (const route of [
    '/api/auth/register',
    '/api/auth/login',
    '/api/properties',
    '/api/properties/' + samples[0].id + '/appointments/guest',
  ]) {
    const r = await request(app).post(route).send({}).expect(503);
    assert.match(r.body.message, /browsing preview/);
    assert.equal(r.headers['set-cookie'], undefined);
  }
  await request(app).get('/api/users/me').expect(401);
});
test('demo refresh preserves unrelated user listings and is idempotent', async () => {
  const unrelated = { _id: 'unrelated', ownerId: 'someone-else', title: 'My own property' };
  const tables = {
    users: [{ _id: 'owner', email: 'demo@estateiq.local' }],
    properties: [unrelated],
  };
  const store = {
    find: async (t, q = {}) =>
      tables[t].filter((row) => Object.entries(q).every(([k, v]) => row[k] === v)),
    one: async (t, q) => tables[t].find((row) => Object.entries(q).every(([k, v]) => row[k] === v)),
    create: async (t, d) => {
      const row = { ...d, _id: 'id-' + tables[t].length };
      tables[t].push(row);
      return row;
    },
    update: async (t, q, d) => {
      const row = tables[t].find((r) => r._id === q._id);
      Object.assign(row, d);
      return row;
    },
  };
  await seedDemo(store);
  await seedDemo(store);
  assert.equal(tables.properties.length, 19);
  assert.deepEqual(tables.properties[0], unrelated);
});

test('serverless adapter removes internal routing metadata before filtering', async () => {
  const { default: handler } = await import('../../api/server.js');
  const http = await import('node:http');
  const server = http.createServer((req, res) => {
    Object.defineProperty(req, 'query', {
      configurable: true,
      value: { __route: 'properties', path: 'properties', location: 'Mumbai' },
    });
    req.url = '/api/server?__route=properties&location=Mumbai';
    handler(req, res);
  });
  try {
    const r = await request(server).get('/api/properties?location=Mumbai').expect(200);
    assert.equal(r.body.total, 1);
    assert.equal(r.body.items[0].location, 'Mumbai');
  } finally {
    server.close();
  }
});

test('unavailable live configuration falls back to explicit read-only browsing', async () => {
  const old = process.env.LIVE_SERVICES,
    uri = process.env.MONGODB_URI;
  process.env.LIVE_SERVICES = 'true';
  delete process.env.MONGODB_URI;
  const { default: handler } = await import('../../api/server.js?fallback-check');
  const http = await import('node:http');
  const server = http.createServer((req, res) => {
    const route = req.url.includes('register') ? 'auth/register' : 'health';
    Object.defineProperty(req, 'query', {
      configurable: true,
      value: { __route: route, path: route },
    });
    handler(req, res);
  });
  try {
    const r = await request(server).get('/api/health').expect(200);
    assert.equal(r.body.mode, 'showcase');
    await request(server).post('/api/auth/register').send({}).expect(503);
  } finally {
    server.close();
    if (old === undefined) delete process.env.LIVE_SERVICES;
    else process.env.LIVE_SERVICES = old;
    if (uri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = uri;
  }
});
