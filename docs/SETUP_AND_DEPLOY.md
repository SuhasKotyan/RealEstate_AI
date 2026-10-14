# Setup, external services and publication

You chose **Gemini + Vercel** and will handle API credentials and launching. All application code is included. These steps complete the external submission requirements.

## 1. Get the Gemini key

1. Open [Google AI Studio](https://aistudio.google.com/apikey), sign in and create an API key for an eligible project.
2. Keep the project on the free tier. No paid API features, search grounding or image generation are used by this app.
3. Verify `gemini-2.5-flash` is available to your project. If it is not, choose an available **text model supporting generateContent and JSON-schema structured output**, and set `GEMINI_MODEL`. Provider model support can change; do not assume every named Gemini model has the same API behavior.
4. Keep your key private. Do not paste it into the application, a public repository, screenshots, chat or the submission form.

References: [pricing](https://ai.google.dev/gemini-api/docs/pricing), [structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

## 2. Run and verify locally

Open PowerShell in `D:\Projects\Masal AI`:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` privately and enter:

```dotenv
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
AI_REQUESTS_PER_HOUR=30
AI_REQUESTS_PER_DAY=120
```

Then:

```powershell
npm run dev
```

You can also run `npm run verify:ai` after setting the key. This makes two real Gemini calls using fictional lead intake and validates the analysis and chat output. It requires network access and consumes your provider quota; it is separate from the mocked automated test suite.

Open **http://127.0.0.1:5173**. Check Workspace settings: it should say “API key configured.” This only verifies that the server sees a key. Then run a real analysis to confirm it works:

1. Add a lead → Fill an example lead → Save & analyze.
2. Verify the analysis is labeled with the model and generated time, rather than Sample.
3. Open browser Network tools and inspect `/api/analyze`: it should return 200. The request must not contain your API key.
4. Ask “What should I emphasize on the call?” and confirm `/api/chat` returns 200.
5. Expand source evidence and check the quote matches the original inquiry.
6. Plan a follow-up, add a call note and ask what changed after the call.

Record these real-model acceptance results in `docs/VALIDATION.md`. A mocked automated test does not satisfy the assignment's real-model requirement.

If you change `.env`, restart `npm run dev` to reload it. The app remains usable for drafts and workflow features with an empty key, but that is insufficient for submission.

## 3. Publish the public repository

Recommended repository name: `closewise-ai-lead-workspace`.

Create a new **public**, empty repository on GitHub. Do not initialize a remote README when using these commands; the project already has one. In the project folder:

```powershell
git init
git add .
git status
git commit -m "Build Closewise AI lead workspace"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/closewise-ai-lead-workspace.git
git push -u origin main
```

Before committing, check that `.env`, `node_modules`, `dist`, `.npm-cache`, `.playwright-browsers`, `.vercel`, `test-results` and `playwright-report` are ignored. `.env.example` is safe because it contains no key. Replace `YOUR_USERNAME` in the remote URL. GitHub authentication is handled by your own account.

Alternatively use GitHub Desktop to add this existing folder and publish it with **“Keep this code private” unchecked**. Do not upload the dependencies or the environment file.

## 4. Deploy on Vercel

1. Sign in to [Vercel](https://vercel.com) with your GitHub account and choose **Add New → Project**.
2. Import the public repository.
3. Use the **Vite** framework preset. Root directory is the repository root.
4. Build command: `npm run build`. Output directory: `dist`. Install command: `npm install` (or `npm ci`). Node: 22.x or a compatible newer version.
5. Add environment variables before deployment:

| Variable               | Value                   | Required?                          |
| ---------------------- | ----------------------- | ---------------------------------- |
| `GEMINI_API_KEY`       | Your private Gemini key | Yes, for AI                        |
| `GEMINI_MODEL`         | `gemini-2.5-flash`      | Optional; this is the default      |
| `AI_REQUESTS_PER_HOUR` | `30`                    | Optional; per address per instance |
| `AI_REQUESTS_PER_DAY`  | `120`                   | Optional; global per instance      |

6. Select the Production environment for the key. Include Preview only if you also want AI in preview deployments. **Do not set `PORT` on Vercel.**
7. Deploy. The tracked `vercel.json` gives AI endpoints a 60-second duration. The provider call has a 45-second timeout and the browser a 55-second timeout.
8. If you add or change a key after deployment, redeploy so it reaches the functions.

Vercel hosts the frontend and automatically serves `api/analyze.mjs`, `api/chat.mjs` and `api/health.mjs`. You do not deploy the local Express server separately. See [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) and [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js).

This assignment is a personal prototype. Check [Vercel Hobby plan conditions](https://vercel.com/docs/plans/hobby) before any real commercial team use. No database or paid Vercel feature is needed for the prototype.

## 5. Make the live URL accessible

In project settings, inspect **Deployment Protection** and disable visitor authentication for the production deployment if enabled. Settings can vary by plan; consult [deployment protection](https://vercel.com/docs/deployment-protection). Share the stable production URL, not an authenticated preview link.

Open the production URL in an incognito window signed out of Vercel:

- Page loads without a Vercel login.
- Samples appear and are clearly labeled.
- A newly submitted lead is analyzed by Gemini.
- Copilot responds using that lead's details.
- Refresh preserves the local records.
- Follow-up scheduling and completion work.
- The app fits a phone viewport.
- Another browser starts its own isolated workspace, rather than revealing your records.

Use fictional data: the public app accepts customer-like text and sends it to the free-tier model provider for analysis.

## 6. Record and submit

Follow `docs/DEMO_SCRIPT.md`. Record the **real configured application**, max three minutes. Upload to Loom, an unlisted YouTube video or Google Drive with “Anyone with the link → Viewer.” Open the video in incognito and confirm it plays without requesting access.

Copy the public repository URL, production URL, demo video URL and AI disclosure into `docs/SUBMISSION.md`, and then into the Google Form when it is shared. Verify all three links while signed out.

## Troubleshooting during a live demo

| Symptom                           | Meaning                               | Action                                                               |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Connect Gemini                    | Server sees no key                    | Add `GEMINI_API_KEY`; restart locally or redeploy                    |
| API key configured, request fails | Presence does not prove validity      | Check key, project, region, model and quota                          |
| API offline                       | Frontend cannot reach API             | Run both dev processes; check `/api/health` and proxy                |
| 429 provider limit                | Gemini quota exhausted                | Wait or check quota in AI Studio; do not promise immediate recovery  |
| 429 app limit                     | In-instance demo limit reached        | Wait; no hardcoded fallback is used                                  |
| 502 model unavailable             | Wrong or retired model                | Change `GEMINI_MODEL` to a supported text model and redeploy         |
| Invalid output/source quote error | Model output failed validation        | Retry; the existing valid result is retained                         |
| Timeout                           | Provider did not finish in 45 seconds | Retry once; keep the saved lead and continue the workflow            |
| Browser storage unavailable       | Storage blocked or full               | Export a backup; the session remains usable in memory                |
| Unreadable saved data             | Existing local data failed validation | Export original stored bytes, then clear and reimport a valid backup |
| Build-only preview has no AI      | Static preview lacks Node endpoints   | Use `npm run dev` or `npm start`, or the Vercel deployment           |
| Port already in use               | Another process owns 5173 or 3001     | Stop that process or adjust the server port and Vite proxy together  |

If analysis fails on a call, explain: “The inquiry is saved, but the model is temporarily unavailable. I can still schedule the next action and retry the analysis when the connection recovers.” This accurately describes the product.
