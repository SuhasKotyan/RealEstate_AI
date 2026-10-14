# Submission checklist

These are the four required deliverables. Repository and live app links below are published and verified; your recorded demo is still required.

| Deliverable                         | Actual URL / content                         | State                                |
| ----------------------------------- | -------------------------------------------- | ------------------------------------ |
| Public GitHub repository            | https://github.com/SuhasKotyan/RealEstate_AI | Published                            |
| Live application                    | https://suhaskotyan.github.io/RealEstate_AI/ | Published; real AI workflow verified |
| Screen-recorded demo, max 3 minutes | Add the Loom / Drive / unlisted YouTube URL  | Pending your recording               |
| AI usage disclosure                 | Copy the paragraph below                     | Prepared                             |

## AI usage disclosure

> I used OpenAI Codex for product scoping, the React/Vite structure, UI implementation, Gemini prompts, backend integration, tests, debugging, documentation and GitHub Pages deployment. Codex's Sites skill guided the initial implementation workflow. The final frontend is hosted on GitHub Pages and its private-key API runs on Vercel. Official Google Gemini, Vercel, GitHub Pages and Vite documentation was consulted. Google Gemini is the runtime model for analysis and grounded chat; real hosted calls were verified. The sample analyses are explicitly hand-authored examples. No other AI coding assistant was used in this implementation session. I reviewed the source and can explain the architecture, prompts, validation, scoring and limitations.

Change the last sentence if it is not yet true for you: use the walkthrough to understand it before the interview. Add any additional tools you personally use after this session.

## Before uploading to the form

- [x] Gemini key remains server-side; the frontend build does not embed the key and `.env` is ignored.
- [x] Real analysis and chat succeeded on the public Pages URL; evidence is recorded in `VALIDATION.md`.
- [x] Repository is public.
- [x] Public Pages URL opens in a fresh browser without login.
- [x] New lead, saved list, chat and follow-up workflow passed on the deployed URL.
- [ ] Video is a real screen recording and is no longer than three minutes.
- [ ] Video link plays in incognito without requesting access.
- [ ] README includes what was built, architecture, model/API, local setup, technical decisions and limitations.
- [ ] AI usage disclosure reflects your actual use of tools.
- [ ] You can explain the code path from intake through AI and back to the ranked queue.
- [ ] All URLs are pasted into the Google Form once its link is provided.

## Submission description you can adapt

“Closewise is a real-estate lead workspace built with React, Node.js and Google Gemini. It saves multiple inquiries, produces structured lead briefs with explained priorities, and supports follow-up questions scoped to each lead. My added feature is a follow-up planner: turn the recommended action into a dated task, record the call outcome and use recent notes in the copilot. The prototype uses browser-local persistence and keeps the model key server-side. The README documents setup, architecture, decisions, validation and production limitations.”

## What still depends on you

The public repository and Pages app are published, the Vercel API is connected, and a real hosted workflow is verified. Record/upload your demo (maximum three minutes), ensure its link plays while signed out, review the code for the interview and submit the four deliverables using the provided Google Form.
