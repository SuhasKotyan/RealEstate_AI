import test from 'node:test';
import assert from 'node:assert/strict';
import {
  intakeSchema,
  analysisSchema,
  backupSchema,
  getScore,
  getPriority,
  isDue,
  sortLeads,
  verifyEvidence,
} from '../shared/contracts.mjs';
import { createSampleLeads } from '../src/data/samples.js';

const samples = createSampleLeads(Date.parse('2026-10-14T08:00:00Z'));
test('samples are valid, explicitly labeled and have verified exact quotes', () => {
  assert.equal(backupSchema.safeParse({ version: 1, leads: samples }).success, true);
  for (const lead of samples) {
    assert.equal(lead.source, 'sample');
    assert.equal(lead.model, null);
    verifyEvidence(lead.analysis, lead.intake);
  }
});
test('priority sums the bounded components and applies inclusive boundaries', () => {
  assert.equal(getScore(samples[0].analysis), 96);
  assert.equal(getPriority(samples[0].analysis), 'Hot');
  const atScore = (score) => ({
    scores: {
      urgency: { points: Math.min(score, 35) },
      clarity: { points: Math.min(Math.max(0, score - 35), 25) },
      intent: { points: Math.min(Math.max(0, score - 60), 25) },
      readiness: { points: Math.max(0, score - 85) },
    },
  });
  for (const [score, tier] of [
    [0, 'Cold'],
    [44, 'Cold'],
    [45, 'Warm'],
    [74, 'Warm'],
    [75, 'Hot'],
    [100, 'Hot'],
  ])
    assert.equal(getPriority(atScore(score)), tier);
  assert.equal(getScore(null), null);
  assert.equal(getPriority(null), 'Unscored');
});
test('invalid or inflated AI scores are rejected instead of silently clamped', () => {
  for (const points of [-1, 36, 34.5, '34']) {
    const analysis = structuredClone(samples[0].analysis);
    analysis.scores.urgency.points = points;
    assert.equal(analysisSchema.safeParse(analysis).success, false);
  }
});
test('intake rejects empty, oversized and wrong-type fields; trims valid input', () => {
  const intake = samples[0].intake;
  assert.equal(intakeSchema.safeParse({ ...intake, message: ' ' }).success, false);
  assert.equal(intakeSchema.safeParse({ ...intake, message: 'x'.repeat(8001) }).success, false);
  assert.equal(intakeSchema.safeParse({ ...intake, budget: 100 }).success, false);
  assert.equal(intakeSchema.parse({ ...intake, name: ' Ananya ' }).name, 'Ananya');
});
test('source validation rejects fabricated quotes and accepts actual call notes', () => {
  assert.throws(() =>
    verifyEvidence(
      { evidence: [{ field: 'message', quote: 'Loan is approved' }] },
      samples[0].intake,
    ),
  );
  assert.throws(() =>
    verifyEvidence({ evidence: [{ field: 'budget', quote: 'Within 30 days' }] }, samples[0].intake),
  );
  const result = { evidence: [{ field: 'activity', quote: 'Sunday visit confirmed' }] };
  assert.equal(
    verifyEvidence(result, samples[0].intake, [{ text: 'Called. Sunday visit confirmed.' }]),
    result,
  );
});
test('sorting is deterministic, leaves original array intact, and puts closed leads last', () => {
  const closed = { ...samples[0], id: 'closed', status: 'Won' };
  const draft = { ...samples[0], id: 'draft', analysis: null };
  const input = [closed, draft, samples[2], samples[1]];
  assert.deepEqual(
    sortLeads(input).map((l) => l.id),
    [samples[1].id, samples[2].id, 'draft', 'closed'],
  );
  assert.equal(input[0], closed);
});
test('due status and follow-up sorting exclude completed tasks and closed leads', () => {
  const now = Date.parse('2026-10-14T08:00:00Z');
  assert.equal(isDue(samples[1], now), true);
  assert.equal(isDue({ ...samples[1], status: 'Lost' }, now), false);
  assert.equal(
    isDue({ ...samples[1], followup: { ...samples[1].followup, done: true } }, now),
    false,
  );
  assert.equal(isDue(samples[0], now), false);
  assert.equal(sortLeads(samples, 'followup', now)[0].id, samples[1].id);
});
test('backups reject wrong versions, broken records, excessive counts and duplicate IDs', () => {
  assert.equal(backupSchema.safeParse({ version: 2, leads: samples }).success, false);
  assert.equal(backupSchema.safeParse({ version: 1, leads: [{}] }).success, false);
  assert.equal(
    backupSchema.safeParse({ version: 1, leads: [samples[0], samples[0]] }).success,
    false,
  );
  assert.equal(
    backupSchema.safeParse({ version: 1, leads: Array(501).fill(samples[0]) }).success,
    false,
  );
});
