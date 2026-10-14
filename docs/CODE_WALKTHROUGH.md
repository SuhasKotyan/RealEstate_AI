# Closewise: complete code walkthrough

This is your reference for the screen demo and live interview. It explains the actual implementation, including boundaries and failure paths. Read the concise demo script first; use this document to understand the code behind each action.

## 1. What the product is solving

A salesperson receives many unstructured inquiries. Reading every transcript takes time, and even after identifying a good lead it is easy to forget the next contact. Closewise turns an inquiry into a short brief, an explained priority and a specific next action, then lets the salesperson follow through.

The primary user is an **individual real-estate salesperson**. There is one workspace, not multiple roles. There is **no authentication or role-based access control (RBAC)**: no admin, sales-manager or separate agent account. Each browser has its own leads. This is a deliberate prototype boundary, not simulated team access. Real RBAC would require server-side identity, durable user/team ownership and permission enforcement; a role dropdown alone would not implement it.

The invention is the **follow-up planner with call-outcome notes**. It helps after the analysis, when the salesperson needs to act. It is intentionally one current task per lead, rather than a full task manager.

## 2. Stack and why each part exists

| Technology       | Job                                             | Reason for choosing it                                                     |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| React            | Browser UI and state                            | A few reusable components cover the workflow without a UI framework        |
| Vite             | Development server and browser build            | Fast local setup and a static production bundle                            |
| JavaScript / ESM | Application language                            | Small prototype; server and client share rules without a compilation layer |
| Zod              | Runtime schema validation                       | AI output, browser backups and HTTP bodies are untrusted at runtime        |
| Node.js 22+      | Server environment                              | Built-in fetch, AbortSignal and node:test reduce dependencies              |
| Express          | Local API and optional local production serving | Uses exactly the same handlers as Vercel                                   |
| Gemini REST API  | Actual lead understanding and chat              | Structured output, configurable model and eligible free-tier access        |
| Vercel           | Planned hosting                                 | Serves Vite assets and Node functions under one origin                     |
| localStorage     | Saved leads                                     | Meets the assignment without database provisioning                         |
| Lucide React     | Icons                                           | Consistent vector icons with no generated bitmap assets                    |
| Fontsource       | Bundled fonts                                   | DM Sans and DM Serif Display load from the deployed app, not Google Fonts  |
| node:test        | Unit and API tests                              | No extra test runner required                                              |
| Playwright       | Browser verification                            | Exercises the real interface, persistence and responsive layout            |
| Prettier         | Source formatting                               | Keeps the code readable during your walkthrough; does not change behavior  |

No model SDK is required. The REST adapter is small and its request is easy to explain. No database, vector embeddings, search service, CRM, voice API or paid third-party component is part of the product.

## 3. Read the source in this order

1. `shared/contracts.mjs`: what the data must look like and how priority is calculated.
2. `server/prompts.mjs`: what the model is asked to do and what it must not assume.
3. `server/ai.mjs`: the actual provider request and output validation.
4. `server/handlers.mjs`: HTTP checks, request limits and endpoint behavior.
5. `src/App.jsx`: state and how UI actions mutate a lead.
6. `src/components/LeadForm.jsx`, `LeadQueue.jsx`, `LeadDetail.jsx`, `Copilot.jsx`, `FollowupModal.jsx`, `Modal.jsx`.
7. `src/lib/`: the small API, storage and formatting helpers.
8. `tests/`, followed by deployment configuration.

Do not try to memorize every JSX line. Be able to trace a saved lead from the form through the API and back into state, and explain why errors do not erase it.

## 4. File-by-file map

### Root files

- `package.json`: npm commands, runtime engine and dependencies. `private: true` prevents accidentally publishing this package to npm; it does **not** mean the GitHub repository must be private.
- `package-lock.json`: resolved dependency versions. Commit it so `npm ci` installs the tested dependency tree.
- `.gitignore`: keeps keys, dependencies, builds, local browser binaries and test artifacts out of Git.
- `.env.example`: documents server variables with an empty key. Copy it to ignored `.env` for local use.
- `index.html`: page title, description, viewport and the React mount point.
- `public/favicon.svg`: small vector house/check brand mark.
- `vite.config.js`: React build plugin, local port 5173 and `/api` proxy to 3001.
- `vercel.json`: Vite build output, 60-second function duration, frame/type/referrer/permission headers.
- `playwright.config.js`: browser test location, local server reuse, headless browser and failure traces. It can use the ignored workspace browser cache when present.

### Frontend files

- `src/main.jsx`: bundles local fonts, imports styles and mounts `App` inside React StrictMode. StrictMode can re-run mount effects in development to expose problems; it does not double-click user actions.
- `src/App.jsx`: root state, derived views, persistence effect, analysis orchestration, dialogs, backups, settings, notifications and lead actions. Smaller UI pieces receive callbacks rather than maintaining separate copies of a lead.
- `src/components/LeadQueue.jsx`: search, priority filters, sorting dropdown and selectable saved-lead cards. Each card shows the summary, score, priority, status, sample label and pending task. Mobile turns the list into a horizontally scrollable strip of cards.
- `src/components/LeadDetail.jsx`: identity and status, Overview/Original inquiry/Activity tabs, AI brief, requirements, concerns, next action, draft editor, explanation and evidence. Opens the copilot on demand. The reply text is temporary component state, so copying is the explicit handoff.
- `src/components/LeadForm.jsx`: the six required intake fields, form limits, example-fill button and Save draft / Save & analyze actions. It validates with the shared schema before calling the app callback.
- `src/components/Copilot.jsx`: a scoped chat client. Starter questions, request cancellation, bounded history, errors, source quotes and rewrite drafts. It never calls Gemini directly.
- `src/components/FollowupModal.jsx`: editable task and local date/time input. Quick shortcuts set one hour, tomorrow at 10 AM or three days later. Converts the selected local time to ISO UTC on save.
- `src/components/Modal.jsx`: native `<dialog>` wrapper. `showModal()` traps interaction to the dialog, Escape closes it, and an accessible title is provided. Native behavior supplies keyboard/focus support without a custom overlay implementation.
- `src/data/samples.js`: five fictional examples with explicitly hand-authored analysis, realistic budgets/timelines, and one initially due task. Sample quotes and complete records are validated against the same schemas as live records.
- `src/lib/api.js`: browser POST helper, response/schema checks, source verification and user-readable transport errors.
- `src/lib/storage.js`: versioned storage, JSON backup, file download and corrupt-data recovery behavior.
- `src/lib/format.js`: initials, dates, datetime-local formatting and constructors for activity entries and drafts.
- `src/styles.css`: shared color tokens, UI components and responsive breakpoints. Serif headings add warmth; DM Sans serves operational content. Reading text is larger, details have space, and copilot is separate from the main two-column workspace.

### Backend and shared files

- `shared/contracts.mjs`: all runtime data shapes plus deterministic scoring, priority, sorting, open/due checks and evidence validation. Imported by frontend, server and tests.
- `server/prompts.mjs`: system instructions shared by analysis and chat, with separate task-specific instructions.
- `server/ai.mjs`: real server-only provider request, structured JSON, timeout and safe error mapping.
- `server/evidence.mjs`: splits original fields and recent notes into exact sentence snippets (up to 350 characters), assigns source IDs and constrains the model's `evidenceIds` to those IDs. It resolves selected IDs into the public response's `{ field, quote }` objects, removing duplicates. Unknown IDs are rejected. The model never needs to reproduce the quoted text.
- `server/handlers.mjs`: request guards, bounded input validation, best-effort request limiting, source verification, response metadata and health reporting.
- `server/dev.mjs`: Express wiring for local development; optionally serves `dist` with `--production`.
- `api/analyze.mjs`, `api/chat.mjs`, `api/health.mjs`: tiny Vercel entry points re-exporting the shared handlers. Business logic stays in `server/`.
- `scripts/capture-preview.mjs`: development QA utility. Captures actual local screenshots and reports browser errors, summary font size and page overflow across screen widths. Not shipped as an application feature.
- `scripts/verify-ai.mjs`: opt-in real-model smoke check. Loads the private local environment, sends fictional intake through two actual Gemini requests (analysis and chat), validates their schemas and exact quotes, and prints the resulting summary and call guidance. It never substitutes sample analysis and does not run in the build or normal test suite.
- `scripts/verify-live-workflow.mjs`: opt-in browser acceptance check with real API calls and fictional intake. Requires the local app to be running and Playwright installed. Uses isolated browser storage, checks saved analysis after reload, adds a call note, requests a grounded rewritten reply, and completes a follow-up. It never modifies the user's own browser workspace.

### Verification and documentation

- `tests/contracts.test.mjs`: lead validation, scores, priorities, ordering, due tasks, evidence and backups.
- `tests/ai.test.mjs`: provider request contract and transport/error cases using a mocked fetch.
- `tests/evidence.test.mjs`: exact snippet extraction, source-ID resolution, invalid-ID rejection and activity/unknown-answer handling.
- `tests/handlers.test.mjs`: API guards, error handling, context, rate limiting and health behavior.
- `tests/e2e/workflow.spec.js`: browser workflows using intercepted API responses. No fixture is imported into application API handlers.
- `docs/screenshots/`: actual local screenshots, with the unconfigured state accurately visible.
- `README.md`: repository-facing overview.
- `docs/SETUP_AND_DEPLOY.md`: your credential, repository and hosting steps.
- `docs/DEMO_SCRIPT.md`: timed demo and spoken narration.
- `docs/INTERVIEW_PREP.md`: questions you should be able to answer honestly.
- `docs/VALIDATION.md`: what was tested and what still needs a real key.
- `docs/SUBMISSION.md`: four deliverables, public access checks and disclosure.

## 5. The data model

### Intake

All six values are strings: name (100 chars), location (150), property (350), budget (150), timeline (150), message (8,000). Zod trims strings and rejects empty values, wrong types and over-limit content.

Budget and timeline are free text on purpose. “₹90 lakh including registration,” “under USD 400,000” and “not decided yet” are natural customer inputs. A rigid numeric field would lose useful context and force premature normalization. This prototype does not compare budgets numerically or convert currency.

### Analysis

`summary`, `intent`, `requirements[]`, `concerns[]`, `missingInformation[]`, `nextAction`, `suggestedResponse`, `scores` and `evidence[]` are required keys. Concerns and missing information may be empty arrays; requirements and analysis evidence must contain at least one item. Text lengths and array counts are bounded.

Each score component has an integer `points` and a short `reason`. Evidence has a `field` and an exact `quote`. Evidence cannot cite the customer's name; useful evidence should come from requirements, message, budget or timeline.

The model does **not** own the total score or tag. `getScore()` sums the four components, and `getPriority()` applies the thresholds. Invalid scores are rejected, not silently clamped.

### Saved lead

```text
id              Stable UUID, or a stable sample ID
intake          Six original customer fields
analysis        Valid analysis, or null for a draft
source          sample | live | draft
status          New | Contacted | Visit booked | Won | Lost
createdAt       ISO creation timestamp
analyzedAt      ISO generation timestamp, or null
model           Actual configured model ID, or null
followup        One { task, dueAt, done } object, or null
activity        Recent note/status/task events
chat            Conversation messages for this lead
```

UUIDs and timestamps are created with browser APIs for local records. Analyzed-at metadata is returned by the server after a successful model result. A sample has no claimed model or live generated timestamp.

Activity entries have ID, timestamp, type and text. Types distinguish a manual note, status transition, planned task and completed task. At most 200 entries are retained. Chat stores user/assistant text, timestamps and optional assistant evidence or response draft, with at most 100 messages retained.

### Backup envelope

Backups use `{ version: 1, leads: [...] }`. The schema validates every record, caps it at 500 leads and rejects duplicate IDs. Imports merge **new IDs** and skip existing IDs; they do not overwrite a local lead. The file-size guard is 8 MB.

## 6. End-to-end analysis flow

1. User opens Add a lead and completes the form.
2. `LeadForm` validates with `intakeSchema`.
3. `App.saveLead()` creates a complete draft record and inserts it into state **before** making the AI request.
4. The form closes, the new lead becomes selected, and local persistence runs through the state effect.
5. If Save & analyze was chosen, `App.analyze()` marks that lead as in flight and calls `requestAI('analyze', { intake })`.
6. The browser sends same-origin JSON to `/api/analyze`. No key is in its request.
7. `analyzeHandler` checks HTTP method, content type, same-origin browser request, body size, required fields, configured key and request limits.
8. `generateStructured()` builds a catalog of exact source snippets and a provider schema using allowed `evidenceIds`, converts it to JSON Schema and POSTs to Gemini with system instructions and JSON-encoded input.
9. The provider must finish with `STOP`. Truncated or blocked output is rejected. The resulting text must parse as JSON, pass the provider schema, and have its source IDs resolved to exact original snippets before passing the public `analysisSchema`.
10. `verifyEvidence()` checks every quote against its named original field. A mismatch rejects the result.
11. The server returns the analysis plus model ID and generated time with `Cache-Control: no-store`.
12. The browser validates the output and quotes again.
13. `App` replaces the draft's analysis, marks its source live, stores metadata, clears obsolete chat and removes the loading state.
14. The queue re-sorts because its derived priority changed.

The set/ref combination for in-flight lead IDs prevents repeated analysis clicks for the same lead. Different leads may be analyzed independently. Editing and deleting an actively analyzed lead are disabled; imports and bulk data changes are disabled while analysis is in flight.

If any stage fails, the draft and prior valid analysis remain. A visible error offers retry. There is no fake score or generated-looking fallback. A successful re-analysis clears chat to avoid continuing against an old analysis.

## 7. End-to-end copilot flow

The copilot opens in a focused dialog for the selected lead, rather than squeezing a permanent third column beside the analysis. Its title and context strip identify the customer.

The request contains:

- Original intake as the factual customer source.
- Optional stored analysis as an inference, not unquestionable truth.
- Last 20 activity entries as recent context.
- Last 12 chat messages with only user/assistant roles.
- Current question (max 1,500 characters).

The complete bounded context is encoded as data in one provider user message. History is not allowed to inject a provider system role. This is a simple stateful conversation through explicit context resending, not a provider-side chat session.

The public answer schema has `answer`, nullable `suggestedResponse` and evidence. The provider schema replaces evidence with allowed snippet IDs, which the server resolves into original quotes. A rewrite returns a separate draft; the salesperson can copy it. For factual answers, the prompt asks for supporting source IDs. Unknown answers can have no sources and should state what is missing.

The server verifies quotes from intake or the concatenated recent activity text. Chat cannot cite a different lead because no other lead is included. It could still hallucinate within a response; provenance checking is not a semantic verifier.

User and assistant messages are saved together only after success. Failed questions stay in the input for retry. Starter questions remember the exact failed attempt. The conversation cannot grow past its per-lead cap without being cleared.

Closing or unmounting the copilot aborts its browser request. This stops the waiting client; it does not guarantee that a provider request already started will be cancelled on the server. A new component key on intake or analysis changes prevents a stale response being appended to a different context.

## 8. How the score and queue work

The model assigns:

- Urgency, 0–35: explicit purchase window. Under a month gets the highest band, then 1–3 months, 3–6 months, then longer/unknown.
- Clarity, 0–25: specific and consistent location, property and budget. Higher budget **size** is not rewarded.
- Intent, 0–25: active purchase/shortlist/visit intent versus general curiosity.
- Readiness, 0–15: concrete willingness to act, without assuming financing approval.

`getScore()` sums these values. `getPriority()` uses Hot ≥75, Warm ≥45 and Cold <45. Missing analysis is Unscored rather than a zero-quality customer.

Default sort:

1. Open leads before Won/Lost.
2. Score descending; Unscored uses a sorting value below any scored lead.
3. Newer creation time when scores tie.

Follow-up sort preserves open-first, prioritizes overdue tasks, then the earlier pending due date, then score. Newest sort uses creation time alone. Sorting copies the array and does not mutate app state.

Search matches name, locality, property, message and summary. Priority filters and the Follow-ups view further narrow the results. If the current selected ID is not in the filtered list, the UI displays its first match; an empty view has a clear empty state. The lead cards retain Won/Lost history instead of silently deleting closed leads.

The Hot metric counts only open Hot leads. Clicking it filters by Hot; the filter may also display retained closed Hot records, which are visibly marked by status and ranked last. The due metric counts only open, incomplete tasks due at or before the current time.

## 9. Follow-up planner: your invented feature

“Plan it” pre-fills the task with the next action. The salesperson edits the action and chooses a date/time. The app stores an ISO timestamp and appends an activity event; future plans and reschedules are not hidden from the history.

`isDue()` requires an open lead, a task, an incomplete task and a due time no later than now. The app refreshes its clock every 30 seconds while open. It does not run a worker when the page is closed.

The Follow-ups view shows open leads with pending tasks. Marking Done records a completion event and removes that lead from this view unless another task is later planned. Replacing a completed or pending task creates the next current task while leaving historical activity.

After a call, add a note under Activity and update status. These are explicit human actions. The copilot reads recent notes immediately on its next request. **Intake re-analysis does not include those notes**; it scores the original customer inquiry, while chat reflects subsequent events. This boundary keeps the score explainable and is a useful extension discussion in the interview.

## 10. State, persistence and recovery

`App` owns the leads array. Queue and detail are projections of that same source of truth. Search, sorting, selected ID and dialog state do not modify the saved customer record.

At startup, `readLeads()` loads and validates the versioned backup envelope. No saved value means the app seeds five samples. An explicitly saved empty array stays empty on reload; samples are not silently re-added.

A React effect writes changes to localStorage. If browser storage is full or blocked, the UI reports that work is only in memory and suggests export. It does not pretend those changes persisted.

If the original stored bytes are malformed, the app **does not overwrite them automatically**. It starts an empty in-memory workspace, reports the error and provides an “Export original stored data” recovery action. Explicitly clearing the workspace authorizes replacing the corrupt storage. Valid imported leads cannot repair invalid original bytes until that reset.

Delete and Clear all data use confirmation dialogs because they remove locally saved work. Export uses a Blob download and revokes the temporary object URL. Neither backup action uploads data anywhere.

There is no cross-tab synchronization: two open tabs can overwrite each other's local changes. A shared multi-user CRM would need a database and concurrency strategy instead of browser-only state.

## 11. AI transport, timeouts and output trust

Server environment controls the key and model. The endpoint is fixed to Google's hostname; model ID validation prevents arbitrary URLs or path injection. The key is an HTTP header, so it does not appear in the request URL.

`temperature: 0.2` favors consistent concise extraction; it does not guarantee deterministic results. `maxOutputTokens: 4096` bounds output. `thinkingBudget: 0` applies only to the default Gemini 2.5 Flash model; other models do not automatically receive that setting.

Timeouts are layered: provider fetch 45 seconds, browser request 55 seconds, Vercel function 60 seconds. This leaves time to return an actionable error before the platform terminates the function.

Structured output asks the model for the shape; Zod independently verifies it. Temporary HTTP 500/502/503/504 provider failures get one automatic retry after 800ms, sharing the same total 45-second timeout. Authentication, quota, model-not-found and invalid-output failures are not automatically retried. At most two model requests are made for an action; the salesperson can retry explicitly if both fail.

Error categories include missing configuration (503), provider quota (429), app limit (429), provider/model/access errors (502), timeout (504), invalid output (502) and mismatched evidence (502). Raw provider response bodies and internal exceptions are never returned to the user.

Provider failures additionally carry safe diagnostic metadata (`providerHttpStatus`, configured model, allowlisted Google status and recognized reason) in `error.details` and server logs. Raw messages, credentials, request headers and customer text are not logged or returned. This helps distinguish temporary provider errors from key restrictions or model access when localhost and Vercel behave differently.

Health reports **key presence**, configured model and browser-local storage. It does not make an AI call or claim the credentials are valid. The UI says “Gemini configured,” not “Gemini connected successfully.”

## 12. Security and privacy boundaries

- The key stays on the server, outside Vite's `VITE_` environment export mechanism.
- Incoming JSON and provider results have runtime schemas and length bounds.
- API responses are not cacheable. The app uses plain-text React rendering rather than inserting model-generated HTML.
- Same-origin checks reject foreign browser origins. This does not stop direct scripts; CORS/origin checks are not authentication.
- Request limits use an in-memory Map per instance: default 30/hour per address and 120/day overall. Vercel instances can restart and scale, so these are **not distributed durable limits**.
- No RBAC is implemented. Client-side state is never presented as a permission boundary.
- Prompt instructions treat customer content, notes and history as untrusted. This reduces obvious instruction injection but is not a guarantee.
- Evidence checks exact quote provenance but does not independently audit all model reasoning.
- localStorage is unencrypted and tied to the origin/browser. Public demo users should use fictional data.
- Google's free-tier data policy must be considered before real customer use. This prototype's public-demo architecture is not an assertion of production privacy compliance.
- No outbound customer action occurs. Copies, plans and statuses require a salesperson's explicit interaction.

For real team use, first add server authentication, user/team ownership, durable storage, enforced RBAC, distributed limits, audit events and a privacy/retention strategy. A login-looking screen or switchable “Admin” badge would not be a substitute.

## 13. UI and accessibility details

The final design has a ranked queue and a wider lead workspace. The copilot opens when requested. This preserves reading width, especially at typical laptop sizes, and avoids forcing three narrow panels on the salesperson.

Body content generally uses 14–17px text; small secondary labels carry less critical metadata. The summary is 17px on desktop and 16px on compact screens. Line height, card padding and high-contrast operational text support scanning.

Breakpoints adapt navigation, columns, fact layout, insight cards and the mobile queue. The page has no horizontal overflow in checks from 360px to 1920px; the mobile card queue intentionally scrolls horizontally inside its own container.

Buttons have accessible labels where icons are used. Form inputs have labels. Native dialogs support keyboard closing and modal focus. Tabs expose tab/tabpanel relationships. Notifications use a status role, error messages use alert, and chat uses a live log. Reduced-motion preferences shorten animations.

This is practical accessibility groundwork, not a claim of a complete accessibility certification. A production pass should include manual screen-reader testing and measured contrast for all secondary text.

## 14. Deployment and dependency details

Development runs Vite and Express together through `concurrently`. Production on Vercel builds only the browser assets and serves the `api/` functions. Imports from `server/` and `shared/` are bundled as function dependencies. The Express development listener is not the Vercel entry point.

`npm start` is a local production check: Express serves `dist` plus the API. `vite preview` alone would not supply the server endpoints.

Fonts are self-hosted in the browser bundle. No external image service, Google Fonts runtime request or asset API key is required. SVG icons and the favicon remain vector assets.

The app can run entirely on free-tier eligible services for this prototype, but the actual account quota and hosting-plan conditions must be checked during publication. Do not enable paid billing for the assignment. Pinning the dependency lockfile makes installation repeatable.

## 15. What to show in the interview

### GitHub Pages hosting update

The live frontend can also run at `https://suhaskotyan.github.io/RealEstate_AI/`. Pages cannot run Node functions, so the frontend uses a public API origin configured by the build, while the key and model calls remain on Vercel. GitHub repository secrets are not exposed to the browser and do not create a backend.

`src/lib/config.mjs` validates the public API origin and produces URLs for health, analysis and chat. Empty configuration retains local/Vercel same-origin requests. `server/cors.mjs` accepts the explicitly authorized Pages origin, handles JSON preflight before validation/AI calls, and rejects other foreign origins. Environment overrides can change this list; CORS is not authentication.

`vite.config.js` reads the build's `VITE_BASE_PATH`, and the HTML favicon uses `%BASE_URL%`. `.github/workflows/pages.yml` obtains the repository base path from Pages configuration, tests/builds on Node 22 and publishes only `dist`. This fixes the previous 404 caused by publishing development HTML with `/src/main.jsx` directly.

Set `VERIFY_APP_URL` to the public Pages URL to run `scripts/verify-live-workflow.mjs` against the real hosted UI. The test uses a fresh browser context and fictional intake. See `GITHUB_PAGES.md` for full deployment details.

Use one source trace: **LeadForm → saveLead → requestAI → analyzeHandler → generateStructured → analysisSchema/verifyEvidence → updated state → ranked queue**.

Then show the decision boundary: Gemini interprets customer language, while code owns score totals, priority thresholds, validation, ordering and task status. This demonstrates using AI as a meaningful component inside ordinary reliable software.

Finish with the feature you invented: convert the suggested action into a follow-up, record the call outcome, and ask the copilot a question grounded in that note. Explain that this helps the salesperson complete the loop, rather than only reading another generated paragraph.
