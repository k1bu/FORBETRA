# Forbetra — Sync Session Prep

**Date:** February 27, 2026
**Participants:** Marc & Kieran

Hey Kieran — putting this together so we can hit the ground running. Here's where things stand and what I think we should cover.

---

## Where We Are

**Repo:** `k1bu/FORBETRA` on `main` — 72 commits total, deployed at forbetra.vercel.app

**Tier 1 (Ship-Blocking):** All 5 issues resolved and deployed.
**Tier 2 (Competitive Differentiation):** In progress — several items landed, a few still open.
**Tier 3+:** Partially started, mostly planned.

### Commit Activity Since We Last Overlapped (Feb 6)

Your last commit was `4b816d0` on Feb 6 (Email provider optionality). Since then I've added 26 commits covering:

- **Tier 1 complete** — Deduped utilities, fixed token expiry, redirected orphaned route, fixed onboarding edit loop, built "Start New Cycle" flow
- **Tier 2/3 features** — Save-as-you-go drafts, coach session view, on-demand coach prep, reveal opt-in, streak nudges, streaming insights, toast notifications, individual hub tabs
- **SMS via Twilio** — Full A2P 10DLC compliant SMS across all notification points (invites, reminders, stakeholder feedback)
- **Phone collection** — Added to all personas and forms
- **Role selection screen** — New users now pick their role on first login
- **UX overhaul** — Comprehensive polish across Individual, Coach, and Stakeholder experiences
- **Security & reliability** — Hardened validation, fixed email reliability, error boundaries on all route groups
- **Privacy/Terms pages** — `/privacy` and `/terms` now exist
- **Expert panel review** — Ran a detailed 5-person simulated audit (see `docs/expert-panel-review.md`). Overall rating: 7.2/10 with a clear path to 9+

### WIP Work (Committed but No Migration Yet)

Previously uncommitted work has been pushed as commit `46b18e3`. Still needs a Prisma migration run:

| Area                  | What's changed                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma schema**     | New `ObjectiveChange` model for tracking objective edits, `notificationTime` and `deliveryMethod` fields on User, `stakeholderFeedbackTime` on Cycle, custom stakeholder cadence support                                      |
| **Onboarding**        | Refactored to support custom cadence, notification time/delivery preferences                                                                                                                                                  |
| **Settings pages**    | Broke the old single settings page into role-specific pages: `/admin/settings`, `/coach/settings`, `/individual/settings`. Individual settings has full CRUD for profile, objective, subgoals, cycle config, and stakeholders |
| **Coach invitations** | Updates to the invite flow (groundwork for coach-prefilled onboarding)                                                                                                                                                        |

**Action needed:** Run `npx prisma migrate dev` to apply the schema changes.

### Developer Infrastructure Added (Feb 27)

Set up collaboration tooling so we stop stepping on each other:

- **`.env.example`** — All 18 env vars documented with defaults (EMAIL_MODE=mock, SMS_MODE=mock)
- **`.nvmrc`** — Pins Node 22 to match Vercel runtime
- **`CLAUDE.md`** — Full project context for AI-assisted development
- **`CONTRIBUTING.md`** — Branch strategy, PR process, Prisma coordination rules, env var rules
- **`.github/pull_request_template.md`** — Standard PR format
- **Pre-commit hooks** — `husky` + `lint-staged` auto-runs prettier + eslint on staged files

---

## Expert Panel — Top 5 Findings

The full review is in `docs/expert-panel-review.md` (worth reading), but the headlines:

1. **Individual Hub is overwhelming** — 8-12 info zones on one page. Needs restructuring into Today / Progress / Scorecard views.
2. **Post-onboarding edit flows** — Users couldn't edit objectives or manage stakeholders after onboarding. _Partially addressed by my settings page work._
3. **Coach experience is incomplete** — Coaches need real-time tools, not just Monday briefings. Coach session view is started but needs more.
4. **Stakeholder loop is underutilized** — Stakeholders are treated as transactional. Needs thank-you emails, impact summaries, engagement loops.
5. **Missing 20% of polish** — SMS (done), in-app notifications (done), settings (in progress), data export (not started), streaming AI (partially done).

---

## Agenda for Our Session

### 1. Show & Tell (15 min)

I'll walk through the major changes since Feb 6. You flag anything that looks off or that conflicts with work you've done.

### 2. Align on Priorities (15 min)

What should we ship next? The open Tier 2 items are:

| #   | Item                                                  | Status                       |
| --- | ----------------------------------------------------- | ---------------------------- |
| 6   | Coach-prefilled client onboarding                     | Planned (groundwork started) |
| 7   | Restructure Individual Hub (Today/Progress/Scorecard) | Planned                      |
| 8   | Streaming AI insights                                 | Partially done               |
| 9   | Coach Session View                                    | Started                      |

### 3. Workflow & Ownership (10 min)

We've been committing straight to `main` — I think we need to talk about:

- **Branching** — Feature branches + merge? Even lightweight is better than both on main.
- **Prisma schema ownership** — Migration conflicts are painful with two devs. Who takes point?
- **Deployment** — Who triggers Vercel deploys? Any staging environment?

### 4. Divide the Work (10 min)

Rough proposal based on our strengths:

| Marc                           | Kieran                                             |
| ------------------------------ | -------------------------------------------------- |
| Individual Hub redesign        | Coach-prefilled onboarding (schema + server logic) |
| AI streaming + chat refinement | Infra, migrations, deployment pipeline             |
| Stakeholder engagement loop    | Landing page (social proof, screenshots, demo)     |

Open to rearranging — just a starting point.

### 5. Run the Prisma Migration (remaining time)

The schema changes are committed but no migration has been created yet. We should run `npx prisma migrate dev` together and deploy it.

---

## Bugs Fixed Today (Feb 27)

Before our session, I diagnosed and fixed several production issues:

**1. All Vercel env vars were corrupted with trailing `\n`**
Every env var on Vercel had a literal newline appended to its value (e.g., `EMAIL_PROVIDER="sendgrid\n"`). This caused email to silently use the wrong provider, API keys to fail, etc. Root cause: piping values with `echo` into `vercel env add` — `echo` appends a newline that gets stored as part of the value.

**Going forward:** Always use `printf '%s' 'value' | vercel env add NAME environment` — never `echo`.

**2. SMS was broken in production**
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` were never added to Vercel. SMS was silently failing (the `trySendSms` wrapper catches errors). Now fixed.

**3. All cron jobs were returning 401**
No `CRON_SECRET` was set on Vercel. Without it, Vercel doesn't send an auth header to cron endpoints, so every job (`remind-base`, `remind-prompts`, `complete-cycles`, etc.) was failing. Now fixed — `CRON_SECRET` is set to match `JOB_SECRET_TOKEN`.

**4. Stakeholder feedback reminders were never scheduled**
The `/api/jobs/remind-feedback` route existed but was missing from `vercel.json` crons. Added it (Mon-Fri @ 3pm). Committed and pushed.

**5. No `ANTHROPIC_API_KEY` anywhere**
AI insights, coach prep, and AI chat were all broken. Now added to Vercel and local `.env`.

**Status:** Email confirmed working via SendGrid. All fixes deployed and verified.

---

## Service Audit: Email, SMS, and Overlap

I audited all three services to check if we'd set up duplicate accounts. Here's what we have:

### SendGrid (Email) — Working, no duplicates

- One API key with full access, `mail.send` enabled
- `thewinningmind.com` domain is authenticated (DKIM/SPF valid)
- No individually verified senders (relies on domain auth — this is fine)
- Stats (Feb 20-27): 8 requests, 6 delivered, 2 blocked (the 2 blocks were from the `\n` env var corruption), 5 opens
- **Set up by:** You (Kieran), pre-Feb 6. Sending from `sagal@thewinningmind.com`.

### Postmark (Email) — Barely used, your call on keeping it

- Server "Forbetra" (ID: 18274246) with default message streams
- **Only 3 emails ever sent**, 0 bounced
- **Set up by:** You (Kieran), Feb 6 commit ("Email provider optionality")
- From email mismatch: `noreply@thewinningmind.com` on Vercel vs `sagal@thewinningmind.com` locally
- **Question:** Do we still need Postmark? SendGrid is working and domain-authenticated. If there's no specific reason to keep both, I'd suggest simplifying to SendGrid only and removing Postmark config.

### Twilio (SMS) — One account, some cleanup needed

- **Account:** "Forbetra SMS" (created Oct 2017 — my existing Twilio account)
- **Two phone numbers:**
  - `+1 (619) 648-2741` — the one in our code
  - `+1 (619) 648-1113` — **unused**, not referenced anywhere
- **Two messaging services:**
  - "Low Volume Mixed A2P" (`MG1f82...`) — the one in our code
  - "Forbetra" (`MG2127...`) — **unused**
- **Set up by:** Me (Marc), Feb 22

### SMS is blocked — A2P campaign rejected

The Twilio A2P 10DLC campaign was **rejected** (error 30909):

> "The campaign submission has been reviewed and rejected due to issues verifying the Call to Action (CTA) provided for the campaign."

This means carriers block every outbound SMS. The brand registration is approved, but the campaign itself failed because Twilio couldn't verify our opt-in flow. All SMS messages since Feb 23 have been `undelivered` with error 30034 ("blocked by carrier").

**To fix:** One of us needs to log into the Twilio Console, go to Messaging > Compliance > US A2P 10DLC, and resubmit the campaign with:

- A live, publicly accessible URL showing the opt-in consent mechanism (e.g., the stakeholder feedback page with the SMS consent checkbox)
- Clearer description of how users consent to receive messages

### Decisions for our session

1. **Keep Postmark or drop it?** If we keep it, align the from-email. If not, remove the config and simplify.
2. **Drop the unused Twilio number** (`+16196481113`) and messaging service ("Forbetra" `MG2127...`) — saves money, reduces confusion.
3. **Who resubmits the A2P campaign?** This is the blocker for SMS delivery.

---

## Before the Meeting

- **Pull latest main** — make sure you have all 68 commits
- **Skim the expert panel review** — `docs/expert-panel-review.md`
- **Flag anything** — If you have local work I don't know about, bring it up first so we don't lose anything

Looking forward to it.

— Marc
