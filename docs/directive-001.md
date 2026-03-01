# Directive 001 — Shift from Usability Polish to Score-Moving Work

### From: Supervisory Agent | To: Development Agent | Date: March 1, 2026

---

## CONTEXT

A comprehensive 7-dimension evaluation has been completed (see `docs/supervisory-evaluation-framework.md`). You've done strong work on usability — moving it from 6.87 to 8.35. That dimension is now the healthiest one. But the platform score is **6.91 / 10.0** because five other dimensions are dragging it down hard.

**The usability work should pause.** Further usability polish yields diminishing returns. The biggest score gaps are elsewhere.

### Current Scores

| Dimension   | Score | Target |  Gap  |   Priority    |
| ----------- | :---: | :----: | :---: | :-----------: |
| Usability   | 8.35  |  9.5   | -1.15 | LOW (for now) |
| Simplicity  |  6.5  |  9.5   | -3.0  |   **HIGH**    |
| Efficacy    |  7.5  |  10.0  | -2.5  |   **HIGH**    |
| Stickiness  |  6.0  |  9.5   | -3.5  |   **HIGH**    |
| Virality    |  4.5  |  9.0   | -4.5  | **CRITICAL**  |
| Reliability |  7.5  |  9.5   | -2.0  |    MEDIUM     |
| Scalability |  5.0  |  8.5   | -3.5  | LOW (for now) |

---

## YOUR NEXT 6 TASKS (in priority order)

### TASK 1: Simplify Terminology (Simplicity +1.0, Usability +0.3)

**Effort: M | Impact: +0.23 platform points**

Do a global find-and-replace across ALL user-facing copy (UI text, emails, SMS, onboarding, tooltips). Backend/code variable names do NOT need to change — only what the user sees.

| Current Term        | Replace With                                                                                | Why                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Sub-objective       | Focus area                                                                                  | "Sub-objective" is academic jargon. Nobody outside coaching theory uses it.                                                                   |
| Stakeholder         | Rater (in individual context) / Feedback provider (in emails to the stakeholder themselves) | "Stakeholder" sounds corporate and cold. "Rater" is clear about what they do. In emails TO the stakeholder, "feedback provider" feels warmer. |
| Cycle               | Journey (user-facing)                                                                       | "Cycle" sounds mechanical. "Journey" connects to the identity/growth narrative.                                                               |
| Reflection          | Check-in                                                                                    | "Reflection" sounds like homework. "Check-in" sounds like a habit.                                                                            |
| Reveal scores       | Share your ratings                                                                          | "Reveal" sounds dramatic/manipulative. "Share" is collaborative.                                                                              |
| Stakeholder cadence | Feedback frequency                                                                          | Self-explanatory.                                                                                                                             |
| Cycle configuration | Set up your journey                                                                         | Nobody "configures a cycle."                                                                                                                  |

**Files to hit:**

- All `+page.svelte` files in `/src/routes/` (especially onboarding, individual, coach)
- `/src/lib/notifications/emailTemplates.ts`
- `/src/lib/notifications/smsTemplates.ts`
- `/src/lib/content/` (onboarding templates)
- Any component that renders user-facing labels

**Acceptance criteria:**

- Zero instances of "sub-objective," "stakeholder cadence," "cycle configuration," or "reveal scores" in any user-facing text
- "Stakeholder" replaced contextually (keep it in code/DB, replace in UI)
- "Cycle" replaced in UI labels and headings (keep in code/DB)
- All email templates updated
- Spot-check: read every onboarding step aloud. If any sentence sounds like a product spec rather than a conversation, rewrite it.

**Do NOT change:** Database column names, Prisma schema, TypeScript types, URL paths, or internal variable names. This is a copy change, not a refactor.

---

### TASK 2: AI Insight Specificity (Efficacy +1.0, Stickiness +0.3)

**Effort: S | Impact: +0.25 platform points**

The AI prompts in `/src/lib/server/ai/prompts.ts` need one critical upgrade: **every insight must end with a specific, behavioral, this-week action.**

**Current behavior:** Insights say things like "Consider how your effort patterns relate to your stakeholders' perceptions" or "Your trajectory shows improvement in consistency."

**Target behavior:** Every insight ends with a concrete sentence like:

- "This week, try asking your team for their recommendation before sharing yours."
- "Before your next 1:1, ask one direct report: 'What's one decision I should hand off to you?'"
- "In your Thursday meeting, practice waiting 10 seconds after asking a question before filling the silence."

**Implementation:**

In the system prompt for ALL insight types (CHECK_IN, WEEKLY_SYNTHESIS, COACH_PREP, CYCLE_REPORT), add this instruction:

```
CRITICAL: Every insight you generate MUST end with a specific, behavioral action the person can take THIS WEEK. Not "consider improving delegation" but "this week, identify one decision you currently make alone and ask your team lead to own it instead." The action must be:
1. Specific enough to visualize doing it
2. Small enough to do this week
3. Connected to the data patterns you just described
4. Phrased as an experiment, not a mandate ("Try..." or "This week, experiment with...")
```

Also add to the WEEKLY_SYNTHESIS prompt:

```
Begin your synthesis by referencing the person's identity anchor (who they said they are becoming in Week 1). Connect this week's patterns to that identity. Example: "You said you're becoming a leader who trusts their team. This week's data suggests [specific pattern]."
```

**Files to modify:**

- `/src/lib/server/ai/prompts.ts` — All prompt builder functions

**Acceptance criteria:**

- Generate a test insight using the updated prompts. It must contain a specific behavioral action.
- The identity anchor must appear in weekly synthesis insights.
- Coach prep must include suggested behavioral experiments the coach can propose.

---

### TASK 3: Identity Thread (Stickiness +1.0, Efficacy +0.5)

**Effort: S | Impact: +0.25 platform points**

The Week 1 "Identity Anchor" prompt asks users "Who are you becoming?" — this is psychologically powerful. But it's asked once and never referenced again. The identity statement should weave through the entire experience.

**Implementation:**

1. **Store the identity anchor response.** It's currently stored as a regular intention/reflection entry. Ensure it's easily retrievable — either tag it with a type field or query by the week-1 prompt heading.

2. **Surface it in 4 places:**

   a. **Weekly check-in page** — Small banner at top: _"Your identity: [their Week 1 answer]"_ — a gentle reminder before they rate themselves.

   b. **AI weekly synthesis** — Already addressed in Task 2 (prompt change). The AI will reference it.

   c. **Hub/Today view** — Below the objective card, a subtle line: _"Becoming: [identity anchor excerpt]"_

   d. **End-of-cycle report** — Opening line: _"12 weeks ago, you said you were becoming [identity anchor]. Here's what the data shows about that journey."_

3. **Mid-cycle identity reflection.** At the halfway point of any journey (e.g., week 6 of 12), present a special check-in prompt: _"In Week 1, you said you were becoming [X]. Does that still feel true? Has it evolved?"_ Store the updated response.

**Files to modify:**

- Server load function for check-in page — query the identity anchor
- Check-in page component — render the banner
- Individual hub/today component — render the identity line
- `/src/lib/server/ai/prompts.ts` — pass identity anchor as context to all prompt builders
- Check-in prompt rotation logic — add mid-cycle identity reflection

**Acceptance criteria:**

- Identity anchor is visible on the check-in page and the hub
- AI insights reference the identity anchor
- Mid-cycle identity reflection prompt triggers at the halfway point
- End-of-cycle report opens with the identity anchor

---

### TASK 4: Stakeholder Conversion Funnel (Virality +2.0)

**Effort: M | Impact: +0.20 platform points**

This is Forbetra's single biggest growth lever. Every individual invites 3-5 raters. Each rater interacts with the platform weekly. Currently, they leave after submitting feedback with zero invitation to become users themselves.

**Implementation:**

After a stakeholder has submitted feedback **3 or more times** (track via Feedback count for that stakeholder record), show a post-submission prompt:

**Screen: Post-feedback conversion prompt**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You've provided feedback 3 times now.
That means you care about [Individual's first name]'s growth.

What about yours?

Most leaders have blind spots they can't see.
Your colleagues could help you see yours —
the same way you're helping [Individual's first name].

[ Start My Own Journey → ]    [ Not now ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Technical approach:**

1. Count feedback submissions per stakeholder (query Feedback table grouped by stakeholder)
2. In the feedback form's `+page.server.ts`, pass `feedbackCount` to the page
3. In the post-submission "thank you" screen, conditionally render the conversion prompt when `feedbackCount >= 3`
4. "Start My Own Journey" links to `/sign-up?ref=stakeholder&from=[stakeholderId]`
5. Track the referral source so you can measure conversion rate later

**Do NOT:**

- Show this on the first or second feedback submission (too pushy)
- Make it a modal/blocker (it should be part of the thank-you flow, not interrupting)
- Require any signup before they can dismiss it

**Acceptance criteria:**

- Stakeholders see nothing extra on feedback 1-2
- On feedback 3+, the conversion prompt appears below the thank-you/reveal section
- The CTA links to sign-up with referral tracking
- "Not now" dismisses cleanly with no guilt
- The copy uses the individual's first name

---

### TASK 5: Variable Reward in Check-ins (Stickiness +1.5, Usability +0.2)

**Effort: M | Impact: +0.26 platform points**

The check-in experience is identical every time: same form, same buttons, same flow. By week 4, it's a chore. Duolingo, Wordle, and Apple Fitness succeed because the core interaction has variation built in.

**Implementation:**

After the user submits their check-in (on the success/confirmation screen), show ONE of these rotating micro-moments. Rotate weekly, not randomly — so the user gets a different one each week in a predictable sequence.

| Week Mod | Post-Check-in Micro-Moment                                                                                                                                                                                                                      |
| :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1     | **Insight Preview** — "Your AI insight for this week will be ready Sunday evening. Based on your recent pattern, here's a teaser: [1-sentence preview generated from score delta]"                                                              |
|    2     | **Rater Pulse** — "This week, [N] of your [total] raters have provided feedback. [Rater name] rated your effort [higher/lower] than you rated yourself." (Only show if feedback exists and reveal is enabled)                                   |
|    3     | **Streak Milestone** — Dynamic message based on streak length: "3 weeks consistent — you're building a habit." / "6 weeks — you're in the top 20% of committed leaders." / "10 weeks — your data is now rich enough for deep pattern analysis." |
|    4     | **Growth Signal** — "Compared to your first week, your [effort/performance] has [increased/decreased] by [X] points. [Contextual interpretation]."                                                                                              |
|    5     | **Identity Echo** — "Remember: you said you're becoming [identity anchor excerpt]. This week's check-in is one more data point proving it."                                                                                                     |
|    0     | **Coach Connection** — "Your coach [name] last noted: '[excerpt from most recent coach note]'. Your check-in data helps them prepare for your next session." (Only if coach exists and has notes)                                               |

**Technical approach:**

- Use `weekNumber % 6` to determine which micro-moment to show
- Each micro-moment needs its own data: query the relevant info in the server load function
- Render as a card below the success animation on the check-in confirmation
- If the required data for a micro-moment doesn't exist (e.g., no coach notes), fall back to the next one in sequence

**Files to modify:**

- Check-in confirmation/success view
- Check-in `+page.server.ts` — add queries for micro-moment data

**Acceptance criteria:**

- After check-in submission, a micro-moment card appears below the success animation
- The content is different each week (not random — deterministic by week number)
- Graceful fallback when data is missing
- Each micro-moment is genuinely informative, not decorative

---

### TASK 6: Progressive Disclosure (Simplicity +1.5, Stickiness +0.5, Usability +0.3)

**Effort: L | Impact: +0.30 platform points**

This is the highest-impact single initiative. Currently, a Day 1 user sees the same UI complexity as a Week 12 user. The individual hub shows 8-12 information zones regardless of how much data exists or how experienced the user is.

**Implementation:**

Define 3 maturity stages based on completed check-ins:

| Stage           | Check-ins | What's Visible                                                                                                                                           | What's Hidden                                           |
| --------------- | :-------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **New**         |    0-3    | Today view: next action card, objective, identity anchor, basic progress (completion %). Navigation: Today, Check-in, Raters.                            | Scorecard, Dashboard/Charts, Analytics, Ask AI, History |
| **Growing**     |   4-11    | Everything in New + Scorecard (unlocked with celebration), Dashboard with trend chart, Insights page. Navigation adds: Scorecard, Insights.              | Ask AI, History, Heat maps, Advanced metrics            |
| **Established** |    12+    | Full platform. All features visible. Navigation adds: Ask AI, History, Analytics. Heat maps, advanced metrics (Stability, Trajectory, Alignment) appear. | Nothing hidden                                          |

**How to unlock:**

- When a user hits check-in 4, show a brief celebration: "You've built enough data to unlock your Scorecard — see how your raters perceive you." Include a CTA to visit the scorecard.
- When a user hits check-in 12, show: "Your data is now deep enough for advanced analytics and AI conversation. Explore your full toolkit."
- Previously hidden nav items animate in (slide + fade) with a subtle "NEW" badge.

**Technical approach:**

1. Query completed check-in count in the individual layout's server load function
2. Pass `maturityStage` ("new" | "growing" | "established") to the layout
3. Conditionally render nav items based on maturity stage
4. On the hub page, conditionally render information zones based on maturity stage
5. Store "unlock seen" flags in localStorage or user preferences to avoid showing the celebration toast repeatedly

**Files to modify:**

- `/src/routes/individual/+layout.svelte` and `+layout.server.ts` — nav item visibility
- `/src/routes/individual/+page.svelte` and `+page.server.ts` — hub zone visibility
- Create a small unlock celebration component

**Acceptance criteria:**

- A brand-new user sees a clean, focused hub with 3 nav items
- At check-in 4, the scorecard unlocks with a celebration moment
- At check-in 12, the full platform unlocks
- A user who already has 12+ check-ins sees everything (no regression)
- The unlock moments feel rewarding, not punishing ("you earned this" not "we were hiding this")

---

## EXECUTION ORDER

Do these in order. Each one is independently shippable and testable.

```
Task 1 (Terminology)     ████░░░░  ~2-3 hours
Task 2 (AI Specificity)  ██░░░░░░  ~1 hour
Task 3 (Identity Thread) ███░░░░░  ~2 hours
Task 4 (Stakeholder CVR) ████░░░░  ~3 hours
Task 5 (Variable Reward) ████░░░░  ~3 hours
Task 6 (Prog Disclosure) ██████░░  ~4-5 hours
```

**After completing all 6, notify the supervisory agent for re-evaluation.** Expected platform score after Directive 001: **~8.40** (from 6.91).

---

## WHAT NOT TO DO

1. **Do not continue polishing usability.** The hub layout, coach session view, and other UX items are already at 8.35. Further polish there yields < 0.05 platform points per change. The score-moving work is in the 6 tasks above.

2. **Do not build enterprise features yet.** SSO, org model, SOC 2 — these matter but they're Tier 3. The product needs to be sticky and viral before it needs to be enterprise-ready.

3. **Do not add new features not on this list.** Every feature you don't build makes the product simpler. If you think something is missing, flag it for the supervisory agent rather than building it.

4. **Do not refactor code unless it blocks a task.** Code duplication, long files, missing tests — these are real issues but they don't move the platform score right now.

5. **Do not change database schema unless a task requires it.** The identity anchor storage (Task 3) might need a query approach but should work with existing schema.

---

## AFTER YOU'RE DONE

When all 6 tasks are complete:

1. Commit with a clear message per task (or group logically)
2. Deploy to Vercel
3. Tell Marc to ask the supervisory agent for a re-evaluation
4. The supervisory agent will re-score, update the score log, and issue Directive 002

---

_Directive 001 — Issued March 1, 2026_
_Supervisory Agent: Claude Opus_
_Target: Platform score 6.91 → 8.40_
