import { z } from 'zod';
import { analysisSchema, chatOutputSchema } from '../shared/contracts.mjs';

// Give the model identifiers to select instead of asking it to transcribe source text.
// The server owns every displayed quotation and its field attribution.
export function buildEvidenceCatalog(intake, activity = []) {
  const catalog = [];
  const add = (field, source) => {
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    for (const { segment } of segmenter.segment(source)) {
      let remaining = segment.trim();
      while (remaining.length) {
        let end = Math.min(remaining.length, 350);
        if (end < remaining.length) {
          const space = remaining.lastIndexOf(' ', end);
          if (space > 150) end = space;
        }
        const quote = remaining.slice(0, end).trim();
        if (quote) catalog.push({ id: `s${catalog.length + 1}`, field, quote });
        remaining = remaining.slice(end).trim();
      }
    }
  };
  for (const field of ['location', 'property', 'budget', 'timeline', 'message'])
    add(field, intake[field]);
  for (const event of activity) add('activity', event.text);
  return catalog;
}

export function evidenceContract(schema, input) {
  if (schema !== analysisSchema && schema !== chatOutputSchema) return null;
  const catalog = buildEvidenceCatalog(input.intake, input.activity);
  const minimum = schema === analysisSchema ? 1 : 0;
  const providerSchema = schema.omit({ evidence: true }).extend({
    evidenceIds: z
      .array(z.enum(catalog.map((item) => item.id)))
      .min(minimum)
      .max(5),
  });
  return {
    catalog,
    providerSchema,
    resolve(value) {
      const { evidenceIds, ...rest } = providerSchema.parse(value);
      const byId = new Map(catalog.map(({ id, ...source }) => [id, source]));
      return schema.parse({
        ...rest,
        evidence: [...new Set(evidenceIds)].map((id) => byId.get(id)),
      });
    },
  };
}
