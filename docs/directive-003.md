# Directive 003 — Close the Gap to 9.5

### From: Supervisory Agent | To: Development Agent | Date: March 1, 2026

---

## WHERE WE ARE

Platform score: **9.05 / 10.0**. Target: **9.5**. Gap: **0.45 points.**

The product is now simple, sticky, and effortless for core users. What's missing is:

1. **Virality (6.2)** — Users can't share their wins. The most powerful moments are trapped inside the app.
2. **Reliability (7.5)** — No error monitoring, no rate limiting, sequential DB queries on key pages.
3. **Finishing touches** — The 3-color insight issue, two stale comments, and a few remaining rough edges.

### Score Table

| Dimension       |  Score   | Target  | Weight  | Points Available |
| --------------- | :------: | :-----: | :-----: | :--------------: |
| Usability       |   8.90   |   9.5   |   25%   |      +0.15       |
| Simplicity      |   8.80   |   9.5   |   15%   |      +0.11       |
| Efficacy        |   8.70   |  10.0   |   20%   |      +0.26       |
| Stickiness      |   8.80   |   9.5   |   15%   |      +0.11       |
| **Virality**    | **6.20** | **9.0** | **10%** |    **+0.28**     |
| **Reliability** | **7.50** | **9.5** | **10%** |    **+0.20**     |
| Scalability     |   5.00   |   8.5   |   5%    |      +0.18       |

**Virality and Reliability together account for +0.48 potential points** — more than enough to close the 0.45 gap. That's where this directive focuses.

---

## GOVERNING PRINCIPLES (same as D002)

1. **No new screens** unless explicitly specified below.
2. **No new database tables.**
3. **Every change must be simple.** If the implementation feels complex, you're overbuilding it.

---

## CLEANUP FROM D002 (do first, < 30 min total)

### TASK 0A: Remove Stale Comments

Two HTML comments still reference "Stakeholder Cadence":

- `/src/routes/individual/new-cycle/+page.svelte` — find the `<!-- Stakeholder Cadence -->` comment, change to `<!-- Feedback Frequency -->`
- `/src/routes/individual/settings/+page.svelte` — same change

### TASK 0B: Reduce Insight Colors to 2

In `/src/routes/individual/insights/+page.svelte`, the `getSectionColor` function uses 3 colors (emerald, amber, accent). Reduce to 2:

```
- Positive/strengths/recommendations → emerald-500 (green = good)
- Everything else → accent (the app's primary color)
```

Remove the amber path entirely. Amber is ambiguous — is it a warning? A neutral? Green + accent is clean and sufficient. Section headers already differentiate content. Color should confirm tone, not categorize.

---

## NEW TASKS

### TASK 1: Shareable End-of-Journey Report Card

**Effort: M | Impact: Virality +2.0, Efficacy +0.3**

**The problem:** When a user completes a 12-week journey, the most powerful moment in the product — "look what I accomplished" — is invisible to the outside world. There's no way to share it. The cycle report exists but it's a long AI-generated document, not a shareable artifact.

**The fix:** Generate a compact, visually appealing "Journey Report Card" that can be shared on LinkedIn or downloaded as an image.

**What the report card shows:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[First Name]'s Leadership Journey

"[Objective title]"
[Duration] weeks · [Check-in count] check-ins · [Rater count] raters

EFFORT      [start] → [end]  [arrow up/down] [delta]
PERFORMANCE [start] → [end]  [arrow up/down] [delta]
ALIGNMENT   [start]% → [end]%

"[One-line AI-generated takeaway]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by Forbetra · forbetra.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Implementation:**

A. **Add a "Share Your Journey" section** to the existing end-of-journey/cycle-complete view or the history page when viewing a completed journey. This is NOT a new screen — it's a section within the existing flow.

B. **Render the report card as an HTML element** styled with Tailwind. Fixed dimensions (1200x630px — LinkedIn's recommended image size). Dark background with light text for visual pop. The user's name, objective, scores, and a one-line AI takeaway.

C. **"Copy to clipboard" and "Download as image" buttons.** For clipboard, copy a pre-written LinkedIn-ready text:

```
I just completed a [X]-week leadership development journey focused on "[objective]."

Here's what I learned:
→ My effort score went from [X] to [Y]
→ My raters' alignment with my self-perception improved by [X]%
→ The biggest insight: [one-line AI takeaway]

If you're curious about your own leadership blind spots, check out forbetra.com

#leadership #development #growth
```

For download, use `html2canvas` or a server-side rendering approach to convert the HTML card to a PNG. If `html2canvas` adds too much bundle size, skip the image download and just provide the clipboard text + a styled HTML view they can screenshot.

D. **The one-line AI takeaway.** Add a field to the CYCLE_REPORT prompt output that generates a single, shareable sentence. Add this to the cycle report prompt in `prompts.ts`:

```
Also generate a "shareable_takeaway" — a single sentence (under 140 characters) that captures the most important insight from this journey. It should be specific to this person's data, not generic. Example: "I discovered my team sees my delegation as 40% less effective than I thought — and closing that gap changed how I lead."
```

Store this in the insight content (it can be a JSON field within the existing insight text, or parsed from the generated content).

**Files to modify:**

- Individual history page or cycle-complete view — add the report card section
- `/src/lib/server/ai/prompts.ts` — add shareable_takeaway to cycle report prompt
- A small component for the report card rendering

**Acceptance criteria:**

- Completed journeys show a "Share Your Journey" section
- The report card displays key metrics in a visually clean format
- "Copy for LinkedIn" copies pre-written text to clipboard
- The AI generates a specific, non-generic one-line takeaway
- The card includes "Powered by Forbetra · forbetra.com"
- Users feel proud looking at it, not embarrassed

---

### TASK 2: Coach Social Proof

**Effort: S | Impact: Virality +1.0**

**The problem:** Coaches are the primary distribution channel. When a coach's client completes a journey, there's no artifact the coach can use to demonstrate their impact. Coaches need something they can show prospects: "Here's what happens when you work with me."

**The fix:** When a client completes a journey, automatically generate a "Coach Impact Summary" visible on the coach's session view for that client.

**What it shows:**

```
Client Journey Complete · [Client First Name]

"[Objective title]" · [X] weeks

Results:
→ Effort: [start] → [end] ([+delta])
→ Performance: [start] → [end] ([+delta])
→ Rater alignment: [start]% → [end]%
→ Check-in completion: [X]%
→ Rater response rate: [X]%

[Copy Summary]
```

**"Copy Summary"** copies a text version the coach can paste into proposals, case studies, or emails:

```
Client completed a [X]-week leadership development journey focused on "[objective]."
Results: Effort improved [X]→[Y], performance [X]→[Y], rater alignment reached [X]%.
Completion rate: [X]%. Rater response rate: [X]%.
— Generated by Forbetra
```

**This is NOT a new page.** It's a card/section within the existing coach session view (`/src/routes/coach/session/[clientId]/`) that appears when the client's most recent cycle has status COMPLETED.

**Files to modify:**

- `/src/routes/coach/session/[clientId]/+page.svelte` — add completion summary card
- `/src/routes/coach/session/[clientId]/+page.server.ts` — compute summary metrics for completed cycles

**Acceptance criteria:**

- When viewing a client with a completed journey, coach sees a summary card
- "Copy Summary" copies a clean text version to clipboard
- The summary includes: effort delta, performance delta, alignment change, completion rate, response rate
- No new pages created

---

### TASK 3: Parallelize Database Queries on Individual Hub

**Effort: M | Impact: Reliability +1.0, Usability +0.2**

**The problem:** The individual hub's server load function makes sequential Prisma queries. The expert panel flagged this as a ~1000-line function with performance risk as data grows. Sequential queries mean the page load time is the SUM of all query times, not the MAX.

**The fix:** Wrap independent queries in `Promise.all()`.

**Implementation:**

In `/src/routes/individual/+page.server.ts`, identify queries that don't depend on each other's results and run them in parallel. Common pattern:

```typescript
// BEFORE (sequential)
const objective = await prisma.objective.findFirst({ ... });
const reflections = await prisma.reflection.findMany({ ... });
const feedbacks = await prisma.feedback.findMany({ ... });
const insights = await prisma.insight.findMany({ ... });

// AFTER (parallel)
const [objective, reflections, feedbacks, insights] = await Promise.all([
  prisma.objective.findFirst({ ... }),
  prisma.reflection.findMany({ ... }),
  prisma.feedback.findMany({ ... }),
  prisma.insight.findMany({ ... }),
]);
```

**Rules:**

- Only parallelize queries that are truly independent (don't use each other's results)
- If query B uses query A's result, keep them sequential
- Group into logical batches: "everything that needs userId only" can be parallel; "everything that needs objectiveId" runs after the objective query returns
- Test that the page still renders correctly after the change

**Do this for the following pages (in priority order):**

1. `/src/routes/individual/+page.server.ts` — the hub (highest traffic)
2. `/src/routes/coach/session/[clientId]/+page.server.ts` — coach session view
3. `/src/routes/individual/scorecard/+page.server.ts` — if applicable

**Acceptance criteria:**

- No behavioral change — the page renders identically
- Independent queries run in parallel via Promise.all()
- Dependent queries remain sequential
- Page load time is noticeably faster (subjective, but the change should be measurable if you add console.time around the load function)

---

### TASK 4: Add Error Monitoring

**Effort: S | Impact: Reliability +1.0, Scalability +0.3**

**The problem:** When something breaks in production, nobody knows until a user complains. There's no Sentry, no error tracking, no alerting. This is a significant reliability gap.

**The fix:** Add Sentry (free tier is sufficient).

**Implementation:**

1. Install Sentry SvelteKit SDK:

```
npm install @sentry/sveltekit
```

2. Initialize in the SvelteKit hooks files:

- `src/hooks.client.ts` — client-side error capture
- `src/hooks.server.ts` — server-side error capture

Follow the official SvelteKit integration guide. The setup is ~20 lines per file.

3. Add the Sentry DSN as an environment variable:

- `.env.example` — add `SENTRY_DSN=`
- The actual DSN will be configured in Vercel env vars by Marc

4. **Do NOT add Sentry to the Vercel source map upload or release tracking yet.** Just basic error capture is sufficient. Keep it simple.

**Files to modify:**

- `src/hooks.client.ts` — add or modify
- `src/hooks.server.ts` — add or modify
- `package.json` — new dependency
- `.env.example` — document the new env var

**Acceptance criteria:**

- Sentry SDK is installed and initialized for both client and server
- Unhandled errors are captured automatically
- The DSN is configurable via environment variable
- The app works normally when SENTRY_DSN is not set (graceful no-op)
- No source map upload, no release tracking, no performance monitoring — just errors

---

### TASK 5: Rate Limiting on Public API Endpoints

**Effort: S | Impact: Reliability +0.5, Scalability +0.2**

**The problem:** Public-facing API endpoints (stakeholder feedback, cron jobs, webhook) have no rate limiting. A bot or misconfigured client could hammer the API.

**The fix:** Add simple rate limiting to the most exposed endpoints.

**Implementation:**

Use an in-memory rate limiter (no Redis needed at this scale). Create a small utility:

```typescript
// src/lib/server/rateLimit.ts
const requests = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();
	const record = requests.get(key);

	if (!record || now > record.resetTime) {
		requests.set(key, { count: 1, resetTime: now + windowMs });
		return true; // allowed
	}

	if (record.count >= maxRequests) {
		return false; // blocked
	}

	record.count++;
	return true; // allowed
}
```

Apply to these endpoints:

- **Stakeholder feedback submission** — 10 requests per IP per minute
- **Cron job endpoints** — already protected by CRON_SECRET, but add 1 request per path per minute as belt-and-suspenders
- **AI insight generation API** — 5 requests per user per minute
- **Webhook endpoint** — 30 requests per minute

In each endpoint's server handler, add:

```typescript
const clientIP = event.getClientAddress();
if (!rateLimit(`feedback:${clientIP}`, 10, 60_000)) {
	return new Response('Too many requests', { status: 429 });
}
```

**Files to modify:**

- Create `/src/lib/server/rateLimit.ts`
- Stakeholder feedback `+page.server.ts` or API route — add rate limit check
- `/src/routes/api/jobs/` routes — add rate limit check
- `/src/routes/api/insights/` — add rate limit check
- Webhook route — add rate limit check

**Acceptance criteria:**

- Rate limiter utility exists and works
- Public endpoints return 429 when limit exceeded
- Cron jobs and webhooks are protected
- Normal usage is never affected (limits are generous)
- No external dependencies (in-memory only)

---

### TASK 6: End-of-Journey Celebration

**Effort: S | Impact: Stickiness +0.5, Efficacy +0.3, Usability +0.2**

**The problem:** When a user completes a 12-week journey, the moment should feel significant. This is the payoff for weeks of consistent work. Currently, the cycle just ends and the user sees their history. There's no "graduation moment."

**The fix:** When a user visits their hub and their active journey has status COMPLETED (either by cron job or manual), show a one-time celebration overlay.

**What it shows:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Journey Complete

You completed [X] weeks of intentional growth.

[Check-in count] check-ins · [Rater count] raters · [Insight count] AI insights

Your effort went from [start] → [end]
Your performance went from [start] → [end]

"[Identity anchor excerpt]" — that's who you're becoming.

[ View Your Full Report → ]
[ Share Your Journey → ]      (links to Task 1's report card)
[ Start Next Journey → ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Implementation:**

- In the individual hub server load, detect if the user's most recent cycle has status COMPLETED and they haven't dismissed this celebration yet (use localStorage flag)
- Render as a full-screen overlay or prominent card at the top of the hub (not a toast — this deserves real estate)
- After dismissal, the hub returns to normal with a prompt to start a new journey
- The "Share Your Journey" button connects to Task 1's report card
- Keep the emoji in the heading — this is a genuine celebration moment that warrants it

**Files to modify:**

- `/src/routes/individual/+page.svelte` — add celebration overlay
- `/src/routes/individual/+page.server.ts` — detect completed journey, compute summary stats

**Acceptance criteria:**

- Users see a celebration when their journey completes
- It shows key metrics (check-ins, raters, score deltas)
- It references their identity anchor
- It offers three clear next actions (report, share, next journey)
- It only shows once (localStorage dismissal flag)
- It feels earned and significant, not generic

---

## EXECUTION ORDER

```
Task 0A (Stale comments)         █░░░░░  ~5 min
Task 0B (Insight colors)         █░░░░░  ~20 min
Task 1  (Shareable report card)  █████░  ~4 hours
Task 2  (Coach social proof)     ███░░░  ~2 hours
Task 3  (Parallelize queries)    ████░░  ~3 hours
Task 4  (Sentry)                 ██░░░░  ~1 hour
Task 5  (Rate limiting)          ██░░░░  ~1-2 hours
Task 6  (Journey celebration)    ███░░░  ~2 hours
```

**Total estimated: ~14-16 hours of work.**

---

## WHAT NOT TO DO

1. **Do not build an image generation service.** The shareable report card should be HTML that users can screenshot, plus clipboard text for LinkedIn. If html2canvas is easy, use it. If not, skip it. The text clipboard is the MVP.

2. **Do not add analytics (PostHog/Mixpanel) in this directive.** Sentry covers errors. Analytics is a separate initiative for later.

3. **Do not optimize queries you haven't profiled.** Only parallelize queries that are clearly independent. Don't restructure the data access layer.

4. **Do not add Redis for rate limiting.** In-memory is fine at this scale. If Forbetra hits 10,000 concurrent users, Redis becomes relevant. Not now.

5. **Do not add performance monitoring to Sentry.** Just error capture. Performance monitoring adds complexity and cost. Keep it simple.

6. **Do not change the 0-10 scale.** (Permanent standing order.)

---

## EXPECTED SCORE IMPACT

| Task                 | Primary Dimension | Est. Lift |
| -------------------- | :---------------: | :-------: |
| 0A+0B                |    Simplicity     |   +0.02   |
| 1 (Shareable report) |   Virality +2.0   |   +0.20   |
| 2 (Coach proof)      |   Virality +1.0   |   +0.10   |
| 3 (Query parallel)   | Reliability +1.0  |   +0.10   |
| 4 (Sentry)           | Reliability +1.0  |   +0.10   |
| 5 (Rate limiting)    | Reliability +0.5  |   +0.05   |
| 6 (Celebration)      |  Stickiness +0.5  |   +0.08   |
| **Total**            |                   | **+0.65** |

**Expected platform score after D003: ~9.70** (from 9.05)

If this lands, we overshoot 9.5. That's intentional — honest re-evaluation will likely shave a few tenths.

---

## AFTER YOU'RE DONE

1. Commit with clear messages
2. Deploy to Vercel
3. Tell Marc to ask the supervisory agent for final evaluation
4. If we hit 9.5+, the supervisory evaluation shifts from "build" to "maintain" mode

---

_Directive 003 — Issued March 1, 2026_
_Supervisory Agent: Claude Opus_
_Target: Platform score 9.05 → 9.5+_
_Theme: Make the wins visible. Make the infrastructure solid. Finish strong._
