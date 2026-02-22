# Forbetra Product Roadmap

*Last updated: February 20, 2026*
*Based on expert panel review + product decisions*

---

## Tier 1: Ship-Blocking — COMPLETE

All 5 ship-blocking issues resolved and deployed (commit `3eab353`).

| # | Item | Status |
|---|------|--------|
| 1 | Extract duplicated server utilities into `coachUtils.ts` | Done |
| 2 | Fix token expiration inconsistency (7 vs 10 days) | Done |
| 3 | Redirect orphaned `/reflections/[type]` route | Done |
| 4 | Fix onboarding "Make Changes" edit loop | Done |
| 5 | Build "Start New Cycle" flow (`/individual/new-cycle`) | Done |

---

## Tier 2: Competitive Differentiation (Next 4-6 Weeks)

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| 6 | **Coach-prefilled client onboarding** — Coach sets objective/subgoals/stakeholders during invite; client signs up and sees pre-populated onboarding to review and confirm | High | Medium | Planned |
| 7 | Restructure Individual Hub into Today / Progress / Scorecard views | High | High | Planned |
| 8 | Add streaming to AI insights | High | Low | Planned |
| 9 | Build Coach Session View (client deep-dive with prep + notes + data) | High | Medium | Planned |
| 10 | On-demand Coach Prep generation (not just Monday morning) | High | Low | Planned |
| 11 | Add in-app notifications (toast system for insights, feedback, coach notes) | High | Medium | Planned |
| 12 | Make Reveal opt-in for participants (don't auto-show self-scores to stakeholders) | Medium | Low | Planned |
| 13 | Add milestone celebrations and streak-based email nudges | Medium | Low | Planned |

### Item 6 Detail: Coach-Prefilled Client Onboarding

**Approach:** Coach pre-fills, client confirms.

**How it works:**
1. Coach clicks "Invite Client" and fills out: objective title, objective description, subgoals, stakeholders, suggested cycle config
2. This data is stored alongside the `CoachInvite` record (new `invitePayload` JSON field or related tables)
3. Client receives invite email, signs up via Clerk
4. Client lands on `/onboarding` — form is pre-populated with coach's inputs
5. Client reviews, edits if needed, and submits (existing onboarding flow, just with pre-filled data)
6. Coach invite auto-accepts (existing logic already handles this)

**Why this approach:**
- Lowest lift — extends existing invite flow with a data payload
- Respects client agency (they review and confirm, not just accept)
- Reuses the onboarding edit-mode infrastructure we just built (Tier 1, item 4)
- No new client-facing routes needed

**Schema changes:**
- Add `payload` JSON field to `CoachInvite` model (stores objective, subgoals, stakeholders, cycle config)
- Onboarding load function checks for pending invite payload and pre-populates form

**Files to modify:**
- `prisma/schema.prisma` — add `payload` to CoachInvite
- Coach invite creation page (store payload with invite)
- `src/routes/onboarding/+page.server.ts` — load invite payload for pre-population
- `src/routes/onboarding/+page.svelte` — accept pre-populated data from invite payload

---

## Tier 3: Best-in-Class (Next 2-3 Months)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 14 | "Ask About Your Data" AI chat | Transformative | High |
| 15 | Stakeholder Engagement Loop (thank-you emails, impact summaries) | High | Medium |
| 16 | Coach Analytics Dashboard (portfolio comparison, outcomes, time-series) | High | High |
| 17 | SMS reminders via Twilio (already a dependency) | Medium | Low |
| 18 | Structured stakeholder prompts (specific behavior + suggestion) | Medium | Low |
| 19 | Reflection history timeline (browse past weeks) | Medium | Medium |
| 20 | Onboarding save-as-you-go (draft persistence) | Medium | Medium |
| 21 | Organization model for enterprise readiness | High | Very High |

---

## Tier 4: Market Expansion

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 22 | Stakeholder-to-User conversion funnel | Growth | Medium |
| 23 | Sharable Cycle Reports for LinkedIn | Growth | Medium |
| 24 | Public objective template library (SEO) | Growth | Low |
| 25 | Coach referral program | Growth | Medium |
| 26 | Cohort management + aggregate reporting | Enterprise | High |
