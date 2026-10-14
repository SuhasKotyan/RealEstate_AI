import {
  analyzeRequestSchema,
  analysisSchema,
  chatRequestSchema,
  chatOutputSchema,
  verifyEvidence,
} from '../shared/contracts.mjs';
import { generateStructured, ApiError, modelName } from './ai.mjs';
import { ANALYSIS_SYSTEM, CHAT_SYSTEM } from './prompts.mjs';
import { applyCors } from './cors.mjs';

const counters = new Map();
function consumeLimit(req) {
  const now = Date.now();
  for (const [key, entry] of counters) if (entry.reset <= now) counters.delete(key);
  // On Vercel, use its platform-supplied address; local Express uses the socket.
  const address = process.env.VERCEL
    ? String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(
        ',',
      )[0]
    : req.socket?.remoteAddress || 'local';
  const entries = [
    { key: `ip:${address}`, period: 3600000, max: Number(process.env.AI_REQUESTS_PER_HOUR) || 30 },
    { key: 'global', period: 86400000, max: Number(process.env.AI_REQUESTS_PER_DAY) || 120 },
  ];
  for (const entry of entries)
    if ((counters.get(entry.key)?.count || 0) >= entry.max)
      throw new ApiError(
        429,
        'APP_LIMIT',
        'This demo has reached its request limit. Please try again later.',
      );
  if (counters.size > 5000)
    throw new ApiError(429, 'APP_LIMIT', 'This demo is busy. Please try again later.');
  for (const entry of entries) {
    const counter = counters.get(entry.key) || { count: 0, reset: now + entry.period };
    counter.count++;
    counters.set(entry.key, counter);
  }
}
function guard(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    throw new ApiError(405, 'METHOD', 'Use a POST request.');
  }
  if (!String(req.headers['content-type'] || '').includes('application/json'))
    throw new ApiError(415, 'CONTENT_TYPE', 'Send JSON in the request body.');
  if (Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8') > 64000)
    throw new ApiError(
      413,
      'BODY_SIZE',
      'The request is too large. Shorten the message or conversation.',
    );
}
export function createHandler(kind, generate = generateStructured) {
  return async (req, res) => {
    try {
      if (!applyCors(req, res)) return;
      guard(req, res);
      const parsed = (kind === 'analysis' ? analyzeRequestSchema : chatRequestSchema).safeParse(
        req.body,
      );
      if (!parsed.success)
        throw new ApiError(
          400,
          'VALIDATION',
          'Some lead fields are missing or too long. Check the form and try again.',
        );
      if (!process.env.GEMINI_API_KEY?.trim())
        throw new ApiError(
          503,
          'NOT_CONFIGURED',
          'AI is not connected. Add GEMINI_API_KEY on the server and restart or redeploy. Save the lead as a draft in the meantime.',
        );
      consumeLimit(req);
      const { result, model } = await generate({
        system: kind === 'analysis' ? ANALYSIS_SYSTEM : CHAT_SYSTEM,
        input: parsed.data,
        schema: kind === 'analysis' ? analysisSchema : chatOutputSchema,
      });
      try {
        verifyEvidence(result, parsed.data.intake, parsed.data.activity);
      } catch {
        throw new ApiError(
          502,
          'UNGROUNDED_OUTPUT',
          'AI source quotes did not match this lead. Please retry; the previous result is preserved.',
        );
      }
      res.status(200).json({ ...result, model, generatedAt: new Date().toISOString() });
    } catch (error) {
      const known = error instanceof ApiError;
      res.status(known ? error.status : 500).json({
        error: {
          code: known ? error.code : 'INTERNAL',
          message: known ? error.message : 'Something went wrong. Please try again.',
          ...(known && error.details ? { details: error.details } : {}),
        },
      });
    }
  };
}
export const analyzeHandler = createHandler('analysis');
export const chatHandler = createHandler('chat');
export function healthHandler(req, res) {
  try {
    if (!applyCors(req, res)) return;
    if (req.method !== 'GET')
      return res.status(405).json({ error: { code: 'METHOD', message: 'Use GET.' } });
    res
      .status(200)
      .json({
        configured: !!process.env.GEMINI_API_KEY?.trim(),
        model: modelName(),
        storage: 'browser-local',
      });
  } catch (error) {
    res
      .status(error instanceof ApiError ? error.status : 500)
      .json({
        error: {
          code: error.code || 'INTERNAL',
          message: error instanceof ApiError ? error.message : 'Health check failed.',
        },
      });
  }
}
