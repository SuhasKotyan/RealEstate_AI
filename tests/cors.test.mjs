import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { applyCors } from '../server/cors.mjs';
import { createHandler, healthHandler } from '../server/handlers.mjs';
import { createSampleLeads } from '../src/data/samples.js';

beforeEach(() => {
  delete process.env.ALLOWED_ORIGINS;
  process.env.GEMINI_API_KEY = 'test-key-not-real';
});
function response() {
  return {
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    end() {
      this.ended = true;
    },
  };
}
const request = (method = 'POST', origin = 'https://suhaskotyan.github.io') => ({
  method,
  headers: { host: 'backend.vercel.app', origin, 'content-type': 'application/json' },
  body: { intake: createSampleLeads()[0].intake },
  socket: { remoteAddress: 'cors-test' },
});

test('Pages-origin POST and health GET include explicit CORS headers', async () => {
  const res = response();
  await createHandler('analysis', async () => ({
    result: createSampleLeads()[0].analysis,
    model: 'test',
  }))(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://suhaskotyan.github.io');
  const health = response();
  healthHandler(request('GET'), health);
  assert.equal(health.statusCode, 200);
  assert.equal(health.headers['Access-Control-Allow-Origin'], 'https://suhaskotyan.github.io');
});
test('preflight succeeds before validation, key checks or provider calls', async () => {
  delete process.env.GEMINI_API_KEY;
  const res = response();
  let called = false;
  await createHandler('analysis', () => {
    called = true;
  })(request('OPTIONS'), res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
  assert.equal(called, false);
  assert.equal(res.headers['Access-Control-Allow-Headers'], 'Content-Type');
});
test('unapproved browser origins are rejected without wildcard permissions', () => {
  const res = response();
  assert.throws(
    () => applyCors(request('POST', 'https://other.example'), res),
    (error) => error.status === 403,
  );
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
});
test('server configuration can replace the default allowed origin', () => {
  process.env.ALLOWED_ORIGINS = 'https://custom.example';
  assert.equal(applyCors(request('POST', 'https://custom.example'), response()), true);
  assert.throws(() => applyCors(request(), response()));
  assert.equal(applyCors(request('POST', 'https://backend.vercel.app'), response()), true);
});
