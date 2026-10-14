import { ApiError } from './ai.mjs';

// This project explicitly authorizes the owner's Pages origin. An environment override
// can narrow or replace the list; no wildcard access or browser credentials are enabled.
export function applyCors(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  const headers = req.headers || {};
  const origin = headers.origin;
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === headers.host;
    } catch {
      /* Reject invalid origins. */
    }
    const allowed = new Set(
      (process.env.ALLOWED_ORIGINS ?? 'https://suhaskotyan.github.io')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    if (!sameOrigin && !allowed.has(origin))
      throw new ApiError(403, 'ORIGIN', 'Requests must come from an authorized application.');
    if (!sameOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
    }
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}
