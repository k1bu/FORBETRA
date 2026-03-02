# Directive 004 — Push to 9.5

### From: Supervisory Agent | To: Development Agent | Date: March 1, 2026

---

## WHERE WE ARE

Platform score: **8.75 / 10.0**. Target: **9.5**. Gap: **0.75 points.**

D003 delivered strong gains in Virality (+2.1) and Reliability (+1.55). But 0.75 is a large gap, and the remaining improvements must come from everywhere:

1. **Scalability (5.5)** — Zero tests, zero CI, no data export. The biggest single-dimension deficit.
2. **Virality (8.3)** — Report card exists but shared links show blank previews. No image download. No growth narrative.
3. **Efficacy (8.9)** — The product tracks behavior but doesn't tell users what to DO next or narrate their growth.
4. **Usability (9.05)** — Missing loading states, empty states, mobile polish. Paper cuts compound.
5. **Simplicity (8.85)** — No error boundaries. Inconsistent empty states across pages.

### Score Table

| Dimension       | Current  |  Target  | Weight  | Points Available |
| --------------- | :------: | :------: | :-----: | :--------------: |
| Usability       |   9.05   |   9.70   |   25%   |      +0.16       |
| Simplicity      |   8.85   |   9.35   |   15%   |      +0.08       |
| Efficacy        |   8.90   |   9.55   |   20%   |      +0.13       |
| Stickiness      |   9.10   |   9.55   |   15%   |      +0.07       |
| **Virality**    | **8.30** | **9.30** | **10%** |    **+0.10**     |
| Reliability     |   9.05   |   9.50   |   10%   |      +0.05       |
| **Scalability** | **5.50** | **8.00** | **5%**  |    **+0.13**     |

**Total estimated lift: +0.72 → Platform: ~9.47**

> **Honest note on the math:** Reaching exactly 9.5 requires near-ceiling scores across ALL seven dimensions simultaneously. Scalability is structurally capped without enterprise features (SSO, multi-tenancy, audit logs) — which are explicitly excluded from this directive. The realistic target is **9.40–9.50**. Whether we land above or below 9.5 depends on execution quality and honest scoring.

---

## GOVERNING PRINCIPLES

1. **No new database tables** unless explicitly specified.
2. **Tests for every new module.** Every utility, schema, and API endpoint gets at least one test.
3. **Consumer-grade polish.** Loading states, empty states, error handling — every path a user takes should feel intentional.
4. **Ship what matters.** If a task is taking too long, ship the 80% version and move on.

---

## TASKS

### TASK 1: Test Infrastructure + Foundation Tests

**Effort: L | Impact: Scalability +1.5, Reliability +0.2**

**The problem:** Zero tests. Zero CI. Every deployment is a leap of faith. Scalability is stuck at 5.5 because there's no safety net for refactoring or onboarding new developers.

**What to build:**

1. Install and configure **Vitest** + `@testing-library/svelte` + `jsdom`
2. Create `vitest.config.ts` with SvelteKit path aliases (`$lib`, `$env`, etc.)
3. Write unit tests for:
   - `$lib/server/rateLimit.ts` — window expiry, limit enforcement, independent keys
   - `$lib/utils/phone.ts` — validation and normalization edge cases
   - `$lib/validation/feedback.ts` — schema acceptance and rejection
   - `$lib/notifications/emailTemplates.ts` — all templates return valid subject + html
   - `$lib/notifications/smsTemplates.ts` — all templates return non-empty strings
4. Create `.github/workflows/ci.yml`:
   - Trigger on: push to main, pull requests
   - Steps: checkout → install → prisma generate → lint → type-check → test → build
5. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`

**Acceptance criteria:**

- `npm test` runs and passes
- CI workflow file is valid and would run on GitHub Actions
- Minimum **15 test cases** covering the above modules

---

### TASK 2: Consumer Polish Pass

**Effort: L | Impact: Usability +0.50, Simplicity +0.40, Reliability +0.20**

**The problem:** Pages load with blank flashes. Empty lists show nothing helpful. AI errors cascade to page-level failures. Mobile rating inputs are fiddly. These paper cuts compound into a "not quite ready" feeling that caps every dimension.

**What to build:**

1. **Skeleton loading component** — `$lib/components/Skeleton.svelte`
   - Variants: `line`, `card`, `stat`, `chart` (via a `variant` prop)
   - Animated pulse effect (Tailwind's `animate-pulse` on gray bars)
   - Apply to: individual hub data sections, insights page, coach roster, coach session view

2. **Error boundary component** — `$lib/components/ErrorBoundary.svelte`
   - Wraps content, catches rendering errors, shows friendly "Something went wrong" + retry button
   - Apply to: AI-powered sections (hub summary, insights page, coach prep) where API failures shouldn't crash the page

3. **Empty state component** — `$lib/components/EmptyState.svelte`
   - Props: `icon`, `title`, `description`, `actionLabel?`, `actionHref?`
   - Apply to all empty-list scenarios:
     - No reflections yet → "Complete your first check-in to see your progress"
     - No feedback yet → "Your raters haven't submitted feedback yet"
     - No insights yet → "Insights are generated after your first full week"
     - No stakeholders → "Add raters to get 360 feedback"
     - No clients (coach) → "Invite your first client to get started"

4. **Mobile touch targets** — Audit all interactive elements for 44×44px minimum
   - Rating input buttons (effort/performance number selectors)
   - Navigation links and tab targets
   - Form submit buttons and CTAs

**Acceptance criteria:**

- Every data-loading section shows a skeleton while awaiting server data
- Every list/feed has an empty state with a clear next action
- AI section failures show retry UI, not a blank or crashed page
- All tap targets meet 44×44px minimum on mobile viewports

---

### TASK 3: Growth Story Page

**Effort: L | Impact: Efficacy +0.40, Stickiness +0.30, Virality +0.30**

**The problem:** Completing a 12-week journey is the most significant moment in the product. But the only artifact is a long AI-generated cycle report — useful for coaches, not shareable or emotionally resonant for individuals. There's no visual, personal, "look what I accomplished" page.

**Where:** `/individual/journey/[cycleId]` — new route, loads data from existing tables only.

**What it shows:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[First Name]'s Growth Story

"[Objective Title]"
[Duration] weeks · [Check-in count] check-ins · [Rater count] raters
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Progress
[Line chart: Effort + Performance scores over time, dual lines]

         Start  →  End
Effort:    [N]  →  [N]   (+/- change)
Perform:   [N]  →  [N]   (+/- change)

Key Moments
• Week [N]: "[Biggest perception gap or insight]"
• Week [N]: "[Score inflection point or rater observation]"

What Your Raters Said
"[Highest-value rater comment #1]"
— [Rater first name], Week [N]

"[Highest-value rater comment #2]"
— [Rater first name], Week [N]

Your Identity Anchor
"[Identity anchor text from AI insights]"

[Download Image]  [Share on LinkedIn]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Data sources (all existing tables):**

- `Reflection` — effort/performance scores over time, check-in dates
- `Feedback` — rater comments and scores
- `AiInsight` — identity anchor (from cycle report or latest insight)
- `Cycle` + `Objective` — title, duration, start/end dates
- `Stakeholder` — rater count

**Data helper:** Create `$lib/server/growthStory.ts` — aggregates all data for a completed cycle into a typed object. Write **3+ tests** for this helper (score trend calculation, comment selection logic, edge case with no feedback).

**Link from:**

- Celebration overlay → "View Report" CTA (update the href)
- Individual hub → visible link when cycle is completed
- Auth check: only the cycle's owner can view

---

### TASK 4: Social Meta + Image Export

**Effort: M | Impact: Virality +0.70**

**The problem:** Sharing a Forbetra link on LinkedIn or Slack shows a blank preview — no title, no image, no description. The report card from D003 exists but can't be downloaded as an image. These are the last missing pieces for organic sharing.

**What to build:**

1. **Open Graph meta tags** — In the root `+layout.svelte`:

   ```html
   <svelte:head>
   	<meta property="og:site_name" content="Forbetra" />
   	<meta property="og:title" content="{pageTitle}" />
   	<meta
   		property="og:description"
   		content="Leadership development powered by continuous 360° feedback"
   	/>
   	<meta property="og:image" content="{origin}/og-default.png" />
   	<meta property="og:type" content="website" />
   	<meta name="twitter:card" content="summary_large_image" />
   </svelte:head>
   ```

   - Create a static `og-default.png` (1200×630px) in `/static/`. Clean card: Forbetra wordmark + tagline on brand-colored background. Can be a simple design — just needs to not be blank.
   - Growth story page overrides `og:title` with "[Name]'s Leadership Growth Story" and `og:description` with the objective title.

2. **Image export** — On the growth story page:
   - Install `html-to-image` (lighter and more reliable than html2canvas)
   - "Download Image" button captures the story container → triggers PNG download
   - "Share on LinkedIn" button → opens `https://www.linkedin.com/sharing/share-offsite/?url={encodedUrl}`
   - Ensure the captured area has proper padding, no UI chrome, and Forbetra branding

**Acceptance criteria:**

- Pasting any Forbetra URL in Slack/LinkedIn shows a rich preview (image + title + description)
- Growth story page has working "Download Image" and "Share on LinkedIn" buttons
- Downloaded PNG is clean (no scrollbars, no browser chrome, proper padding)

---

### TASK 5: Weekly Action Card

**Effort: S | Impact: Efficacy +0.30, Stickiness +0.20**

**The problem:** The individual hub shows data — scores, rater counts, streak — but doesn't answer the most important question: "What should I do THIS WEEK?" The insights page has detailed analysis, but the hub — where users land — needs a single, clear, actionable prompt.

**What to build:**

A card at the top of the individual hub, before other content:

```
┌─────────────────────────────────────────┐
│  This Week's Focus                       │
│                                          │
│  "Try paraphrasing what others say       │
│   before responding in your next         │
│   team meeting."                          │
│                                          │
│  Based on your Week 3 feedback           │
│  View Full Insights →                    │
└─────────────────────────────────────────┘
```

**Implementation:**

- Extend the hub summary API (`/api/insights/hub-summary`) response to include `weeklyAction: string | null`
- Update the AI prompt to append: "Finally, provide a single concrete behavioral action for this week in 1-2 sentences. Start with an action verb. Be specific enough to act on TODAY."
- In the hub page, render the action card above the reflection status card
- If no insight exists yet, show: "Complete your first check-in to get a personalized weekly action"
- If cycle is completed, show: "Journey complete! View your growth story →"

**Tests:** 1 test verifying the prompt template includes the action extraction instruction.

---

### TASK 6: Behavioral Gap Narrative

**Effort: S | Impact: Efficacy +0.30**

**The problem:** When there's a large perception gap (self-rating vs rater average ≥ 2 points), the product shows the numbers but doesn't explain what they MEAN. "Effort: Self 8, Raters 5" is data. "Your team may not see the effort you're putting in — consider making your work more visible" is insight.

**Where:** Individual insights page, below the perception gap data.

**What to build:**

1. Create a gap calculation utility in `$lib/utils/gapNarrative.ts`:
   - Takes self scores and average rater scores
   - Returns `{ dimension: 'effort' | 'performance', selfScore: number, raterAvg: number, gap: number }[]` for gaps ≥ 2
   - Returns empty array if no significant gaps

2. In the insights page load function:
   - Calculate gaps using the utility
   - If any gap ≥ 2, call AI with a focused prompt:

     ```
     The participant rated their {dimension} as {self}/10.
     Their raters averaged {avg}/10 — a gap of {gap} points.

     In exactly 2 sentences:
     (1) What might this gap mean in terms of observable workplace behavior?
     (2) What is one specific, actionable thing they could try this week?
     ```

   - Display as a highlighted callout card below the gap visualization

3. **If gap < 2, show nothing.** Silence is better than noise.

4. **Cache:** Store the narrative in the existing `AiInsight` record (or alongside it) to avoid redundant AI calls on page reload.

**Tests:** 2 tests — gap calculation with various score combinations, prompt template formatting.

---

### TASK 7: Coach Session View Tabs

**Effort: S | Impact: Usability +0.15**

**The problem:** The coach session view (`/coach/session/[id]`) puts everything on a single scrollable page: overview, data, rater feedback, notes. Coaches with multiple clients need faster navigation between sections.

**What to build:**

Client-side tab bar with three tabs:

- **Overview** — Reflection summary, current scores, AI-generated action items
- **Data** — Charts (score trends, perception gap), rater score breakdown, historical comparison
- **Notes** — Session notes textarea (auto-saved, persisted to DB if notes field exists, otherwise localStorage)

**Implementation:**

- Simple `$state`-based tab switcher — no route changes, no server round-trips
- Sync active tab to URL hash (`#overview`, `#data`, `#notes`) for deep linking
- Read hash on mount to restore tab position
- Default to Overview tab

**Acceptance criteria:**

- Tabs switch instantly (no loading, no flicker)
- URL hash updates on tab change
- Direct link to `#data` opens the Data tab
- Browser back button navigates between tabs

---

### TASK 8: Data Export

**Effort: S | Impact: Scalability +1.0**

**The problem:** Users can't export their own data. This is a basic expectation for any platform, a GDPR consideration, and a Scalability gap. User data is locked inside Forbetra.

**Where:** Individual settings page — add a "Your Data" section.

**What to build:**

1. New API endpoint: `GET /api/export/my-data`
   - Requires authenticated individual user
   - Rate limited: 2 requests per hour per user
   - Returns JSON:
     ```json
     {
       "exportedAt": "2026-03-01T...",
       "user": { "name", "email", "role", "createdAt" },
       "cycles": [{ "label", "objective", "startDate", "endDate", "status" }],
       "reflections": [{ "weekNumber", "effortScore", "performanceScore", "checkInDate" }],
       "feedbackReceived": [{ "weekNumber", "effortScore", "performanceScore", "comment", "submittedAt" }],
       "insights": [{ "type", "summary", "generatedAt" }]
     }
     ```
   - **Exclude:** Rater emails, rater IDs, internal record IDs, coach-only data
   - Set `Content-Disposition: attachment; filename="forbetra-export.json"` header

2. UI: Button in settings → "Download My Data"
   - Brief description: "Download all your reflections, feedback, and insights as a JSON file."

**Tests:** 2 tests — exported data shape validation, sensitive field exclusion check.

---

## TASK ORDER

Execute in this order for maximum efficiency:

```
1. Task 1  (Test Infrastructure)     — Foundation, everything after gets tested
2. Task 2  (Polish Pass)             — Components used by later tasks
3. Task 5  (Action Card)             — Small, quick Efficacy win
4. Task 6  (Gap Narrative)           — Small, quick Efficacy win
5. Task 3  (Growth Story)            — Larger feature, uses Skeleton/EmptyState from T2
6. Task 4  (Social Meta + Export)    — Depends on growth story existing
7. Task 7  (Coach Tabs)              — Independent, clean UI improvement
8. Task 8  (Data Export)             — Independent, ships last
```

---

## ESTIMATED OUTCOME

| Dimension   | Before | After | Change | Weighted |
| ----------- | :----: | :---: | :----: | :------: |
| Usability   |  9.05  | 9.70  | +0.65  |  +0.16   |
| Simplicity  |  8.85  | 9.35  | +0.50  |  +0.08   |
| Efficacy    |  8.90  | 9.55  | +0.65  |  +0.13   |
| Stickiness  |  9.10  | 9.55  | +0.45  |  +0.07   |
| Virality    |  8.30  | 9.30  | +1.00  |  +0.10   |
| Reliability |  9.05  | 9.50  | +0.45  |  +0.05   |
| Scalability |  5.50  | 8.00  | +2.50  |  +0.13   |

**Projected composite: ~9.47**

Gap remaining to 9.5: **~0.03–0.05** — within margin of execution quality.

> **What would close the final gap:** Pushing Scalability above 8.0 requires enterprise features (SSO, multi-tenancy, audit logs) — explicitly excluded from scope. Alternatively, pushing Usability or Efficacy to 9.8+ requires sustained real-user testing and iteration cycles. This directive gets the product to consumer-grade excellence in every dimension that doesn't require organizational infrastructure.

---

## COMMIT CHECKPOINTS

Commit after each natural breakpoint:

1. After Task 1 — test infrastructure passes
2. After Tasks 2 + 5 + 6 — polish + quick wins
3. After Tasks 3 + 4 — growth story + social sharing
4. After Tasks 7 + 8 — coach tabs + data export

---

_Directive 004 — March 1, 2026_
_8 tasks · 4 commit checkpoints_
_Constraint: No enterprise/SSO. Must include tests. Close the gap._
