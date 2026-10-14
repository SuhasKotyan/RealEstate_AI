# GitHub Pages frontend + private Gemini backend

Pages serves static HTML, CSS and JavaScript. It cannot run the Node API. Closewise therefore publishes its built frontend on Pages and calls its Vercel API for AI operations. No Gemini key is included in the Pages build or browser code.

## The original 404

The previous Pages source was the repository root. It served development `index.html`, whose script was `/src/main.jsx`. A browser on Pages cannot load/transpile that development entry point. The fix builds with Vite, deploys only `dist`, and sets the asset base to `/RealEstate_AI/`. The favicon uses Vite's base path too.

## Deployment automation

`.github/workflows/pages.yml` runs on pushes to `main` and can be dispatched manually. It checks out the source, installs the lockfile dependencies on Node 22, runs unit tests, gets the correct base path from GitHub Pages, builds Vite and publishes `dist`.

The workflow uses the **repository variable** `API_BASE_URL`, a public Vercel backend origin without `/api`. It is a public URL, not a secret. `VITE_API_BASE_URL` embeds this origin in the frontend so health, analysis and chat all call the same backend. Vercel and local builds without that variable retain `/api/...` same-origin requests.

`GEMINI_API_KEY` stays in the Vercel server environment. A GitHub repository secret does not supply a runtime server to Pages. The workflow does not read or embed that key.

## Cross-origin API requests

`server/cors.mjs` permits `https://suhaskotyan.github.io` for this deployment and handles OPTIONS preflight before body, key or provider checks. It allows GET/POST/OPTIONS and Content-Type, and sends no wildcard or credential permission. `ALLOWED_ORIGINS` can replace the default list with comma-separated exact origins. Same-origin Vercel/local calls continue to work.

CORS is a browser boundary, not authentication. The prototype's documented limits and privacy boundaries still apply.

## Publication sequence

1. Update the connected GitHub repository with the backend CORS/retry changes and frontend API/base-path changes.
2. Let the connected Vercel project deploy the backend. Verify health and Pages-origin preflight on its new URL.
3. Set `API_BASE_URL` to that verified API origin under GitHub repository Settings → Secrets and variables → Actions → Variables.
4. Set Settings → Pages → Source to **GitHub Actions**.
5. Commit the Pages workflow and verify the successful Actions deployment.
6. Open `https://suhaskotyan.github.io/RealEstate_AI/`, then test real analysis/chat in a clean browser.

If a deployment-specific API URL is used, future backend upgrades require updating `API_BASE_URL` and rerunning the Pages workflow. A stable Vercel production domain avoids that extra step. Frontend updates still publish automatically on pushes.

## Changed code

- `vite.config.js`: configurable deployment base path.
- `index.html`: base-aware favicon path.
- `src/lib/config.mjs`: validated public API URL resolver.
- `src/lib/api.js` and `src/App.jsx`: analysis/chat/health use that resolver.
- `server/cors.mjs` and `server/handlers.mjs`: explicit Pages-origin and preflight support.
- `.github/workflows/pages.yml`: build and publish automation.
- `.env.example`: documents public build configuration separately from the server secret.
- `tests/api-config.test.mjs` and `tests/cors.test.mjs`: routing, URL safety, CORS and preflight coverage.

Browser-local records are origin-specific. The Pages workspace starts separately from the Vercel/local workspace; export/import a backup to transfer your fictional demo records if needed.

## Verified publication — 14 October 2026

- Public frontend: **https://suhaskotyan.github.io/RealEstate_AI/**
- Public repository: **https://github.com/SuhasKotyan/RealEstate_AI**
- Configured API origin: `https://real-estate-cmju05ve1-suhaskotyans7-6052.vercel.app`
- GitHub Pages source: GitHub Actions; workflow build/deploy succeeded.
- Published HTML, favicon, JavaScript and CSS returned 200 with correct repository-prefixed paths. The public JavaScript bundle contained the intended API URL and no detected Google API key.
- Full real-browser workflow passed: analysis 200, chat 200, lead persisted after reload, chat grounded in a call note, reply draft generated, follow-up completed, and no page runtime errors.
- The local repository's `main` now tracks `origin/main` for this GitHub repository. The active CLI account is SuhasKotyan.

The API deployment URL is version-specific. Keep it available for this demo; update the public `API_BASE_URL` variable and rerun the Pages workflow when you need a newer backend version.
