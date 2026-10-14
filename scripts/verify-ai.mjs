import 'dotenv/config';
import { generateStructured } from '../server/ai.mjs';
import { ANALYSIS_SYSTEM, CHAT_SYSTEM } from '../server/prompts.mjs';
import {
  analysisSchema,
  chatOutputSchema,
  verifyEvidence,
  getPriority,
  getScore,
} from '../shared/contracts.mjs';
import { createSampleLeads } from '../src/data/samples.js';

// Two real provider calls using fictional intake only. No sample analysis is used.
// This is opt-in and never runs in the normal test suite or production build.
try {
  const intake = createSampleLeads()[0].intake;
  const analysis = await generateStructured({
    system: ANALYSIS_SYSTEM,
    input: { intake },
    schema: analysisSchema,
  });
  verifyEvidence(analysis.result, intake);
  const conversation = await generateStructured({
    system: CHAT_SYSTEM,
    input: {
      intake,
      analysis: analysis.result,
      activity: [],
      history: [],
      question:
        'What should I emphasize on the call? If financing is not stated, say it is unknown.',
    },
    schema: chatOutputSchema,
  });
  verifyEvidence(conversation.result, intake);
  console.log('Real Gemini analysis and chat succeeded; both passed schema and source validation.');
  console.log(`Model: ${analysis.model}`);
  console.log(`Priority: ${getPriority(analysis.result)} (${getScore(analysis.result)}/100)`);
  console.log(`Summary: ${analysis.result.summary}`);
  console.log(`Call guidance: ${conversation.result.answer}`);
} catch (error) {
  console.error(`Real AI check failed: ${error.message}`);
  process.exitCode = 1;
}
