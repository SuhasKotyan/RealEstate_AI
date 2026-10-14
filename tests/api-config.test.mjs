import test from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl } from '../src/lib/config.mjs';

test('local and Vercel builds keep same-origin API calls', () => {
  assert.equal(apiUrl('health', ''), '/api/health');
  assert.equal(apiUrl('analyze', ''), '/api/analyze');
});
test('Pages routes every endpoint to its configured backend origin', () => {
  for (const path of ['health', 'analyze', 'chat'])
    assert.equal(
      apiUrl(path, 'https://backend.vercel.app/'),
      `https://backend.vercel.app/api/${path}`,
    );
  assert.equal(apiUrl('health', 'http://127.0.0.1:3001'), 'http://127.0.0.1:3001/api/health');
});
test('API configuration rejects unsafe or ambiguous URLs without echoing secrets', () => {
  for (const url of [
    'not-a-url',
    'https://user:password@example.com',
    'http://example.com',
    'https://example.com/api',
    'https://example.com?key=private',
    'https://example.com/#private',
  ]) {
    assert.throws(
      () => apiUrl('health', url),
      (error) => !error.message.includes('private') && !error.message.includes('password'),
    );
  }
  assert.throws(() => apiUrl('../secret', 'https://backend.vercel.app'));
});
