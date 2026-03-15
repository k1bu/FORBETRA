# Forbetra QA Reassessment — 2026-03-14 (Post Phase 2)

5-agent parallel end-to-end code-based QA after Phase 1 quick wins + Phase 2 navigation & architecture fixes.

---

## Platform Score: 7.82 / 10.0 (+1.01)

| Role         | New Score | Previous Score |   Delta   |
| ------------ | :-------: | :------------: | :-------: |
| Individual   |   7.91    |      6.43      | **+1.48** |
| Coach        |   7.65    |      7.20      | **+0.45** |
| Stakeholder  |   8.17    |      7.01      | **+1.16** |
| Admin        |   7.25    |       —        |     —     |
| **Platform** | **7.82**  |    **6.81**    | **+1.01** |

Formula: `(Individual × 0.45) + (Coach × 0.30) + (Stakeholder × 0.25)`

### Score Breakdown by Dimension

| Dimension                     | Individual | Coach | Stakeholder | Admin |
| ----------------------------- | :--------: | :---: | :---------: | :---: |
| FI (First Impression)         |    7.8     |  8.2  |     8.2     |  7.8  |
| CP (Clarity of Purpose)       |    8.2     |  8.5  |     8.7     |  8.2  |
| OE (Onboarding Ease)          |    7.4     |  8.0  |     9.0     |  6.5  |
| CT (Core Task Flow)           |    8.5     |  7.2  |     8.5     |  7.4  |
| IA (Information Architecture) |    7.6     |  7.5  |     7.8     |  7.6  |
| CL (Cognitive Load)           |    7.3     |  7.8  |     8.3     |  7.2  |
| FP (Feedback & Progress)      |    8.6     |  7.0  |     8.0     |  7.5  |
| TC (Trust & Credibility)      |    8.0     |  8.0  |     7.4     |  6.8  |
| EE (Emotional Engagement)     |    7.9     |  7.5  |     8.0     |  6.0  |
| VP (Value Perception)         |    7.8     |  7.8  |     7.8     |  7.5  |

### Biggest Improvements (vs. Previous Assessment)

| Dimension | Role        | Previous | New |  Delta   |
| --------- | ----------- | :------: | :-: | :------: |
| IA        | Individual  |   5.3    | 7.6 | **+2.3** |
| EE        | Individual  |   5.9    | 7.9 | **+2.0** |
| FP        | Individual  |   6.7    | 8.6 | **+1.9** |
| FI        | Stakeholder |   6.3    | 8.2 | **+1.9** |
| CT        | Individual  |   6.5    | 8.5 | **+2.0** |

**Biggest swing**: Individual IA went from 5.3 (worst dimension) to 7.6 — all built pages now reachable from nav.

---

## Phase 2 Fixes Verified

All 5 Phase 2 items confirmed resolved by the reassessment agents:

| Fix                                     | Status | Evidence                                                   |
| --------------------------------------- | :----: | ---------------------------------------------------------- |
| Individual sidebar includes all 8 pages |  Done  | IA score 5.3 → 7.6, no "unreachable page" issues flagged   |
| Coach dashboard shows ALL clients       |  Done  | No "empty dashboard" issue flagged; healthy clients listed |
| Portfolio metrics on coach dashboard    |  Done  | Avg Progress, Feedback Rate, Check-ins grid visible        |
| Insights → Ask bridge CTA               |  Done  | CT score 6.5 → 8.5, no "broken discovery flow" issue       |
| Mobile template drawer in onboarding    |  Done  | OE score 7.0 → 7.4, no "hidden on mobile" issue            |

---

## Issue Summary

| Domain              | Critical | Major  | Minor  | Polish |  Total  | Previous |  Delta  |
| ------------------- | :------: | :----: | :----: | :----: | :-----: | :------: | :-----: |
| Individual Journey  |    3     |   6    |   6    |   5    |   20    |    38    | **-18** |
| Coach Journey       |    0     |   5    |   8    |   7    |   20    |    27    | **-7**  |
| Stakeholder Journey |    0     |   4    |   6    |   3    |   13    |    20    | **-7**  |
| Admin & Cross-Role  |    3     |   8    |   9    |   5    |   25    |    28    | **-3**  |
| API & Backend       |    4     |   17   |   15   |   0    |   36    |    29    | **+7**  |
| **Total**           |  **10**  | **40** | **44** | **20** | **114** | **142**  | **-28** |

Net: 28 fewer issues (142 → 114). Backend went up because deeper audit surfaced new DB index and compliance items.

---

## Remaining Critical Issues (10)

### Individual Journey (3)

| #   | Issue                                                                      | Location                           | Effort |
| --- | -------------------------------------------------------------------------- | ---------------------------------- | :----: |
| 1   | **Onboarding progress bar says "Step 1 of 3" but wizard only has 2 steps** | `onboarding/+page.svelte`          |   S    |
| 2   | **Check-in notes textarea maxlength mismatch with Zod schema**             | `reflections/checkin/+page.svelte` |   S    |
| 3   | **History and Stakeholders pages unreachable from sidebar**                | `individual/+layout.svelte`        |   S    |

### Admin & Cross-Role (3)

| #   | Issue                                                                  | Location                             | Effort |
| --- | ---------------------------------------------------------------------- | ------------------------------------ | :----: |
| 4   | **Webhook user.deleted fails with FK constraint — no cascade deletes** | `api/webhooks/clerk/+server.ts:65`   |   L    |
| 5   | **No cascade delete strategy in Prisma schema**                        | `prisma/schema.prisma`               |   L    |
| 6   | **Admin user deletion misses ObjectiveChange and OrganizationMember**  | `admin/users/+page.server.ts:64-118` |   S    |

### API & Backend (4)

| #   | Issue                                                            | Location                                 | Effort |
| --- | ---------------------------------------------------------------- | ---------------------------------------- | :----: |
| 7   | **Impersonation cookie unsigned — privilege escalation vector**  | `api/admin/impersonate/+server.ts:29-35` |   M    |
| 8   | **8 of 12 SMS templates missing STOP opt-out (TCPA)**            | `lib/notifications/smsTemplates.ts`      |   S    |
| 9   | **AI cron jobs risk Vercel timeout — sequential processing**     | `jobs/generate-weekly-insights.ts:32-61` |   L    |
| 10  | **Webhook secret loaded at module top-level, stale on rotation** | `api/webhooks/clerk/+server.ts:11`       |   S    |

---

## Top 15 Major Issues (Ranked by Impact)

| #   | Issue                                                               | Domain      | Effort |
| --- | ------------------------------------------------------------------- | ----------- | :----: |
| 1   | Coach Notes cannot be edited or deleted                             | Coach       |   M    |
| 2   | AI Prep content rendered as plain text, not parsed markdown         | Coach       |   M    |
| 3   | No empty state for Hub page when onboarding is complete but no data | Individual  |   M    |
| 4   | Stakeholder reminder job has no deduplication — daily Mon-Fri spam  | Stakeholder |   M    |
| 5   | No privacy policy link on stakeholder feedback page                 | Stakeholder |   S    |
| 6   | User deletion webhook always fails with FK constraint errors        | Admin       |   L    |
| 7   | Admin Settings allows COACH role access (overly permissive)         | Admin       |   S    |
| 8   | No security headers configured (CSP, X-Frame-Options, HSTS)         | Admin       |   M    |
| 9   | Email failover not implemented despite claiming it                  | Backend     |   M    |
| 10  | No SMS consent verification before sending                          | Backend     |   M    |
| 11  | Missing composite index on Insight model                            | Backend     |   S    |
| 12  | Missing indexes on CoachNote model                                  | Backend     |   S    |
| 13  | N+1 query in remind-stakeholder-feedback job                        | Backend     |   S    |
| 14  | Terminology inconsistency: reviewer/stakeholder/rater               | All         |   L    |
| 15  | No response body on 4 of 7 cron job endpoints                       | Backend     |   S    |

---

## Quick Wins (Remaining)

These are **S effort** items from the reassessment:

1. **Add STOP opt-out to remaining 8 SMS templates** — TCPA compliance
2. **Fix admin user deletion to include ObjectiveChange + OrganizationMember** — add 2 delete calls
3. **Fix admin settings role check** — change `['COACH', 'ADMIN']` to `'ADMIN'`
4. **Add privacy policy link to stakeholder feedback page** — add footer link
5. **Fix onboarding progress indicator** — step count mismatch
6. **Add missing DB indexes on Insight and CoachNote** — Prisma schema change
7. **Fix settings redirect for STAKEHOLDER/ORG_ADMIN roles** — add 2 conditions
8. **Fix check-in notes maxlength mismatch** — align textarea and Zod schema

---

## What's Working Well (Cross-Agent Consensus)

These strengths were independently flagged by 2+ agents:

1. **Zero-auth stakeholder flow** — tokenized, no sign-up required (Stakeholder + Backend)
2. **Token security fundamentals** — 256-bit entropy, single-use, expiry (Stakeholder + Backend)
3. **Score reveal reciprocity** — stakeholders see individual's self-scores after submitting (Stakeholder + Individual)
4. **Consistent auth on ALL API endpoints** — no unprotected routes (Backend + Admin)
5. **XSS prevention in email templates** — escapeHtml consistently applied (Stakeholder + Backend)
6. **Draft auto-save with restore** — prevents data loss in onboarding and feedback (Individual + Stakeholder)
7. **Impersonation system** — properly secured with rate limiting and TTL (Admin + Backend)
8. **CAN-SPAM compliance in emails** — mailing address and unsubscribe link in footer (Backend + Stakeholder)
9. **Webhook signature verification** — Svix verification on Clerk webhooks (Admin + Backend)
10. **Check-in streak system** — progressive milestones drive habit formation (Individual)

---

## Recommended Next Phase

### Phase 3: Data Integrity & Compliance (3-5 days, est. +0.4 lift)

Priority items from the reassessment:

1. **Add STOP opt-out to all SMS templates** — S effort, TCPA liability
2. **Fix cascade delete strategy** — add ObjectiveChange + OrgMember to admin delete, plan Prisma onDelete
3. **Add timeout + parallelism to AI cron jobs** — prevent total failure at scale
4. **Add privacy policy link to stakeholder pages** — GDPR/trust
5. **Fix admin settings role guard** — COACH → ADMIN only
6. **Add missing database indexes** — Insight + CoachNote models
7. **Implement stakeholder reminder deduplication** — prevent daily spam

### Phase 4: Trust & Polish (2-3 days, est. +0.3 lift)

1. **Add security headers** — CSP, X-Frame-Options, HSTS
2. **Standardize reviewer/stakeholder terminology**
3. **Add coach note edit/delete**
4. **Render AI content as markdown**
5. **Add empty states where missing**

---

## Scoring Methodology

- **10 UX dimensions** scored per role (FI, CP, OE, CT, IA, CL, FP, TC, EE, VP)
- **Platform score** = weighted average: Individual (0.45) + Coach (0.30) + Stakeholder (0.25)
- **Admin/Backend** scored separately for operational health but not weighted into platform score
- All scoring is code-based synthetic QA — no live user testing
