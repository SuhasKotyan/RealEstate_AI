# Submission checklist

These are the four required deliverables. Fill in actual links after publishing; no live links are invented here.

| Deliverable                         | Actual URL / content                        | State                                 |
| ----------------------------------- | ------------------------------------------- | ------------------------------------- |
| Public GitHub repository            | Add your repository URL                     | Pending your publication              |
| Live application                    | Add the production Vercel URL               | Local AI verified; deployment pending |
| Screen-recorded demo, max 3 minutes | Add the Loom / Drive / unlisted YouTube URL | Pending your recording                |
| AI usage disclosure                 | Copy the paragraph below                    | Prepared                              |

## AI usage disclosure

> I used OpenAI Codex for product scoping, the initial React/Vite structure, UI implementation, Gemini prompt design, backend integration, tests, debugging and documentation. Codex's Sites skill guided the implementation and local preview workflow; the application is prepared for Vercel hosting. Official Google Gemini and Vercel documentation was consulted. Google Gemini is the runtime AI component for lead analysis and grounded follow-up chat once configured. The sample analyses are explicitly hand-authored examples. No other AI coding assistant was used in this implementation session. I reviewed the source and can explain the architecture, prompts, validation, scoring and limitations.

Change the last sentence if it is not yet true for you: use the walkthrough to understand it before the interview. Add any additional tools you personally use after this session.

## Before uploading to the form

- [ ] Gemini key is server-side and no secrets are in the public repository.
- [x] At least one **real** analysis and **real** chat request succeeded locally; evidence is recorded in `VALIDATION.md`. Repeat on the deployed URL before submitting.
- [ ] Repository is public and its README opens while signed out.
- [ ] Stable production URL opens in incognito without Vercel authentication.
- [ ] New lead, saved list, prioritization, chat and follow-up feature work on the deployed URL.
- [ ] Video is a real screen recording and is no longer than three minutes.
- [ ] Video link plays in incognito without requesting access.
- [ ] README includes what was built, architecture, model/API, local setup, technical decisions and limitations.
- [ ] AI usage disclosure reflects your actual use of tools.
- [ ] You can explain the code path from intake through AI and back to the ranked queue.
- [ ] All URLs are pasted into the Google Form once its link is provided.

## Submission description you can adapt

“Closewise is a real-estate lead workspace built with React, Node.js and Google Gemini. It saves multiple inquiries, produces structured lead briefs with explained priorities, and supports follow-up questions scoped to each lead. My added feature is a follow-up planner: turn the recommended action into a dated task, record the call outcome and use recent notes in the copilot. The prototype uses browser-local persistence and keeps the model key server-side. The README documents setup, architecture, decisions, validation and production limitations.”

## What still depends on you

Your local Gemini key and real-model acceptance workflow are now verified. Publish the public GitHub repository, deploy through your Vercel account (adding the key to its server environment), repeat the acceptance checks on the deployed URL, and record/upload the demo. Detailed instructions and narration are already included. No external publication was performed in this coding session.
