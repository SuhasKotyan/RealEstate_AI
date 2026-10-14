import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateStructured } from '../server/ai.mjs';
import { analysisSchema } from '../shared/contracts.mjs';
import { createSampleLeads } from '../src/data/samples.js';

const lead = createSampleLeads()[0];
beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';
});
const candidate = (result, finishReason = 'STOP') => ({
  candidates: [
    {
      finishReason,
      content: { parts: [{ text: typeof result === 'string' ? result : JSON.stringify(result) }] },
    },
  ],
});
const call = (fetchImpl) =>
  generateStructured({
    system: 'System instructions',
    input: { intake: lead.intake },
    schema: analysisSchema,
    fetchImpl,
  });
test('real Gemini transport contract uses server header, structured schema, timeout and lead context', async () => {
  const result = await call(async (url, options) => {
    assert.match(url, /gemini-2\.5-flash:generateContent$/);
    assert.equal(url.includes('test-key'), false);
    assert.equal(options.headers['x-goog-api-key'], 'test-key-not-real');
    const body = JSON.parse(options.body);
    assert.equal(body.systemInstruction.parts[0].text, 'System instructions');
    const input = JSON.parse(body.contents[0].parts[0].text);
    assert.deepEqual(input.intake, lead.intake);
    assert.ok(input.evidenceCatalog.length);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.equal(body.generationConfig.responseJsonSchema.type, 'object');
    assert.ok(options.signal);
    assert.ok(body.generationConfig.responseJsonSchema.properties.evidenceIds);
    const { evidence, ...analysis } = lead.analysis;
    const evidenceIds = evidence.map(
      (source) =>
        input.evidenceCatalog.find(
          (item) => item.field === source.field && item.quote === source.quote,
        )?.id,
    );
    assert.ok(evidenceIds.every(Boolean));
    return Response.json(candidate({ ...analysis, evidenceIds }));
  });
  assert.deepEqual(result.result, lead.analysis);
  assert.equal(result.model, 'gemini-2.5-flash');
});
test('missing credentials and invalid model fail before fetch', async () => {
  let calls = 0;
  const fetchImpl = () => {
    calls++;
  };
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(
    call(fetchImpl),
    (error) => error.status === 503 && error.code === 'NOT_CONFIGURED',
  );
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_MODEL = '../evil';
  await assert.rejects(call(fetchImpl), (error) => error.code === 'INVALID_MODEL');
  assert.equal(calls, 0);
});
test('provider quotas, access errors and missing models return safe actionable errors', async () => {
  for (const [status, code] of [
    [429, 'PROVIDER_LIMIT'],
    [403, 'PROVIDER_CONFIG'],
    [404, 'MODEL_UNAVAILABLE'],
    [500, 'PROVIDER_ERROR'],
  ]) {
    await assert.rejects(
      call(async () => new Response('secret provider body', { status })),
      (error) => error.code === code && !error.message.includes('secret'),
    );
  }
});
test('blocked, truncated, malformed and schema-invalid outputs never become saved analysis', async () => {
  for (const data of [
    candidate(lead.analysis, 'MAX_TOKENS'),
    candidate(lead.analysis, 'SAFETY'),
    candidate('not json'),
    candidate({ summary: 'incomplete' }),
    { promptFeedback: { blockReason: 'SAFETY' } },
  ]) {
    await assert.rejects(
      call(async () => Response.json(data)),
      (error) => error.code === 'INVALID_OUTPUT',
    );
  }
});
test('timeouts and network failures are distinct and never expose internals', async () => {
  await assert.rejects(
    call(async () => {
      throw new DOMException('timed out', 'TimeoutError');
    }),
    (error) => error.status === 504 && error.code === 'TIMEOUT',
  );
  await assert.rejects(
    call(async () => {
      throw new Error('internal connection details');
    }),
    (error) => error.code === 'NETWORK' && !error.message.includes('internal'),
  );
});
