# Forbetra Full QA Assessment — 2026-03-14

5-agent parallel end-to-end user testing. Code-based synthetic QA across all roles, routes, API endpoints, and backend systems.

---

## Platform Score: 6.81 / 10.0

| Role         | Weighted Score | Previous Baseline |   Delta   |
| ------------ | :------------: | :---------------: | :-------: |
| Individual   |      6.43      |        6.6        |   -0.17   |
| Coach        |      7.20      |        6.1        |   +1.10   |
| Stakeholder  |      7.01      |        7.7        |   -0.69   |
| **Platform** |    **6.81**    |     **6.73**      | **+0.08** |

Formula: `(Individual × 0.45) + (Coach × 0.30) + (Stakeholder × 0.25)`

### Score Breakdown by Dimension

| Dimension                     | Individual | Coach | Stakeholder |
| ----------------------------- | :--------: | :---: | :---------: |
| FI (First Impression)         |    6.8     |  7.3  |     6.3     |
| CP (Clarity of Purpose)       |    6.6     |  7.5  |     7.4     |
| OE (Onboarding Ease)          |    7.0     |  7.5  |     6.6     |
| CT (Core Task Flow)           |    6.5     |  7.1  |     7.7     |
| IA (Information Architecture) |  **5.3**   |  7.0  |     6.9     |
| FP (Feedback & Progress)      |    6.7     |  7.0  |     6.9     |
| CL (Cognitive Load)           |    6.3     |  6.9  |     7.3     |
| TC (Trust & Credibility)      |    6.9     |  7.7  |     6.3     |
| EE (Emotional Engagement)     |  **5.9**   |  6.7  |     6.0     |
| VP (Value Perception)         |    6.3     |  7.2  |     6.7     |

**Worst dimension**: Individual IA at 5.3 (5 fully-built pages unreachable from navigation)
**Best dimension**: Coach TC at 7.7 (private notes, secure tokens, clear error handling)

---

## Issue Summary

| Domain              | Critical | Major  | Minor  | Polish |  Total  |
| ------------------- | :------: | :----: | :----: | :----: | :-----: |
| Individual Journey  |    5     |   17   |   12   |   4    |   38    |
| Coach Journey       |    2     |   8    |   13   |   4    |   27    |
| Stakeholder Journey |    3     |   7    |   7    |   3    |   20    |
| Admin & Cross-Role  |    1     |   9    |   14   |   4    |   28    |
| API & Backend       |    2     |   12   |   15   |   0    |   29    |
| **Total**           |  **13**  | **53** | **61** | **15** | **142** |

---

## Critical Issues (13) — Fix Immediately

### Data Integrity / Bugs

| #   | Issue                                                                                                                                                     | Location                                                              | Fix Effort |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | :--------: |
| 1   | **Completion % shows ~6500% instead of 65%** — `buildClientSummary` returns 0-100, dashboard and session page multiply by 100 again                       | `coach/+page.svelte:160`, `coach/session/[clientId]/+page.svelte:251` |   **S**    |
| 2   | **Stakeholders get double reminder emails daily** — `remind-prompts` at 2pm runs `remindStakeholderFeedback()` AND `remind-feedback` at 3pm runs it again | `api/jobs/remind-prompts/+server.ts:24`                               |   **S**    |
| 3   | **User deletion via Clerk webhook always fails** — No cascade deletes in schema, any user with data can't be deleted                                      | `api/webhooks/clerk/+server.ts:65`, `prisma/schema.prisma`            |   **L**    |
| 4   | **Expired-but-submitted token shows "invalid" instead of "already submitted"** — expiry check runs before usedAt check                                    | `stakeholder/feedback/[token]/+page.server.ts:104`                    |   **S**    |

### Navigation / Discoverability

| #   | Issue                                                                                                                 | Location                          | Fix Effort |
| --- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- | :--------: |
| 5   | **Ask page (`/individual/ask`) completely unreachable** — not in sidebar, not linked from Insights                    | `individual/+layout.svelte:8-14`  |   **S**    |
| 6   | **Scorecard page exists but has no navigation entry**                                                                 | `individual/+layout.svelte:8-14`  |   **S**    |
| 7   | **Dashboard page exists but has no navigation entry**                                                                 | `individual/+layout.svelte:8-14`  |   **S**    |
| 8   | **New-cycle page not linked from hub's "Journey complete" section**                                                   | `individual/+page.svelte:203-239` |   **S**    |
| 9   | **Coach dashboard shows empty when all clients on track** — only at-risk clients render, healthy roster shows nothing | `coach/+page.svelte:66-119`       |   **M**    |

### Trust / Conversion

| #   | Issue                                                                                                    | Location                                      | Fix Effort |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- | :--------: |
| 10  | **Feedback invite email has zero trust/privacy language** — Linda Park archetype has ~40% abandonment    | `lib/notifications/emailTemplates.ts:141-175` |   **S**    |
| 11  | **"Return to Forbetra" on invalid token page is dead end** — requires Clerk auth stakeholders don't have | `stakeholder/invalid/+page.svelte:28`         |   **S**    |
| 12  | **Template sidebar hidden on mobile** — primary goal-discovery in onboarding is invisible below 1024px   | `onboarding/+page.svelte:565`                 |   **M**    |

### Security

| #   | Issue                                           | Location                           | Fix Effort |
| --- | ----------------------------------------------- | ---------------------------------- | :--------: |
| 13  | **No rate limiting on admin impersonation API** | `api/admin/impersonate/+server.ts` |   **S**    |

---

## Top 20 Major Issues (Ranked by Platform Score Impact)

| #   | Issue                                                                                | Domain     | Dims   | Effort | Est. Lift |
| --- | ------------------------------------------------------------------------------------ | ---------- | ------ | :----: | :-------: |
| 1   | No link from Insights to Ask page — broken discovery flow                            | Individual | CT, IA |   S    |   +0.15   |
| 2   | AI cron jobs will timeout on Vercel — sequential processing, no batching             | Backend    | --     |   L    |   +0.12   |
| 3   | Overdue reminders have no deduplication — 5 emails/week for same missing reflections | Backend    | --     |   M    |   +0.10   |
| 4   | Onboarding progress says "Step 1 of 2" but flow has 3+ screens                       | Individual | FP, TC |   S    |   +0.09   |
| 5   | Debug endpoints accessible in production (`/api/debug/email`, `/api/debug/sms`)      | Backend    | --     |   S    |   +0.08   |
| 6   | Role escalation risk via Clerk publicMetadata if user-writable                       | Backend    | --     |   M    |   +0.08   |
| 7   | No mobile template access in onboarding (no drawer/modal alternative)                | Individual | OE, CT |   M    |   +0.08   |
| 8   | Check-in shows disabled form instead of "not available" empty state                  | Individual | CL, CT |   M    |   +0.07   |
| 9   | `isLocked` always false — allows check-in re-submission overwrite                    | Individual | TC     |   M    |   +0.07   |
| 10  | Feedback link never exposed in UI — can't copy/share manually                        | Individual | CT, VP |   M    |   +0.07   |
| 11  | ORG_ADMIN can modify ANY organization (no scope restriction)                         | Admin      | --     |   M    |   +0.06   |
| 12  | No email provider failover despite CLAUDE.md claiming it                             | Backend    | --     |   M    |   +0.06   |
| 13  | Users with null `reminderDays` never get base reminders                              | Backend    | --     |   S    |   +0.06   |
| 14  | SMS messages missing STOP opt-out on 8 of 12 templates (TCPA)                        | Backend    | --     |   S    |   +0.06   |
| 15  | Terminology inconsistency: reviewer/stakeholder/rater across platform                | All        | CP, TC |   L    |   +0.06   |
| 16  | AI report rendered as plain text, not markdown                                       | Individual | EE, VP |   M    |   +0.05   |
| 17  | No edit/delete for coach notes                                                       | Coach      | CT, FP |   M    |   +0.05   |
| 18  | No portfolio-level metrics on coach dashboard                                        | Coach      | IA, VP |   M    |   +0.05   |
| 19  | Settings redirect falls through to Individual for STAKEHOLDER/ORG_ADMIN              | Admin      | --     |   S    |   +0.05   |
| 20  | Timezone-ignorant reminders — user preferences stored but never consulted            | Backend    | --     |   L    |   +0.05   |

---

## Quick Wins (High Impact, Small Effort)

These 10 fixes are all **S effort** and collectively would lift the platform score by ~0.8 points:

1. **Fix completion % double multiplication** — remove `* 100` on 2 lines
2. **Remove `remindStakeholderFeedback()` from `remind-prompts`** — delete 1 line
3. **Add Ask, Scorecard, Dashboard to individual sidebar** — add 3 entries to nav array
4. **Add "Start New Journey" CTA to hub's cycle-complete section** — add 1 button
5. **Fix token expiry condition ordering** — swap 2 lines in `+page.server.ts`
6. **Add trust sentence to feedback invite email** — add 1 line of copy
7. **Remove "Return to Forbetra" button from invalid token page** — delete or replace
8. **Fix onboarding progress indicator** — change "Step 1 of 2" to "Step 1 of 3"
9. **Add rate limiting to impersonate endpoint** — import existing `rateLimit` utility
10. **Gate debug endpoints behind NODE_ENV check** — add 1 conditional

---

## Persona Risk Assessment

| Persona                                |  Score  |  Risk Level  | Key Barrier                                                          |
| -------------------------------------- | :-----: | :----------: | -------------------------------------------------------------------- |
| Maya Chen (Driven Director)            |   7.0   |     Low      | Navigation gaps frustrate her efficiency expectations                |
| **James Okafor (Reluctant Leader)**    | **4.9** | **Critical** | Will abandon — hidden templates, confusing empty states, no guidance |
| Priya Mehta (Eager Early-Career)       |   7.4   |     Low      | Wants more gamification/delight but will persist                     |
| Sarah Williams (Digital-Native Coach)  |   8.3   |   Very Low   | Platform meets her needs well                                        |
| **Dr. Robert Kim (Traditional Coach)** | **5.8** |   **High**   | Terminology confusion, empty dashboard, dense analytics              |
| Amara Johnson (Scale-Focused Coach)    |   6.8   |    Medium    | No batch operations, no filtering, no multi-coach support            |
| Marcus Taylor (Willing Colleague)      |   7.5   |     Low      | Flow works well, under 60 seconds                                    |
| **Linda Park (Skeptical Manager)**     | **6.2** |   **High**   | ~40% email abandonment, no trust signals, no privacy links           |

**3 personas at risk of abandonment**: James Okafor, Dr. Robert Kim, Linda Park

---

## Strengths (What's Working Well)

1. **Score reveal for stakeholders** — brilliant engagement hook, creates reciprocity
2. **AI session prep with freshness indicator** — genuine coaching value
3. **Draft auto-save** — prevents lost work across onboarding and feedback flows
4. **Check-in streak system** — progressive milestones drive habit formation
5. **Dynamic note prompts** — contextual coaching questions based on score changes
6. **Midpoint identity reflection** — powerful longitudinal feature
7. **Template system for goal-setting** — reduces blank-page anxiety
8. **Duplicate invite detection** — smart error handling with Resend/Cancel options
9. **Token security** — proper generation, validation, expiry, single-use enforcement
10. **Clerk integration** — robust auth flow with impersonation support

---

## Recommended Fix Order

### Phase 1: Quick Wins (1-2 days, +0.8 estimated lift)

All 10 quick wins listed above. Fixes 4 critical bugs, 3 critical navigation gaps, and 3 security/compliance issues.

### Phase 2: Navigation & Architecture (3-5 days, +0.5 estimated lift)

- Restructure individual sidebar to include all built pages
- Fix coach dashboard to show all clients (not just at-risk)
- Add portfolio metrics to coach dashboard
- Connect Insights -> Ask with natural bridge CTA
- Make onboarding templates work on mobile (drawer/modal)

### Phase 3: Data Integrity & Backend (3-5 days, +0.3 estimated lift)

- Add cascade delete strategy to Prisma schema
- Fix AI cron job timeout risk (batching/parallelism)
- Implement overdue reminder deduplication
- Add email provider failover
- Fix timezone-ignorant reminders

### Phase 4: Trust & Conversion (2-3 days, +0.3 estimated lift)

- Add privacy/trust language throughout stakeholder journey
- Standardize reviewer/stakeholder terminology platform-wide
- Add "Request new link" to expired token page
- Fix check-in locking and re-submission
- Add privacy policy link to stakeholder pages

### Phase 5: Coach Power Features (5-7 days, +0.2 estimated lift)

- Coach note edit/delete
- Batch invite capability
- Port prefill to invitations page
- Analytics filtering
- Markdown rendering for AI content

**Estimated post-fix platform score: ~8.9** (approaching Phase C target of 8.8)
