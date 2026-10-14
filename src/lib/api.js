import { analysisSchema, chatOutputSchema, verifyEvidence } from '../../shared/contracts.mjs';

export async function requestAI(path, body, signal) {
  let response;
  try {
    response = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(55000)])
        : AbortSignal.timeout(55000),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error.name === 'TimeoutError') throw new Error('The request took too long. Please retry.');
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response. Check that the API is running.');
  }
  if (!response.ok) throw new Error(data.error?.message || 'The AI request failed. Please retry.');
  const schema = path === 'analyze' ? analysisSchema : chatOutputSchema;
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error('The AI result did not pass validation. Please retry.');
  verifyEvidence(parsed.data, body.intake, body.activity);
  return { ...parsed.data, model: data.model, generatedAt: data.generatedAt };
}
