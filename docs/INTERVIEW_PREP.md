# Prepare for the 30-minute interview

Use these as explanations to understand, not lines to repeat without checking the code. You should be able to make a small change live and trace the resulting behavior.

## “What did you build?”

A single-salesperson workspace for multiple inbound real-estate leads. Gemini turns intake into a brief, explained score and suggested action. A scoped copilot supports follow-up questions. My additional feature turns actions into dated follow-ups and records call outcomes.

## “Where is the actual AI call?”

`server/ai.mjs`, in `generateStructured()`. It calls Google's `generateContent` REST endpoint with the server-only key in a header. `server/handlers.mjs` invokes it after validating the request. Samples are hand-authored fixtures; all new analysis and chat require the real API.

## “Why Gemini 2.5 Flash?”

It supports structured extraction and an eligible free tier, and this task needs compact analysis rather than complex agent tools. The model ID is a server variable because availability can change. I used low temperature and disabled default-model thinking for this small extraction task. I would measure quality and latency on representative leads before declaring it the best model.

## “Why not a database?”

The brief allows memory or a database. Browser persistence is a middle ground that survives reloads without account/database setup. It isolates visitors in a public demo. It is not suitable for shared production CRM records or cross-device access.

## “Are there multiple roles or RBAC?”

No. The target is one salesperson and the assignment asks for multiple leads, not user roles. There is no authentication or enforced permission model. If a team needed agent/manager/admin roles, I would add server identity, team-owned database records and permissions checked in API handlers. I would not add an unauthenticated role switch and call it RBAC.

## “Why this additional feature?”

The salesperson’s work continues after reading an analysis. A clear next action is useful only if someone remembers to act. A dated task, due queue and call note make that next step concrete. It was more directly helpful to this workflow than adding more generated output.

## “Can you explain the score?”

Four components: urgency 35, clarity 25, purchase intent 25, readiness 15. The model assigns bounded points and explanations. Code validates and sums them, then applies Hot ≥75 and Warm ≥45. It is a transparent heuristic, not a conversion prediction. Budget size and demographic traits should not increase priority.

## “How would you evaluate model quality?”

Build a fictional or consented evaluation set including browsing, urgent intent, contradictions, missing budgets, no-call preferences, mixed currencies and adversarial transcript text. Have salespeople label expected next actions and rationale, not only a single score. Measure factual errors, invented commitments, quote accuracy, missed concerns, ranking agreement, latency and failure rate. Then refine the rubric and compare models on the same cases. Unit tests validate code, not model behavior.

## “How does chat stay grounded?”

Only the selected lead's intake, analysis, recent notes and bounded history are sent. The prompt treats analysis as an inference and original text as the source. Quotes must match exact substrings. There are no tools to search other leads or external property inventory. Grounding is still imperfect; quotes do not prove all conclusions.

## “How do you stop hallucinated listings or promises?”

The system prompt forbids invented availability, prices, discounts, loans and customer commitments. The interface labels responses as drafts. Missing facts are explicit questions. There is no inventory tool, so the app should propose a clarification or verification step rather than claim a property exists.

## “How do you handle prompt injection?”

The system instructions mark lead fields, history and notes as untrusted data, and the request encodes them as JSON. History cannot include a system role. Validation constrains output shape and quote provenance. This is a mitigation, not a complete solution; a real deployment needs adversarial evaluations and stronger boundaries before exposing action tools.

## “What if Gemini fails during a customer demo?”

The inquiry was saved first. I show the error, explain whether it is configuration, quota or timeout, and continue with the original inquiry and follow-up planner. I do not present a canned answer as a model result. A failed re-analysis preserves the previous valid analysis.

## “Where does the API key live?”

In `.env` locally or the Vercel server environment in production. It is never prefixed `VITE_`, included in the browser bundle, or added to the repository. The provider request uses a header instead of a URL query parameter.

## “What prevents abuse of a public endpoint?”

Length bounds, same-origin browser checks and best-effort per-instance limits. The provider's free-tier quota also limits usage. This is not a hardened public service: scripts can call the endpoint directly and serverless counters do not share state. Production requires durable limits, identity and monitoring. Keep the assignment project unbilled.

## “What happens when a lead is edited?”

The intake changes, old analysis is cleared, source becomes Draft, and chat is cleared. This prevents stale insights from looking current. The activity history is retained and records the edit. The user can re-analyze explicitly.

## “Do notes change the score?”

Not automatically. Analysis scores intake; recent notes affect the copilot. This keeps the scoring source clear but is a limitation. A later version could generate a new dated assessment based on intake plus explicit call outcomes, preserving the old assessment and showing what changed.

## “Why is chat a separate panel now?”

Readability is more important than fitting everything at once. The main view now has a lead queue and wider detail panel. The copilot opens for a focused task, with larger text and the customer context visible. That makes typical laptop screens easier to scan.

## “What would you improve first for a real team?”

Server authentication, team ownership and durable storage first; then server-enforced RBAC and distributed request limits. Follow with measured model evaluations, data retention, audit events and a CRM integration. Notifications and calendar integration should be explicit customer-authorized actions rather than implied automated sending.

## “What would you do with more time?”

- Build a labeled evaluation set and tune the score rubric against salesperson judgment.
- Track versions of analysis and show how call outcomes changed the assessment.
- Add shared team storage, assignment and authenticated permissions.
- Add a real property-inventory adapter so recommendations can be factual.
- Add confirmed outbound integrations and background reminders.
- Manually test screen readers, all contrast states and multi-tab persistence.

## “What did the coding assistant do?”

Codex helped with scope, implementation, UI, prompts, API integration, tests and documentation. The Sites skill guided the implementation workflow, while hosting is prepared for Vercel. Gemini is the runtime product component once the key is configured. Explain that you reviewed the code and can trace the architecture; do not claim you authored every line without assistance.

## Small live changes you should be able to make

- Change a priority threshold in `getPriority()` and update its boundary tests.
- Adjust one component's maximum only by coordinating schema, prompt, UI and tests.
- Add a safe starter question in `Copilot.jsx`.
- Add a new lead status consistently in the schema and select list.
- Change a color token or reading size in `src/styles.css`.
- Extend the scoring rubric for an actual sales team without turning budget amount into a quality shortcut.

## Suggested interview pacing

Spend 3 minutes on the product, 7 tracing the actual AI request and validation, 5 explaining prioritization and follow-through, 5 on failure/security boundaries, and 10 on questions or a small live change. Let the interviewer steer; the source trace is your reliable anchor.
