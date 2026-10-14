# Vercel provider failure: verified findings

On 14 October 2026, the new deployment at `https://real-estate-39fy6wg6q-suhaskotyans7-6052.vercel.app` reported `configured: true` and `model: gemini-3.1-flash-lite`.

- First analysis attempt returned 502 `PROVIDER_ERROR`; retrying the same deployment returned **200 with real analysis**.
- First chat attempt returned 502 `PROVIDER_ERROR`; retrying the same deployment returned **200**, passed chat schema/source validation and returned five exact source snippets.
- This establishes that the new deployment reads its variables and can reach Gemini successfully. It also establishes intermittent provider failures. The exact Google failure status was not available in the old deployed error response.
- Local source now retries temporary HTTP 500/502/503/504 failures once after 800ms. Both attempts share a 45-second timeout. It does not retry quota, authentication, unavailable-model or invalid-output failures.
- Safe provider status/reason details are now available in API error JSON and server logs. Keys and customer messages remain excluded.

## Publish the prepared fix

Update these files in the GitHub repository connected to Vercel:

1. `server/ai.mjs`
2. `server/handlers.mjs`
3. `tests/ai.test.mjs` (regression coverage)

The files are already updated in this workspace. Commit/push them, or replace those exact repository files using GitHub's web editor. Vercel must build the new source; redeploying an unchanged old commit does not include this fix.

Keep `GEMINI_MODEL=gemini-3.1-flash-lite` in the intended deployment environment. Open the newest Ready deployment and test analysis/chat. If failure persists, inspect the `/api/analyze` or `/api/chat` JSON response for `error.details`, or Vercel Runtime Logs for “Gemini provider failure.” These details are safe to share; never share the key.

The fix has passed local automated checks/build. It is **not yet published to your Vercel project**, and automatic retry improves transient-error handling without guaranteeing provider availability.
