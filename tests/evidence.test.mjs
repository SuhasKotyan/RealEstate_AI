import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidenceCatalog, evidenceContract } from '../server/evidence.mjs';
import { analysisSchema, chatOutputSchema, verifyEvidence } from '../shared/contracts.mjs';
import { createSampleLeads } from '../src/data/samples.js';

const lead = createSampleLeads()[0];
test('catalog snippets remain exact even with long text, line breaks and decimal budgets', () => {
  const intake = {
    ...lead.intake,
    message: 'A long inquiry.\n' + 'Word '.repeat(170) + 'Budget is 1.4 crore.',
  };
  const notes = [{ text: 'Sunday visit confirmed.\nNeed the full cost breakdown.' }];
  const catalog = buildEvidenceCatalog(intake, notes);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  for (const { field, quote } of catalog) {
    assert.ok(quote.length <= 350);
    assert.ok((field === 'activity' ? notes[0].text : intake[field]).includes(quote));
  }
});
test('model-selected identifiers resolve to exact source fields and cannot inject altered quotes', () => {
  const contract = evidenceContract(analysisSchema, { intake: lead.intake });
  const original = lead.analysis.evidence[0];
  const id = contract.catalog.find(
    (item) => item.field === original.field && item.quote === original.quote,
  ).id;
  const { evidence, ...analysis } = lead.analysis;
  const result = contract.resolve({
    ...analysis,
    evidenceIds: [id, id],
    evidence: [{ field: 'budget', quote: 'invented' }],
  });
  assert.deepEqual(result.evidence, [original]);
  verifyEvidence(result, lead.intake);
  assert.throws(() => contract.resolve({ ...analysis, evidenceIds: ['not-in-this-lead'] }));
});
test('chat allows unknown answers without evidence and resolves activity references', () => {
  const activity = [{ text: 'Sunday visit confirmed.' }];
  const contract = evidenceContract(chatOutputSchema, { intake: lead.intake, activity });
  const source = contract.catalog.find((item) => item.field === 'activity');
  const result = contract.resolve({
    answer: 'The Sunday visit is confirmed in your note.',
    suggestedResponse: null,
    evidenceIds: [source.id],
  });
  verifyEvidence(result, lead.intake, activity);
  assert.deepEqual(
    contract.resolve({ answer: 'Financing is unknown.', suggestedResponse: null, evidenceIds: [] })
      .evidence,
    [],
  );
});
