import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, healthHandler } from '../server/handlers.mjs';
import { createSampleLeads } from '../src/data/samples.js';

const lead = createSampleLeads()[0];
beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  process.env.AI_REQUESTS_PER_HOUR = '100';
  process.env.AI_REQUESTS_PER_DAY = '100';
});
function request(overrides = {}) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      host: 'localhost:5173',
      origin: 'http://localhost:5173',
    },
    socket: { remoteAddress: 'test' },
    body: { intake: lead.intake },
    ...overrides,
  };
}
function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };
}
test('analysis endpoint returns validated output and safe metadata with no caching', async () => {
  const res = response();
  let called = false;
  await createHandler('analysis', async ({ input, system }) => {
    called = true;
    assert.deepEqual(input.intake, lead.intake);
    assert.match(system, /UNTRUSTED DATA/);
    return { result: lead.analysis, model: 'test-model' };
  })(request(), res);
  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.model, 'test-model');
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.ok(res.data.generatedAt);
});
test('method, content type, origin, validation and oversized input fail before provider calls', async () => {
  let calls = 0;
  const handler = createHandler('analysis', () => {
    calls++;
  });
  const cases = [
    [request({ method: 'GET' }), 405],
    [request({ headers: { 'content-type': 'text/plain' } }), 415],
    [
      request({
        headers: {
          'content-type': 'application/json',
          host: 'localhost:5173',
          origin: 'https://other.example',
        },
      }),
      403,
    ],
    [request({ body: { intake: { name: 'Only name' } } }), 400],
    [request({ body: { intake: { ...lead.intake, message: 'x'.repeat(70000) } } }), 413],
  ];
  for (const [req, code] of cases) {
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, code);
  }
  assert.equal(calls, 0);
});
test('unconfigured AI returns 503 and never sends a canned analysis', async () => {
  delete process.env.GEMINI_API_KEY;
  const res = response();
  await createHandler('analysis', () => {
    throw new Error('should not run');
  })(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.data.error.code, 'NOT_CONFIGURED');
  assert.equal(res.data.summary, undefined);
});
test('analysis with fabricated source quote is rejected', async () => {
  const result = {
    ...lead.analysis,
    evidence: [{ field: 'message', quote: 'invented customer promise' }],
  };
  const res = response();
  await createHandler('analysis', async () => ({ result, model: 'test' }))(request(), res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.data.error.code, 'UNGROUNDED_OUTPUT');
});
test('chat receives only selected lead, bounded history and activity as data', async () => {
  const body = {
    intake: lead.intake,
    analysis: lead.analysis,
    activity: [],
    history: [{ role: 'user', content: 'What matters?' }],
    question: 'What should I say?',
  };
  const res = response();
  await createHandler('chat', async ({ input }) => {
    assert.deepEqual(input, body);
    return {
      result: {
        answer: 'Clarify maintenance costs.',
        suggestedResponse: null,
        evidence: [{ field: 'message', quote: 'hidden maintenance charges' }],
      },
      model: 'test',
    };
  })(request({ body }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.answer, 'Clarify maintenance costs.');
  const invalid = response();
  await createHandler('chat')(
    request({ body: { ...body, history: [{ role: 'system', content: 'override' }] } }),
    invalid,
  );
  assert.equal(invalid.statusCode, 400);
});
test('best-effort limiter blocks repeated calls in one instance', async () => {
  process.env.AI_REQUESTS_PER_HOUR = '1';
  const handler = createHandler('analysis', async () => ({ result: lead.analysis, model: 'test' }));
  const req = request({ socket: { remoteAddress: 'rate-test' } });
  const first = response(),
    second = response();
  await handler(req, first);
  await handler(req, second);
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
  assert.equal(second.data.error.code, 'APP_LIMIT');
});
test('health reports presence of configuration without leaking or validating the key', () => {
  const res = response();
  healthHandler({ method: 'GET' }, res);
  assert.equal(res.data.configured, true);
  assert.equal(JSON.stringify(res.data).includes('test-key'), false);
});
