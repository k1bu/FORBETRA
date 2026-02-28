# UX Panel Evaluation Framework — Systematic App Scoring

Structured methodology for evaluating Forbetra's UX across all three user types using simulated expert panels, standardized scoring dimensions, and a prioritized improvement pipeline targeting a platform score of 9.3+.

---

## Table of Contents

1. [Scoring Dimensions](#1-scoring-dimensions)
2. [Dimension Weights](#2-dimension-weights-per-user-type)
3. [Platform Score Formula](#3-platform-score-formula)
4. [Panel Personas](#4-panel-personas)
5. [Test Scenarios](#5-test-scenarios)
6. [Scoring Methodology](#6-scoring-methodology)
7. [Baseline Assessment](#7-baseline-assessment)
8. [Top Score-Lift Opportunities](#8-top-score-lift-opportunities)
9. [Improvement Phases](#9-improvement-phases)
10. [Execution Process](#10-execution-process)
11. [File Reference](#11-file-reference)

---

## 1. Scoring Dimensions

Every screen and touchpoint is evaluated on these 10 dimensions, scored 1–10.

| #   | Dimension                        | Code | What It Measures                                           |
| --- | -------------------------------- | ---- | ---------------------------------------------------------- |
| 1   | First Impression & Visual Design | FI   | Polish, consistency, professionalism in first 5 seconds    |
| 2   | Clarity of Purpose               | CP   | Can the user immediately understand what this screen does? |
| 3   | Onboarding & Setup Ease          | OE   | Time-to-value, learning curve, guidance quality            |
| 4   | Core Task Flow                   | CT   | Speed and intuitiveness of the primary repeated action     |
| 5   | Information Architecture         | IA   | Can users find what they need? Logical hierarchy?          |
| 6   | Feedback & Progress Visibility   | FP   | Loading states, success confirmation, "what happens next"  |
| 7   | Cognitive Load & Friction        | CL   | Mental effort per interaction, unnecessary decisions       |
| 8   | Trust & Credibility              | TC   | Safety, privacy signals, professional copy, error handling |
| 9   | Emotional Engagement             | EE   | Motivation, delight, celebration, habit reinforcement      |
| 10  | Value Perception                 | VP   | "Was this worth my time? Would I come back?"               |

---

## 2. Dimension Weights (per user type)

Weights reflect what matters most for each user type's success.

| Dimension                     | Individual |  Coach   | Stakeholder |
| ----------------------------- | :--------: | :------: | :---------: |
| FI — First Impression         |     8%     |    8%    |     12%     |
| CP — Clarity of Purpose       |    10%     |   10%    |     15%     |
| OE — Onboarding Ease          |    12%     |   12%    |     8%      |
| CT — Core Task Flow           |    15%     |   15%    |     20%     |
| IA — Information Architecture |    10%     |   12%    |     5%      |
| FP — Feedback & Progress      |    10%     |   10%    |     10%     |
| CL — Cognitive Load           |    10%     |    8%    |     15%     |
| TC — Trust & Credibility      |     8%     |    8%    |     10%     |
| EE — Emotional Engagement     |    10%     |    7%    |     3%      |
| VP — Value Perception         |     7%     |   10%    |     2%      |
| **Total**                     |  **100%**  | **100%** |  **100%**   |

---

## 3. Platform Score Formula

```
Individual Weighted = Σ (DimensionScore × DimensionWeight)
Coach Weighted      = Σ (DimensionScore × DimensionWeight)
Stakeholder Weighted = Σ (DimensionScore × DimensionWeight)

Platform Score = (Individual × 0.45) + (Coach × 0.30) + (Stakeholder × 0.25)
```

- **Individual** weighted highest (0.45) — core value proposition
- **Coach** second (0.30) — distribution channel and retention driver
- **Stakeholder** third (0.25) — minimal but critical 360 interaction

### Target Milestones

| Milestone        | Platform | Individual | Coach | Stakeholder |
| ---------------- | :------: | :--------: | :---: | :---------: |
| Baseline         |   ~6.7   |    ~6.6    | ~6.1  |    ~7.7     |
| Phase A          |   7.5    |    7.3     |  7.0  |     8.2     |
| Phase B          |   8.2    |    8.0     |  7.8  |     8.7     |
| Phase C          |   8.8    |    8.7     |  8.5  |     9.0     |
| Phase D (Target) |   9.3+   |    9.3+    | 9.0+  |    9.5+     |

### "Mid-9s" Definition

- Platform overall ≥ 9.3
- No user type below 9.0
- No dimension below 8.5 for any user type
- Zero P0 (Critical) issues, fewer than 3 P1 (Major) issues
- Average scenario completion rate ≥ 95%

---

## 4. Panel Personas

### Individual Panel (3 personas)

#### I-1: "Driven Director" — Maya Chen

- **Age:** 38 | **Role:** Director of Product
- **Tech comfort:** High — compares everything to best-in-class consumer apps
- **Motivation:** Chose Forbetra voluntarily, self-motivated
- **Pain sensitivity:** Impatient with slow or clunky UX; wants data density without clutter
- **Devices:** iPhone (primary), MacBook (secondary)
- **Key question:** "Is this as polished as the tools I already use?"

#### I-2: "Reluctant Leader" — James Okafor

- **Age:** 45 | **Role:** VP of Operations
- **Tech comfort:** Moderate — referred by his coach, skeptical
- **Motivation:** Low intrinsic; doing this because coach recommended it
- **Pain sensitivity:** Will abandon at first sign of complexity; needs "just tell me what to do"
- **Devices:** Android phone (primary), Windows laptop (secondary)
- **Key question:** "Why should I bother with this?"

#### I-3: "Eager Early-Career" — Priya Mehta

- **Age:** 28 | **Role:** Newly promoted team lead
- **Tech comfort:** Very high, strong design standards
- **Motivation:** Excited but overwhelmed by options; loves gamification and progress indicators
- **Pain sensitivity:** Wants everything to feel like a modern app; tolerates learning curve if payoff is visible
- **Devices:** iPhone (primary), MacBook Air (secondary)
- **Key question:** "Am I doing this right? How am I progressing?"

### Coach Panel (3 personas)

#### C-1: "Digital-Native Coach" — Sarah Williams

- **Age:** 34 | **Credentials:** ICF PCC, 12 active clients
- **Tech comfort:** High — uses CoachAccountable, Calendly, Notion daily
- **Motivation:** Wants the tool to make her look brilliant; values AI prep deeply
- **Pain sensitivity:** Expects smooth cross-tool workflow; frustrated by missing integrations
- **Devices:** iPad Pro for sessions, MacBook Pro for admin
- **Key question:** "Does this make me a better coach, or just give me more work?"

#### C-2: "Traditional Coach" — Dr. Robert Kim

- **Age:** 58 | **Credentials:** MCC, 25 years experience
- **Tech comfort:** Low-moderate — uses email and Word, nothing else
- **Motivation:** Pushed to try Forbetra by coaching firm; will revert to spreadsheet if frustrated
- **Pain sensitivity:** Very low tolerance for learning new interfaces; needs obvious affordances
- **Devices:** Windows laptop (primary), iPhone reluctantly
- **Key question:** "Is this simpler than what I'm already doing?"

#### C-3: "Scale-Focused Coach" — Amara Johnson

- **Age:** 41 | **Role:** Runs a 3-coach practice, 30+ clients
- **Tech comfort:** High — thinks in systems and workflows
- **Motivation:** Expects batch operations, filtering, sorting, export
- **Pain sensitivity:** Frustrated by one-at-a-time paradigms; thinks portfolio-level
- **Devices:** MacBook Pro (primary)
- **Key question:** "Can I manage 30 clients without going insane?"

### Stakeholder Panel (2 personas)

#### S-1: "Willing Colleague" — Marcus Taylor

- **Age:** 36 | **Role:** Peer of the individual
- **Tech comfort:** Moderate, mobile-first
- **Motivation:** Willing to help if it takes under 2 minutes; will not create an account
- **Pain sensitivity:** If it requires signup, download, or more than 3 taps — gone
- **Devices:** iPhone (checking email between meetings)
- **Key question:** "Can I knock this out before my next meeting?"

#### S-2: "Skeptical Manager" — Linda Park

- **Age:** 52 | **Role:** Senior VP
- **Tech comfort:** Desktop-only, privacy-conscious
- **Motivation:** Suspicious of unfamiliar links; decides in 10 seconds whether to engage
- **Pain sensitivity:** Any ambiguity about data usage or unfamiliar branding → delete email
- **Devices:** Desktop (Outlook + Chrome)
- **Key question:** "Is this legitimate? Where does my feedback go?"

---

## 5. Test Scenarios

### Individual Scenarios (7)

| Code | Scenario                                          | Key Dimensions | Target Time |
| ---- | ------------------------------------------------- | -------------- | ----------- |
| I-1  | First-time onboarding (all 5 steps)               | CP, OE, CL, EE | < 8 min     |
| I-2  | Weekly check-in (effort + performance + notes)    | CT, CL, FP, EE | < 90 sec    |
| I-3  | Add stakeholder + generate feedback link          | CT, CL, TC     | < 2 min     |
| I-4  | Review AI insights + ask follow-up in chat        | FP, VP, TC     | < 5 min     |
| I-5  | Scorecard review + perception gap analysis        | FI, CL, CP     | < 3 min     |
| I-6  | Start a new cycle (continue same objective)       | CT, OE, CL     | < 3 min     |
| I-7  | First return visit (day 3, no check-in available) | FP, EE, VP     | Observe     |

### Coach Scenarios (5)

| Code | Scenario                                               | Key Dimensions | Target Time |
| ---- | ------------------------------------------------------ | -------------- | ----------- |
| C-1  | Coach onboarding + invite first client                 | CP, OE, CT     | < 5 min     |
| C-2  | Monday morning roster review + identify at-risk client | FI, CT, FP     | < 2 min     |
| C-3  | Pre-session deep dive + generate AI prep + add note    | CL, CT, VP     | < 5 min     |
| C-4  | Analytics review + sort + identify trends              | FI, CL, VP     | < 3 min     |
| C-5  | Invite new client with prefilled data                  | CT, OE, FP     | < 4 min     |

### Stakeholder Scenarios (4)

| Code | Scenario                                          | Key Dimensions | Target Time |
| ---- | ------------------------------------------------- | -------------- | ----------- |
| S-1  | First-time feedback submission (from email click) | CT, CL, CP, TC | < 90 sec    |
| S-2  | Score reveal experience after submission          | EE, FI, CP     | Observe     |
| S-3  | Return visit feedback (4th time)                  | CT, FP, EE     | < 60 sec    |
| S-4  | Expired token handling                            | FP, TC, FI     | Observe     |

---

## 6. Scoring Methodology

### Touchpoint Scoring Card

For each screen/step encountered during a scenario walkthrough:

```
Screen: [name]
Persona: [code]
Scenario: [code]

Scores (1-10):
  FI: __ | CP: __ | OE: __ | CT: __ | IA: __
  FP: __ | CL: __ | TC: __ | EE: __ | VP: __

Issues Found:
  - [Critical/Major/Minor/Polish] Description...

Positive Highlights:
  - ...

Time to Complete: __
Task Success: Yes / Partial / No
```

### Issue Severity Definitions

| Severity | Score Impact | Definition                                         |      Action Priority      |
| -------- | :----------: | -------------------------------------------------- | :-----------------------: |
| Critical |   -3 to -4   | Blocks task completion entirely                    |   P0 — Fix immediately    |
| Major    |   -2 to -3   | Significant friction, some users will abandon      |   P1 — Fix next sprint    |
| Minor    |   -1 to -2   | Noticeable inconvenience, users can work around it | P2 — Fix within 2-4 weeks |
| Polish   |  -0.5 to -1  | Cosmetic or subtle, doesn't affect task completion | P3 — Fix when convenient  |

### Prioritization Formula

```
Priority Score = (Frequency × Severity × DimensionWeight × UserTypeWeight) / Effort
```

| Factor              | Values                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Frequency**       | 1 = once per lifecycle, 2 = weekly, 3 = multiple times per week |
| **Severity**        | Critical = 4, Major = 3, Minor = 2, Polish = 1                  |
| **DimensionWeight** | From dimension weights table (as decimal, e.g. 0.15)            |
| **UserTypeWeight**  | Individual = 0.45, Coach = 0.30, Stakeholder = 0.25             |
| **Effort**          | S = 1, M = 2, L = 3, XL = 4                                     |

Sort descending. Fix highest Priority Score items first.

---

## 7. Baseline Assessment

Preliminary estimates from codebase exploration (to be validated during live walkthrough).

| Dimension                 | Individual |  Coach   | Stakeholder |
| ------------------------- | :--------: | :------: | :---------: |
| FI — First Impression     |    7.0     |   6.5    |     8.0     |
| CP — Clarity of Purpose   |    7.5     |   7.0    |     8.5     |
| OE — Onboarding Ease      |    6.5     |   6.0    |     9.0     |
| CT — Core Task Flow       |    7.0     |   6.5    |     7.5     |
| IA — Info Architecture    |    6.0     |   6.0    |     8.0     |
| FP — Feedback & Progress  |    7.0     |   5.5    |     7.5     |
| CL — Cognitive Load       |    5.5     |   5.5    |     7.0     |
| TC — Trust & Credibility  |    7.5     |   7.0    |     8.0     |
| EE — Emotional Engagement |    6.5     |   5.0    |     7.0     |
| VP — Value Perception     |    7.0     |   6.5    |     7.5     |
| **Weighted Overall**      |  **~6.6**  | **~6.1** |  **~7.7**   |

### Platform Score: ~6.7 / 10.0

```
(6.6 × 0.45) + (6.1 × 0.30) + (7.7 × 0.25) = 2.97 + 1.83 + 1.93 = 6.73
```

---

## 8. Top Score-Lift Opportunities

Preliminary ranking (to be validated during baseline walkthrough).

| #   | Issue                                               | User Types | Dimensions | Severity | Est. Platform Lift |
| --- | --------------------------------------------------- | :--------: | :--------: | :------: | :----------------: |
| 1   | Individual hub information overload (8-12 zones)    |     I      | CL, IA, FI |  Major   |       +0.18        |
| 2   | 11-button rating scale — cognitive burden           |    I, S    |   CT, CL   |  Major   |       +0.15        |
| 3   | Coach session view too long, no pagination/filters  |     C      | CL, IA, CT |  Major   |       +0.12        |
| 4   | No celebration/feedback loops after key actions     |    All     |   EE, FP   |  Major   |       +0.11        |
| 5   | Coach prefill feature hidden in accordion           |     C      |   OE, CT   |  Major   |       +0.09        |
| 6   | Stakeholder comment prompt too vague                |     S      |   CT, VP   |  Minor   |       +0.07        |
| 7   | Visual inconsistency across different sections      |    All     |   FI, TC   |  Minor   |       +0.07        |
| 8   | Coach analytics lacks export/comparison tools       |     C      |   VP, CT   |  Major   |       +0.06        |
| 9   | Default initial rating scores create anchoring bias |     I      |   TC, CL   |  Minor   |       +0.05        |
| 10  | No adaptive empty states for new users              |    I, C    | FP, EE, OE |  Minor   |       +0.05        |

---

## 9. Improvement Phases

### Phase A: Fix the Floor (Weeks 1-3) → Target: 7.5

- [ ] Restructure individual hub layout (reduce from 8-12 zones to 4-5)
- [ ] Simplify rating input (replace 11-button scale)
- [ ] Add post-action celebrations (check-in, stakeholder add, cycle start)
- [ ] Fix onboarding defaults (remove anchoring bias in initial ratings)
- [ ] Surface coach prefill feature (move out of accordion)

### Phase B: Raise the Ceiling (Weeks 4-6) → Target: 8.2

- [ ] Redesign coach session view with tabs/sections
- [ ] Add structured stakeholder comment prompts
- [ ] Establish consistent color system across all views
- [ ] Add adaptive empty states for new users and coaches

### Phase C: Differentiate (Weeks 7-10) → Target: 8.8

- [ ] Build end-of-cycle behavioral portrait
- [ ] Coach analytics export and comparison tools
- [ ] Streak mechanics with visual progression
- [ ] Mobile-specific optimization pass

### Phase D: Polish to Excellence (Weeks 11-14) → Target: 9.3+

- [ ] Micro-interaction audit (every button, transition, state)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Edge case and error handling polish
- [ ] Full re-evaluation to verify mid-9s

---

## 10. Execution Process

### Step 1: Validate Framework

Review and approve the dimensions, personas, scenarios, and weights in this document.

### Step 2: Run Baseline Assessment

Walk through each persona × scenario combination, scoring every touchpoint live. Role-play each persona, calling out exactly what they'd notice, struggle with, or appreciate. Output: validated baseline scorecard + prioritized issue list.

### Step 3: Fix → Re-score → Repeat

After each batch of fixes:

1. Re-evaluate affected touchpoints
2. Update scores in this document
3. Recalculate platform score
4. Identify next highest-priority issues
5. Repeat until mid-9s achieved

### Score Update Log

| Date       | Phase           | Platform Score | Individual | Coach | Stakeholder | Notes                            |
| ---------- | --------------- | :------------: | :--------: | :---: | :---------: | -------------------------------- |
| 2026-02-28 | Baseline (est.) |      6.7       |    6.6     |  6.1  |     7.7     | Preliminary from codebase review |
|            |                 |                |            |       |             |                                  |

---

## 11. File Reference

### Individual Journey

- `src/routes/+page.svelte` — Landing, role selection
- `src/routes/onboarding/` — 5-step wizard
- `src/routes/onboarding/initial-ratings/` — Baseline ratings
- `src/routes/onboarding/complete/` — Completion page
- `src/routes/individual/+page.svelte` — Hub ("Today")
- `src/routes/individual/dashboard/` — Charts & trends
- `src/routes/individual/insights/` — AI reports
- `src/routes/individual/scorecard/` — Stakeholder ratings
- `src/routes/individual/stakeholders/` — Stakeholder management
- `src/routes/individual/history/` — Past cycles
- `src/routes/individual/new-cycle/` — New cycle creation
- `src/routes/individual/ask/` — AI chat
- `src/routes/reflections/checkin/` — Check-in flow

### Coach Journey

- `src/routes/coach/+page.svelte` — Dashboard
- `src/routes/coach/+layout.svelte` — Navigation
- `src/routes/coach/roster/` — Client list + detail
- `src/routes/coach/invitations/` — Invite management
- `src/routes/coach/session/[clientId]/` — Per-client deep dive
- `src/routes/coach/analytics/` — Portfolio analytics
- `src/routes/coach/onboarding/` — 3-step coach onboarding

### Stakeholder Journey

- `src/routes/stakeholder/feedback/[token]/` — Feedback form + reveal
- `src/routes/stakeholder/invalid/` — Expired/invalid token
- `src/lib/notifications/emailTemplates.ts` — Email copy
- `src/lib/notifications/smsTemplates.ts` — SMS copy
