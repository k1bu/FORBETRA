# Directive 002 — Reduce Friction, Protect the Loop

### From: Supervisory Agent | To: Development Agent | Date: March 1, 2026

---

## GOVERNING PRINCIPLE

**The product dies if two things happen: raters stop responding, or individuals stop checking in.** Everything in this directive is designed to prevent those two deaths. If a task adds complexity, reject it. If a task makes any interaction longer, reject it. Simpler always wins.

### Three Non-Negotiable Rules for This Directive

1. **No new screens.** Do not create new pages. Modify existing ones.
2. **No new database tables.** Work within the existing schema.
3. **Every change must make an interaction shorter, not longer.** If you can't measure the reduction, don't ship it.

---

## CURRENT SCORE: 8.10 / 10.0

| Dimension   | Score | Target | Priority This Directive |
| ----------- | :---: | :----: | :---------------------: |
| Usability   | 8.50  |  9.5   |         MEDIUM          |
| Simplicity  | 6.80  |  9.5   |      **CRITICAL**       |
| Efficacy    | 8.30  |  10.0  |          HIGH           |
| Stickiness  | 7.50  |  9.5   |      **CRITICAL**       |
| Virality    | 6.00  |  9.0   | LOW (already addressed) |
| Reliability | 7.50  |  9.5   |           LOW           |
| Scalability | 5.00  |  8.5   |           LOW           |

---

## UNFINISHED FROM DIRECTIVE 001

Before starting new work, finish what's incomplete.

### TASK 0A: Complete Terminology Cleanup

**Status from D001: PARTIAL | Remaining effort: S**

The terminology change was half-done. Users now encounter BOTH "stakeholder" and "rater," BOTH "cycle" and "journey." This is worse than before — it's inconsistent.

**Do this:**

1. Search every file in `/src/routes/` and `/src/lib/notifications/` and `/src/lib/content/` for user-facing instances of these terms
2. Replace systematically:

| Find (user-facing only)                   | Replace with       |
| ----------------------------------------- | ------------------ |
| stakeholder cadence                       | feedback frequency |
| Stakeholder Cadence                       | Feedback Frequency |
| stakeholder (when visible to individuals) | rater              |
| stakeholder (in emails TO the rater)      | feedback provider  |
| cycle (in headings, labels, buttons)      | journey            |
| reflection (in headings, labels, buttons) | check-in           |
| Sub-objective (in error messages)         | Focus area         |

3. Do NOT rename: database fields, TypeScript types, URL paths, variable names, Prisma queries.
4. After replacing, do a final grep for each old term in `*.svelte` and `*Templates.ts` files and confirm zero user-facing hits remain.

**Acceptance criteria:** A user going through the entire app — onboarding, check-ins, scorecard, settings, emails — encounters ONE vocabulary, not two.

---

### TASK 0B: Add Mid-Cycle Identity Reflection

**Status from D001: NOT DONE | Effort: S**

At the halfway point of a journey, the regular check-in prompt should be replaced with a special identity reflection:

**Implementation:**
In the check-in page server load function, after determining the current week number and total weeks:

```
if (weekNumber === Math.ceil(totalWeeks / 2)) {
  // Override the regular rotating prompt with:
  // Title: "Midpoint Reflection"
  // Prompt: "In Week 1, you said you were becoming: '[identity anchor]'.
  //          Halfway through your journey — does that still feel true?
  //          Has it evolved? Write what feels right now."
}
```

This replaces the standard prompt for that one week. It's not additional — it's a substitution. The user still does their effort + performance ratings. Only the intention prompt changes.

**Acceptance criteria:** At the midpoint week, the intention prompt references the user's Week 1 identity anchor and asks them to reflect on it.

---

## NEW TASKS

### TASK 1: Reframe the Rater Experience from "Judging" to "Helping"

**Effort: M | Impact: Stickiness +0.5, Efficacy +0.3, Simplicity +0.2**

**The problem:** Rating someone's effort and performance on a 0-10 scale feels like an evaluation. Busy executives will resist this. They don't want to be judges. They're doing a favor, and the app should make that feel good, not burdensome.

**The fix:** Change the framing, not the mechanics. The 0-10 scale stays. What changes is the emotional wrapper.

**A. Rewrite the feedback form header copy**

Current (approximately): "Rate [Name]'s effort and performance"

Replace with:

```
Help [Name] see what you see.

[Name] is working on [objective title] and has asked for your honest perspective.
Your ratings help reveal blind spots they can't see on their own.

This takes about 60 seconds.
```

**B. Rewrite the scale labels**

Current effort labels: "Rarely intentional" → "Relentless commitment"
Current performance labels: (similar academic/evaluative tone)

These labels should feel like observations, not judgments:

**Effort scale context line** (above the buttons):

```
How much intentional effort have you noticed from [Name] on [objective] recently?
```

**Performance scale context line:**

```
How effectively is [Name] performing on [objective] from your perspective?
```

Keep the 0-10 buttons. Remove or soften the endpoint labels. The numbers speak for themselves. If labels are needed, use:

- 0: "Not at all"
- 5: "Moderately"
- 10: "Exceptionally"

Three labels. Not eleven. The intermediate numbers don't need words.

**C. Rewrite the optional comment prompt**

Current: (generic textarea placeholder)

Replace with:

```
Anything specific you've noticed? (optional, 1-2 sentences is plenty)
```

The word "specific" guides better feedback. "1-2 sentences is plenty" gives permission to be brief.

**D. Rewrite the post-submission message**

Current: (thank you + score reveal)

Add one line before the reveal:

```
Thank you. Your perspective matters more than you know.
```

**Files to modify:**

- `/src/routes/stakeholder/feedback/[token]/+page.svelte` — form copy, labels, placeholder, thank-you text

**Acceptance criteria:**

- The feedback form feels like helping a colleague, not evaluating them
- Scale endpoint labels are simplified to 3 anchor points max (0, 5, 10)
- The comment prompt says "1-2 sentences is plenty"
- Total word count on the feedback page is REDUCED, not increased (remove verbose explanations, replace with concise framing)

---

### TASK 2: Make the Individual Check-in Feel Effortless

**Effort: S | Impact: Stickiness +0.8, Simplicity +0.5**

**The problem:** By week 6, rating yourself 0-10 on effort and performance feels like a chore. The form is well-designed but it's still a form. 2-3 times per week for 12 weeks = up to 36 times doing the same thing.

**The fix:** Two changes that make each check-in faster and more rewarding.

**A. Add "Same as last time" shortcut**

Below each rating grid (effort and performance), if the user has a previous check-in, show:

```
[Same as last week: 7]
```

This is a single clickable chip/button that pre-fills the rating. The user can still tap any other number to override. But for the ~40% of check-ins where nothing changed dramatically, this turns two decisions into zero decisions.

**Implementation:** The previous rating is already loaded (the form shows "Your last rating: X"). Convert this from a display-only label into a clickable element that selects that score.

**B. Auto-advance after both ratings**

Currently: User rates effort → rates performance → manually clicks Submit.

Change to: User rates effort → rates performance → form auto-submits after a 1.5-second pause with a visual countdown ring. Show: "Submitting in 2... 1..." with a "Wait, add a note" link that cancels the auto-submit and reveals the notes field.

This eliminates one tap (the Submit button) and frames notes as optional-by-default rather than a field you have to consciously skip.

**If auto-submit feels too aggressive**, a softer alternative: After both ratings are selected, visually emphasize the Submit button with a pulse animation and auto-scroll it into view. Keep the manual tap but make it obvious and immediate. The notes field stays collapsed with an "Add a note (optional)" toggle.

**Use your judgment on which approach feels right.** The auto-submit is bolder and faster. The emphasized-submit is safer. Either way, the goal is: **two taps and done** for users who don't want to write notes.

**Files to modify:**

- `/src/routes/reflections/checkin/+page.svelte` — add "same as last" chip, modify submit flow

**Acceptance criteria:**

- "Same as last week" chip appears when previous data exists
- Clicking it selects that rating instantly
- The check-in can be completed in 2 taps + submit (or 0 taps + auto-submit if both are "same")
- Notes are clearly optional, not a field you have to skip past
- The entire check-in takes < 30 seconds for a returning user who hasn't changed much

---

### TASK 3: Reduce the Rater's Time Commitment

**Effort: S | Impact: Stickiness +0.3, Simplicity +0.3, Efficacy +0.2**

**The problem:** Raters are asked to provide feedback every week (or biweekly). Even at 60 seconds, that's a lot of asks. If they feel like it's the same thing every time, they'll start ignoring the emails.

**The fix:** Make the repeated experience feel lighter, not heavier.

**A. Show their last ratings as default**

When a returning rater opens the feedback form, pre-select their previous ratings. Show a clear label:

```
Your ratings from last time are shown below.
Adjust anything that's changed, or tap Submit if things look about the same.
```

This turns a 60-second task into a 10-second task for raters who don't see significant change week-to-week. They review, confirm, submit. Done.

**Implementation:** The previous ratings are already loaded in the feedback form (the code queries past feedback). Currently they're displayed as reference. Change them to be the pre-selected default values on the 0-10 grids.

**B. Make the comment field genuinely optional**

Remove the comment textarea from the default view. Replace with:

```
[+ Add a comment]  (tap to expand)
```

Most raters leave the comment blank anyway. Showing an empty textarea creates pressure to write something. Hiding it behind a tap removes that pressure.

**C. Reduce the email reminder copy**

The stakeholder feedback reminder email should be SHORT. Busy executives delete long emails. Target:

```
Subject: Quick feedback for [Name]

[Name] would value your perspective this week.

[Rate now →]  (takes ~30 seconds)
```

That's it. No paragraphs explaining the process. No context about objectives. They know what this is by week 3. Respect their time by respecting their inbox.

Note: The FIRST email (initial invitation) should still have full context. Only RECURRING reminders should be this brief.

**Files to modify:**

- `/src/routes/stakeholder/feedback/[token]/+page.svelte` — pre-select previous ratings, collapse comment field
- `/src/routes/stakeholder/feedback/[token]/+page.server.ts` — ensure previous ratings are passed to page
- `/src/lib/notifications/emailTemplates.ts` — shorten recurring feedback reminder emails

**Acceptance criteria:**

- Returning raters see their previous ratings pre-selected
- "Adjust or confirm" framing is clear
- Comment field is collapsed by default (expandable on tap)
- A returning rater who sees no change can submit in < 15 seconds
- Recurring feedback reminder emails are 3 lines max (subject + one sentence + CTA)

---

### TASK 4: Simplify the New Journey Form

**Effort: M | Impact: Simplicity +1.0, Usability +0.3**

**The problem:** Starting a new journey (cycle) requires filling out a long form: objective mode, cycle name, start date, duration, check-in days, feedback reminder days, reveal toggle, stakeholder cadence. No progress indicator. No preview. Expert panel called this a Major issue.

**The fix:** Smart defaults that make the form nearly zero-effort for the common case ("continue with same objective, same raters, just start a new 12-week journey").

**A. Add a "Continue Journey" one-click option**

At the top of the new journey page, if the user has a completed journey, show:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Continue your journey

Same objective: "[objective title]"
Same focus areas, same raters, 12 weeks starting [next Monday].

[ Start New Journey → ]    [ Customize instead ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

One click. Done. The existing long form appears only if they click "Customize instead."

**B. If they do customize, add smart defaults**

Pre-fill every field with the previous journey's values. The user only changes what's different. Show a progress indicator (Step 1 of 3: Objective → Schedule → Review).

Reduce to 3 steps max:

1. **Objective** — Keep same or modify? Show previous objective pre-filled.
2. **Schedule** — Duration (default: same as before), check-in days (default: same), start date (default: next Monday). One screen, not multiple sections.
3. **Review** — Summary of what will be created. Confirm.

**Files to modify:**

- `/src/routes/individual/new-cycle/+page.svelte` — add "Continue Journey" option, restructure form into 3 steps
- `/src/routes/individual/new-cycle/+page.server.ts` — load previous journey data for pre-fill

**Acceptance criteria:**

- A user continuing the same objective can start a new journey in ONE click
- The "Customize" path is 3 steps max with pre-filled defaults
- The form shows a progress indicator
- The total time for the "Continue" path is < 10 seconds
- The total time for the "Customize" path is < 2 minutes

---

### TASK 5: Finish Cleaning Up Cognitive Debt

**Effort: S | Impact: Simplicity +0.5, Usability +0.3**

**The problem:** Several screens still have unexplained metrics, too many information zones, or unclear navigation.

**A. Add one-line tooltips to all metric pills**

On the individual hub, the metric pills (Stability, Trajectory, Completion, Alignment) have no explanation. Add a small (i) icon that reveals a one-line tooltip on tap/hover:

| Metric     | Tooltip                                                    |
| ---------- | ---------------------------------------------------------- |
| Stability  | "How consistent your ratings are week to week"             |
| Trajectory | "Whether your scores are trending up or down"              |
| Completion | "How many check-ins you've completed this journey"         |
| Alignment  | "How closely your self-ratings match your raters' ratings" |

One line each. No paragraphs. No "learn more" links.

**B. Collapse the heat map by default**

The heat map on the individual hub should be collapsed by default (for ALL maturity stages, not just "new"). Show a toggle: "Show weekly heat map ▸" that expands it. Most users don't need it on every visit — it's a deep-dive tool, not a daily view.

**C. Remove or simplify the 6-color insight sections**

The insights page uses 6 different section colors (purple, blue, teal, emerald, amber, indigo). This is cognitive overload. Reduce to a single accent color for all insight sections, with section headers providing the differentiation. Color should be informational (green = positive trend, amber = watch this) not decorative (6 arbitrary colors for 6 arbitrary sections).

**Files to modify:**

- Individual hub component — add tooltips to metric pills, collapse heat map
- Insights page component — simplify color scheme

**Acceptance criteria:**

- Every metric pill has a one-line tooltip (tap/hover)
- Heat map is collapsed by default with a clear expand toggle
- Insight sections use ≤ 2 colors meaningfully (not 6 decoratively)
- No new information is added — this is about clarifying what exists

---

## EXECUTION ORDER

```
Task 0A (Finish terminology)     ██░░░░  ~1-2 hours
Task 0B (Mid-cycle reflection)   █░░░░░  ~30 min
Task 1  (Rater reframing)        ███░░░  ~2 hours
Task 2  (Check-in effortless)    ██░░░░  ~1-2 hours
Task 3  (Rater time reduction)   ██░░░░  ~1-2 hours
Task 4  (New journey simplify)   ████░░  ~3 hours
Task 5  (Cognitive debt)         ██░░░░  ~1-2 hours
```

**Total estimated: ~12-15 hours of work.**

---

## WHAT NOT TO DO

1. **Do not add new features.** This entire directive is about making existing things simpler, faster, and less emotionally taxing. If you find yourself building something new, stop.

2. **Do not add explanatory text to solve confusion.** If something is confusing, simplify it. Don't add a paragraph explaining why it's confusing. Fewer words > more words. Always.

3. **Do not add loading states, animations, or transitions unless they make something feel faster.** A spinner that appears for 200ms is noise, not feedback. Only add visual feedback for operations that take > 1 second.

4. **Do not change the 0-10 rating scale.** The founder has decided this stays. Do not suggest alternatives, do not add a "simplified mode," do not change the numerical range. Work within this constraint.

5. **Do not touch the AI prompt system.** Directive 001 got it right. Leave it alone.

6. **Do not refactor code structure.** No new utility files, no extracting components, no moving files around. Change behavior, not architecture.

---

## SUCCESS CRITERIA FOR DIRECTIVE 002

When complete, the following should be true:

- [ ] A returning rater can submit feedback in < 15 seconds (pre-selected ratings, confirm, done)
- [ ] A returning individual can complete a check-in in < 30 seconds (2 taps or "same as last week")
- [ ] Starting a new journey with the same objective takes 1 click
- [ ] Zero instances of mixed terminology (no "stakeholder" AND "rater" on the same screen)
- [ ] Every metric on the hub has a tooltip
- [ ] The heat map doesn't auto-display
- [ ] Insight sections use ≤ 2 meaningful colors
- [ ] The feedback form feels like helping, not judging
- [ ] Notes/comments are collapsed by default everywhere (expandable, not confrontational)
- [ ] Recurring rater emails are ≤ 3 lines

**Expected platform score after Directive 002: ~9.0** (from 8.10)

---

## AFTER YOU'RE DONE

1. Commit with clear messages
2. Deploy to Vercel
3. Tell Marc to ask the supervisory agent for re-evaluation
4. Directive 003 will focus on the remaining gap to 9.5 — likely efficacy polish, shareable moments, and reliability

---

_Directive 002 — Issued March 1, 2026_
_Supervisory Agent: Claude Opus_
_Target: Platform score 8.10 → 9.0_
_Theme: Less friction. Fewer words. Faster everything._
