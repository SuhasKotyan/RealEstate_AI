import { z } from 'zod';
import { evidenceContract } from './evidence.mjs';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function modelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}
export async function generateStructured({ system, input, schema, fetchImpl = fetch }) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key)
    throw new ApiError(
      503,
      'NOT_CONFIGURED',
      'AI is not connected yet. Add GEMINI_API_KEY on the server, then restart or redeploy. Your lead can still be saved as a draft.',
    );
  const model = modelName();
  if (!/^[a-zA-Z0-9._-]+$/.test(model))
    throw new ApiError(
      503,
      'INVALID_MODEL',
      'Check GEMINI_MODEL in your server environment settings.',
    );
  const evidence = evidenceContract(schema, input);
  const providerSchema = evidence?.providerSchema || schema;
  const providerInput = evidence ? { ...input, evidenceCatalog: evidence.catalog } : input;
  let response;
  try {
    response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(providerInput) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
            responseJsonSchema: z.toJSONSchema(providerSchema),
            ...(model === 'gemini-2.5-flash' ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      },
    );
  } catch (error) {
    if (['TimeoutError', 'AbortError'].includes(error.name))
      throw new ApiError(
        504,
        'TIMEOUT',
        'The AI took too long. Your saved lead is safe; try again.',
      );
    throw new ApiError(
      502,
      'NETWORK',
      'Could not reach the AI provider. Check the connection and try again.',
    );
  }
  if (!response.ok) {
    // Never return raw provider bodies, which may contain request details.
    if (response.status === 429)
      throw new ApiError(
        429,
        'PROVIDER_LIMIT',
        'Gemini free-tier quota is temporarily exhausted. Wait and retry, or check your AI Studio quota.',
      );
    if ([400, 401, 403].includes(response.status))
      throw new ApiError(
        502,
        'PROVIDER_CONFIG',
        'Gemini rejected the request. Check your API key, model access, region and structured-output support.',
      );
    if (response.status === 404)
      throw new ApiError(
        502,
        'MODEL_UNAVAILABLE',
        'This Gemini model is unavailable. Set GEMINI_MODEL to an available model that supports structured output.',
      );
    throw new ApiError(502, 'PROVIDER_ERROR', 'The AI provider is unavailable. Try again shortly.');
  }
  try {
    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason !== 'STOP') throw new Error('Incomplete or blocked output');
    const value = candidate.content.parts
      .filter((p) => !p.thought)
      .map((p) => p.text || '')
      .join('');
    const parsed = JSON.parse(value);
    return { result: evidence ? evidence.resolve(parsed) : schema.parse(parsed), model };
  } catch {
    throw new ApiError(
      502,
      'INVALID_OUTPUT',
      'The AI returned an incomplete or invalid result. No analysis was saved. Please retry.',
    );
  }
}
