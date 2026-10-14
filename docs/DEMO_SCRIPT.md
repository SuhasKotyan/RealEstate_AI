# Closewise: three-minute screen demo

Target **2 minutes 45 seconds**, leaving 15 seconds of margin. Record your own screen and voice on the **configured app**. Do not use mocked browser test responses in the submitted video.

## Before recording

- Complete Gemini setup and one real analysis/chat acceptance test.
- Use the deployed production URL if available; use your local configured app only for rehearsal.
- Browser zoom: 100%. A 1440px-wide recording works well. Close developer tools, notifications and unrelated tabs.
- Use fictional data. Keep API keys, `.env`, account tokens and billing screens off camera.
- Start with samples loaded and the queue visible. If you have already added Kavya, delete that demo copy so the fresh intake is obvious.
- Rehearse the click order once. AI output wording and latency will vary; describe what actually appears rather than reading a memorized result.
- For the follow-up, choose a time earlier today so its due state is visible. This is a task timestamp, not a claim that the call already happened.
- Keep the README/code tab ready at `server/ai.mjs` or `shared/contracts.mjs`.

## Timed click plan and narration

| Time      | Screen action                                                                       | What to say                                                                                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20 | Show dashboard and queue                                                            | “This is Closewise, a lead workspace for a real-estate salesperson. It helps decide who to call, what the customer needs, and what to do next. These initial records are clearly labeled samples; I’ll add a fresh lead and make a real Gemini request.”                           |
| 0:20–0:45 | Add a lead → Fill an example lead; point to the six fields → Save & analyze         | “The intake captures the customer, area, property, budget, buying timeline and their own message. This example wants a ready-to-move 2 BHK within six weeks and has concerns about water and maintenance. The inquiry is saved before AI runs, so a failed request won’t lose it.” |
| 0:45–1:10 | Show real result; scroll to requirements, concerns, next action                     | “The result is a short brief: intent, requirements, concerns and a recommended next move. It also drafts a reply for human review. Notice the generated model metadata: this is a real result, not the sample analysis.”                                                           |
| 1:10–1:25 | Expand Why this priority?                                                           | “The model scores four signals and explains each one. Code adds the points and applies Hot, Warm or Cold thresholds. Budget size doesn’t improve the score, and this is a prioritization aid rather than a conversion probability.”                                                |
| 1:25–1:50 | Ask copilot → click What should I emphasize on the call?; expand a source           | “The copilot receives only this lead’s inquiry, analysis and recent notes. It can prepare the call or rewrite the reply. Source snippets are checked against the original text, and it should admit when information is unknown.”                                                  |
| 1:50–2:20 | Close copilot → Plan it → choose earlier today → Save → show Follow-ups → mark Done | “My added feature is follow-through. I can turn this recommendation into a dated action, find it in the follow-up queue and mark it complete. The idea is to bridge understanding the lead and actually making the next contact.”                                                  |
| 2:20–2:35 | Lead workspace → select the demo lead → Activity → add a short outcome note         | “After the call I can record what changed and update the lead status. Recent notes become context for the next copilot question, so the salesperson doesn’t have to repeat the conversation.”                                                                                      |
| 2:35–2:45 | Show server/ai.mjs or README diagram briefly                                        | “The API key stays on the server. Structured JSON and runtime validation keep the interface predictable. Leads are browser-local for this prototype; shared team accounts and role permissions would need a database and authentication.”                                          |

If real model latency uses the margin, skip the final code tab and give the decision verbally. Do not exceed three minutes.

## Sample outcome note

```text
Spoke to the customer. Sunday afternoon visit is preferred. Asked for a verified maintenance breakdown before scheduling.
```

Treat this as a fictional demo event; do not imply an actual customer call occurred. If you want to show notes feeding chat, ask “What changed after the call?” in place of marking the task Done, to stay inside the time limit.

## A shorter spoken script for rehearsal

“Closewise helps a salesperson turn a queue of real-estate inquiries into a clear next conversation. I’ll add a new lead, because the starting records are labeled examples.

The form captures the customer's details, requirements, budget, timeline and actual message. This lead needs a ready-to-move 2 BHK within six weeks, with concerns about water supply and maintenance. Saving happens before the model request, so an API failure doesn't erase the inquiry.

Gemini returns a summary, intent, requirements, concerns, next action and draft response. Each scored signal also has a reason. The application calculates the total and priority tag; it doesn't treat the score as a probability or reward a higher budget.

I can ask what to emphasize on the call. The copilot uses this particular lead and recent notes, and the source quotes link the advice back to the customer’s words. Replies stay drafts until I review and copy them.

The feature I added is the follow-up planner. I can turn the next action into a dated task, see it in the follow-up queue, and record what happened after the call. That closes the gap between identifying a promising lead and remembering to act.

The key stays on the server, and structured output is independently validated before it reaches the screen. This prototype saves each visitor's records in their browser. For a real sales team, the next step would be authenticated shared storage with enforced role permissions.”

## The decision to discuss in the interview

**AI interpretation with deterministic application rules.** The model reads messy human language; code owns the score total, thresholds, sorted queue, schemas and task state. You can show exactly where each responsibility lives. Do not claim the score is scientifically calibrated or the quotes prove all reasoning is correct.

## Upload and access

Use Loom, unlisted YouTube, or Google Drive with **Anyone with the link → Viewer**. Verify playback in incognito. Copy the actual link into `docs/SUBMISSION.md` and the assignment form. A video has not been recorded or uploaded by this coding session.
