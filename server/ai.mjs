import { z } from 'zod';
import { evidenceContract } from './evidence.mjs';

export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export function modelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

async function providerDiagnostics(response, model) {
  const details = { providerHttpStatus: response.status, model };
  try {
    const data = await response.json();
    const allowedStatuses = new Set([
      'INVALID_ARGUMENT',
      'UNAUTHENTICATED',
      'PERMISSION_DENIED',
      'NOT_FOUND',
      'RESOURCE_EXHAUSTED',
      'INTERNAL',
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'FAILED_PRECONDITION',
    ]);
    if (allowedStatuses.has(data.error?.status)) details.providerStatus = data.error.status;
    const allowedReasons = new Set([
      'API_KEY_INVALID',
      'API_KEY_SERVICE_BLOCKED',
      'API_KEY_HTTP_REFERRER_BLOCKED',
      'API_KEY_IP_ADDRESS_BLOCKED',
      'SERVICE_DISABLED',
      'BILLING_DISABLED',
    ]);
    const reason = data.error?.details?.find((item) => allowedReasons.has(item.reason))?.reason;
    if (reason) details.reason = reason;
    const message = typeof data.error?.message === 'string' ? data.error.message : '';
    if (/user location is not supported|unsupported (?:country|region)/i.test(message))
      details.reason = 'REGION_UNSUPPORTED';
    else if (/overloaded|high demand|temporarily unavailable/i.test(message))
      details.reason = 'PROVIDER_BUSY';
  } catch {
    /* Non-JSON provider failures still expose the HTTP status, never the body. */
  }
  return details;
}
export async function generateStructured({
  system,
  input,
  schema,
  fetchImpl = fetch,
  retryDelayMs = 800,
}) {
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
  const signal = AbortSignal.timeout(45000);
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    signal,
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
  };
  let response;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      signal.throwIfAborted();
      response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        request,
      );
      if (attempt === 1 || ![500, 502, 503, 504].includes(response.status)) break;
      console.warn('Retrying transient Gemini failure', {
        providerHttpStatus: response.status,
        model,
        retry: 1,
      });
      await response.body?.cancel();
      if (retryDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
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
    // Only fixed, allowlisted diagnostics are logged/returned. Never expose raw messages,
    // headers, request data or credentials from the provider response.
    const details = await providerDiagnostics(response, model);
    console.warn('Gemini provider failure', details);
    if (response.status === 429)
      throw new ApiError(
        429,
        'PROVIDER_LIMIT',
        'Gemini free-tier quota is temporarily exhausted. Wait and retry, or check your AI Studio quota.',
        details,
      );
    if ([400, 401, 403].includes(response.status))
      throw new ApiError(
        502,
        'PROVIDER_CONFIG',
        'Gemini rejected the request. Check your API key, model access, region and structured-output support.',
        details,
      );
    if (response.status === 404)
      throw new ApiError(
        502,
        'MODEL_UNAVAILABLE',
        'This Gemini model is unavailable. Set GEMINI_MODEL to an available model that supports structured output.',
        details,
      );
    throw new ApiError(
      502,
      'PROVIDER_ERROR',
      'The AI provider is unavailable. Try again shortly.',
      details,
    );
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
