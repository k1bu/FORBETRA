# UX Baseline Assessment — February 28, 2026

Comprehensive touchpoint-by-touchpoint evaluation of Forbetra across all three user types, scored against the 10-dimension framework. Based on full codebase walkthrough of every screen.

---

## Platform Score: 6.87 / 10.0

```
Individual (6.73 × 0.45) + Coach (6.27 × 0.30) + Stakeholder (7.84 × 0.25) = 6.87
```

| User Type    | Weighted Score | Target (Phase D) |    Gap    |
| ------------ | :------------: | :--------------: | :-------: |
| Individual   |      6.73      |       9.3+       |   -2.57   |
| Coach        |      6.27      |       9.0+       |   -2.73   |
| Stakeholder  |      7.84      |       9.5+       |   -1.66   |
| **Platform** |    **6.87**    |     **9.3+**     | **-2.43** |

---

## 1. Individual Baseline (Weight: 0.45)

### Dimension Scores

| #   | Dimension                 | Score |  Weight  | Weighted | Key Evidence                                                                                                                                                                      |
| --- | ------------------------- | :---: | :------: | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | First Impression (FI)     |  7.0  |    8%    |   0.56   | Polished onboarding, gradient icons, animations. Hub is data-dense but card-based. Some spacing/padding inconsistency across sections.                                            |
| 2   | Clarity of Purpose (CP)   |  7.5  |   10%    |   0.75   | Onboarding steps clearly labeled. "Next Action" card guides user. Hub vs Dashboard distinction unclear — two screens showing similar data.                                        |
| 3   | Onboarding Ease (OE)      |  6.5  |   12%    |   0.78   | 5-step wizard is guided but initial ratings use 11-button grid with no scoring guide. Effort/performance labels are subjective ("Rarely intentional" to "Relentless commitment"). |
| 4   | Core Task Flow (CT)       |  7.0  |   15%    |   1.05   | Check-in achieves ~90s target but 11-button grid adds cognitive overhead. Behavioral indicators collapsed by default — users may skip calibration. Previous ratings shown (good). |
| 5   | Info Architecture (IA)    |  6.0  |   10%    |   0.60   | 8 nav items in sidebar. Mobile hides 3 items (History, Ask, Settings) behind "More" menu. Hub/Dashboard overlap.                                                                  |
| 6   | Feedback & Progress (FP)  |  7.0  |   10%    |   0.70   | Spinner + success animation + streak celebration on check-in. Completion rate, streak, heatmap on hub. No loading skeletons for initial page load.                                |
| 7   | Cognitive Load (CL)       |  5.5  |   10%    |   0.55   | Hub has 8-12 information zones. 11-button rating scale. New Cycle form is very long (5+ sections, no progress indicator). Metrics (stability, trajectory) unexplained.            |
| 8   | Trust & Credibility (TC)  |  7.5  |    8%    |   0.60   | Professional design. AI disclaimer in chat. Reassurance in onboarding ("This is just your starting point"). No explicit privacy messaging for stakeholder data visibility.        |
| 9   | Emotional Engagement (EE) |  6.5  |   10%    |   0.65   | Streak tracking with milestone messages. Success animations. "You're all set!" completion. No celebration after adding stakeholder or completing other key milestones.            |
| 10  | Value Perception (VP)     |  7.0  |    7%    |   0.49   | AI insights are differentiated. Perception gaps genuinely useful. Chat allows data questions. Value not obvious until week 2+ when trends emerge.                                 |
|     | **Total**                 |       | **100%** | **6.73** |                                                                                                                                                                                   |

### Scenario Walkthroughs

#### I-1: First-time Onboarding (Target: < 8 min)

**Maya Chen (Driven Director) perspective:**

- Step 1-3 (Objective → Sub-objectives → Stakeholders): Clean, wizard-style, progress dots visible. Would find this acceptable. ~4 min.
- Step 4 (Cycle Config): Duration presets with "recommended" badge — good. Check-in day picker is nice but "Your Week" preview table is a bit wordy.
- Step 5 (Initial Ratings): Two 11-button grids (0-10 each). Maya would think: "Why 11 options? A 5-point scale would be faster." No scoring guide — what's a "5" for effort? Subjective labels don't help. ~2 min.
- Completion: Clean summary. "Go to Today" CTA is clear. ~30s.
- **Est. Time: ~7 min** | **Success: Yes** | **Score: 6.8**
- **Issues:** [Major] No scoring guide for 0-10 scale. [Minor] Subjective anchor labels.

**James Okafor (Reluctant Leader) perspective:**

- Would find 5-step wizard reasonable IF coach set it up via pre-fill.
- Initial ratings: Would stare at 22 buttons (effort + performance) and wonder what to pick. No examples, no "most people start here" guidance. Might default to 5/5 (anchoring bias).
- **Est. Time: ~10 min** | **Success: Partial** | **Score: 5.8**
- **Issues:** [Major] No guidance for someone unfamiliar with self-assessment. [Major] Default anchoring risk. [Minor] "Sub-objective" jargon unclear.

**Priya Mehta (Eager Early-Career) perspective:**

- Would appreciate the modern design. Progress dots are satisfying.
- Would want to see what "good" looks like — no sample objective or sub-objectives.
- Would enjoy the rating buttons (gamification feel) but would want to know if 7 is "good."
- **Est. Time: ~6 min** | **Success: Yes** | **Score: 7.2**
- **Issues:** [Minor] No examples/samples. [Polish] Would love confetti on completion.

#### I-2: Weekly Check-in (Target: < 90 sec)

**Maya Chen:**

- Navigates to check-in via "Next Action" card (clear). Form loads with previous week's ratings shown.
- 11-button grid: She knows her numbers, clicks quickly. Notes box is convenient. Submit is smooth with spinner + success animation.
- Behavioral indicators collapsed — she'd never open them after week 1.
- **Est. Time: ~70s** | **Success: Yes** | **Score: 7.5**
- **Issues:** [Minor] Button grid cramped on mobile (6 cols). [Polish] Would prefer slider.

**James Okafor:**

- Finds check-in via hub card. Previous ratings help him ("oh, I was a 6 last week").
- 11 buttons: Still too many choices. Would want "same as last week" shortcut. Notes: Writes nothing or one sentence.
- **Est. Time: ~2 min** | **Success: Yes** | **Score: 6.0**
- **Issues:** [Major] No "same as last week" shortcut. [Minor] No prompting for notes.

**Priya Mehta:**

- Loves the streak celebration. Would check in eagerly.
- Would want the historic chart to show her trend more prominently.
- **Est. Time: ~60s** | **Success: Yes** | **Score: 7.8**
- **Issues:** [Polish] Streak badge could be larger/more celebratory.

#### I-3: Add Stakeholder + Generate Feedback Link (Target: < 2 min)

**All personas:**

- Navigate to Stakeholders page. Form is clear: name, email, relationship, phone.
- Relationship field has no examples (peer? manager? direct report?).
- After adding: feedback link appears with copy button + expiration time.
- Phone prompt interrupts flow if user doesn't have stakeholder's phone.
- No celebration after adding stakeholder.
- **Est. Time: ~90s** | **Success: Yes** | **Score: 6.8**
- **Issues:** [Minor] Relationship field no examples. [Minor] Phone prompt interrupts. [Minor] No celebration/success animation.

#### I-4: Review AI Insights + Ask Follow-up (Target: < 5 min)

**All personas:**

- Insights page: Streaming AI report generation feels premium (skeleton → sections appearing).
- 6 distinct section colors (purple, blue, teal, emerald, amber, indigo) — too many. Cognitive overload.
- Metrics grid (Stability /100, Trajectory +5, Alignment 85%) — different scales, no explanation.
- Chat: Suggested questions reduce friction. Streaming responses feel natural. But no session persistence (refresh = lose conversation).
- **Est. Time: ~4 min** | **Success: Yes** | **Score: 7.0**
- **Issues:** [Major] 6 section colors — cognitive overload. [Major] Metrics have no explanation. [Minor] Chat loses history on refresh.

#### I-5: Scorecard Review (Target: < 3 min)

**All personas:**

- Week navigator works. Gap visualization (score—gap—score) is clever but requires learning.
- Color coding: green (aligned), amber (moderate), red (large gap) — intuitive.
- Trend badges ("Gap closing") lack direction/magnitude info.
- **Est. Time: ~2 min** | **Success: Yes** | **Score: 7.0**
- **Issues:** [Minor] Gap visualization needs learning. [Minor] Trend badge lacks detail.

#### I-6: Start New Cycle (Target: < 3 min)

**All personas:**

- New Cycle form is VERY long: objective mode toggle, cycle name, start date, duration (4 presets + custom), check-in days (presets + 7-day picker), feedback reminder days, reveal scores toggle, stakeholder cadence.
- No progress indicator. No preview before submit. Server-side validation only.
- **Est. Time: ~5 min** | **Success: Yes** | **Score: 5.5**
- **Issues:** [Major] Form too long, no steps/progress. [Major] No preview before submit. [Minor] Server-only validation.

#### I-7: First Return Visit, Day 3 (Observe)

**All personas:**

- Hub shows: next check-in date, completion progress (0%), streak (0).
- If no check-in available today, user sees "Check-in not yet available — Opens on [DATE]."
- No guidance on what to do in the meantime. No "explore your dashboard" or "add stakeholders" nudge.
- James would think: "Nothing to do here. Why did I come?"
- **Score: 5.5**
- **Issues:** [Major] No guidance when no action available. [Minor] Empty hub feels static.

---

## 2. Coach Baseline (Weight: 0.30)

### Dimension Scores

| #   | Dimension                 | Score |  Weight  | Weighted | Key Evidence                                                                                                                                                                    |
| --- | ------------------------- | :---: | :------: | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | First Impression (FI)     |  6.5  |    8%    |   0.52   | Dashboard is clean but sparse. Roster split view is functional but clinical. Session page is overwhelmingly long.                                                               |
| 2   | Clarity of Purpose (CP)   |  7.0  |   10%    |   0.70   | Dashboard explains role. Roster is clear. Session: too much info without clear "prepare for session" focus.                                                                     |
| 3   | Onboarding Ease (OE)      |  6.5  |   12%    |   0.78   | 3-step wizard is brief. No pre-fill in onboarding (available on full invite page but not here). "Skip" available.                                                               |
| 4   | Core Task Flow (CT)       |  6.5  |   15%    |  0.975   | Session page is the core screen but requires heavy scrolling. AI prep is at top (good) but notes form is at bottom. Week number must be manually entered for notes.             |
| 5   | Info Architecture (IA)    |  6.0  |   12%    |   0.72   | 4 main sections + sidebar. Analytics hidden in "More" on mobile. Breadcrumbs inconsistent.                                                                                      |
| 6   | Feedback & Progress (FP)  |  5.5  |   10%    |   0.55   | AI generation has skeleton (good). Toast on note save. No indication of AI generation time. No loading skeletons for roster/dashboard.                                          |
| 7   | Cognitive Load (CL)       |  5.5  |    8%    |   0.44   | Session page loads everything at once (AI insights, alerts, reflections, stakeholder feedback, chart, notes). Analytics table: 8 columns. Invite pre-fill accordion is complex. |
| 8   | Trust & Credibility (TC)  |  7.0  |    8%    |   0.56   | AI insights labeled. Professional invite copy. Notes are private.                                                                                                               |
| 9   | Emotional Engagement (EE) |  5.0  |    7%    |   0.35   | No coach milestones. No celebrations for first client invited, first AI prep, etc. Alert system is clinical.                                                                    |
| 10  | Value Perception (VP)     |  6.5  |   10%    |   0.65   | AI prep is genuinely valuable. Analytics gives portfolio view. No export, no comparison, no customization.                                                                      |
|     | **Total**                 |       | **100%** | **6.27** |                                                                                                                                                                                 |

### Scenario Walkthroughs

#### C-1: Coach Onboarding + Invite First Client (Target: < 5 min)

**Sarah Williams (Digital-Native Coach):**

- 3-step wizard is clean. "How It Works" step explains the system well.
- Invite form is simplified vs full page — no pre-fill for objective/stakeholders.
- Sarah would immediately want to pre-fill her client's objective. Can't do it here.
- **Est. Time: ~3 min** | **Success: Yes** | **Score: 6.5**
- **Issues:** [Major] No pre-fill in onboarding. [Minor] "Skip" is too easy — coach lands on empty dashboard.

**Dr. Robert Kim (Traditional Coach):**

- Wizard is simple enough. "How It Works" cards are helpful for understanding the system.
- Would struggle with the invite form if email is wrong (no inline validation).
- **Est. Time: ~5 min** | **Success: Yes** | **Score: 6.0**
- **Issues:** [Minor] No inline email validation. [Minor] No guidance on what happens after invite.

**Amara Johnson (Scale-Focused Coach):**

- Would immediately ask: "Can I invite 10 clients at once?" No.
- Pre-fill not available in onboarding. Would need to go to Invitations page for that.
- **Est. Time: ~3 min** | **Success: Partial** | **Score: 5.5**
- **Issues:** [Major] No bulk invite. [Major] Pre-fill hidden.

#### C-2: Monday Morning Roster Review (Target: < 2 min)

**Sarah Williams:**

- Roster loads with client list (left) + detail (right). Search works.
- At-risk identification: Need to scan each client's scores and alerts. No sorting by risk/urgency.
- Would want a "needs attention" filter or sort.
- **Est. Time: ~3 min** | **Success: Partial** | **Score: 6.0**
- **Issues:** [Major] No risk/urgency sort or filter. [Minor] Detail panel requires clicking each client.

**Dr. Robert Kim:**

- Would find the split view confusing initially. Which side is "the list"?
- Client detail panel shows a lot of info — scores, notes, objective — but no clear summary.
- **Est. Time: ~5 min** | **Success: Partial** | **Score: 5.0**
- **Issues:** [Major] No quick summary per client. [Minor] Split view not obvious for low-tech users.

**Amara Johnson (30+ clients):**

- 30 clients in left panel = heavy scroll. Search helps but no filter by status/urgency.
- Would want: "Sort by: Most overdue, Lowest scores, Most alerts."
- **Est. Time: ~4 min** | **Success: Partial** | **Score: 5.0**
- **Issues:** [Major] No filtering/sorting by urgency. [Major] No batch view of alerts.

#### C-3: Pre-Session Deep Dive (Target: < 5 min)

**All coaches:**

- Navigate to Session page (Roster → click client). Page is extremely long.
- AI prep at top — must generate if not cached. Generation takes seconds, skeleton loader shown.
- Reflections timeline: All weeks expanded. Must scroll through to find recent ones.
- Coach notes at very bottom — must scroll past everything to add a note.
- No "jump to" or tab navigation within the page.
- **Est. Time: ~6 min** | **Success: Yes** | **Score: 5.5**
- **Issues:** [Major] Page too long, no tabs/sections. [Major] Notes at bottom. [Minor] Week number for notes is manual entry.

#### C-4: Analytics Review (Target: < 3 min)

**All coaches:**

- 4 metric cards are clear. Table is data-rich with 8 sortable columns.
- Color-coding for scores (green/amber/red) is intuitive.
- But: "Stability", "Trajectory", "Alignment" are unexplained. What does Stability 72/100 mean?
- No export. No drill-down from chart weeks. No saved views.
- **Est. Time: ~3 min** | **Success: Yes** | **Score: 6.5**
- **Issues:** [Major] Metrics unexplained. [Major] No export. [Minor] Table may need horizontal scroll on mobile.

#### C-5: Invite New Client with Prefilled Data (Target: < 4 min)

**All coaches:**

- Must navigate to Invitations page (not from onboarding).
- Pre-fill accordion is collapsed by default — coach must discover it.
- When expanded: objective, sub-objectives (up to 3), stakeholders (up to 3), cycle settings.
- It's comprehensive but visually overwhelming.
- No indication that pre-fill exists until coach scrolls and clicks accordion.
- **Est. Time: ~5 min** | **Success: Yes** | **Score: 5.5**
- **Issues:** [Major] Pre-fill accordion hidden. [Minor] Too many fields when expanded. [Minor] No indication pre-fill exists.

---

## 3. Stakeholder Baseline (Weight: 0.25)

### Dimension Scores

| #   | Dimension                 | Score |  Weight  | Weighted | Key Evidence                                                                                                                 |
| --- | ------------------------- | :---: | :------: | :------: | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | First Impression (FI)     |  8.0  |   12%    |   0.96   | Professional email templates with gradient headers. Clean feedback form. Branded header with tagline.                        |
| 2   | Clarity of Purpose (CP)   |  8.5  |   15%    |  1.275   | Email: "60-Second Feedback." Form explains exactly what to rate. Objective shown for context.                                |
| 3   | Onboarding Ease (OE)      |  9.0  |    8%    |   0.72   | No signup. Token link. First-time welcome modal. Auto-save draft. Previous ratings pre-loaded.                               |
| 4   | Core Task Flow (CT)       |  7.5  |   20%    |   1.50   | Click link → Rate → Submit. 11-button grid adds cognitive load. Only 2 required inputs + optional comment. 60s achievable.   |
| 5   | Info Architecture (IA)    |  8.5  |    5%    |  0.425   | Single page, single purpose. Perfect simplicity.                                                                             |
| 6   | Feedback & Progress (FP)  |  7.5  |   10%    |   0.75   | Success animation. Score reveal after 500ms delay. Spinner during submit. No progress indicator during form.                 |
| 7   | Cognitive Load (CL)       |  7.0  |   15%    |   1.05   | 11-button grid per score (22 buttons total). Welcome modal adds a step. But form is short overall.                           |
| 8   | Trust & Credibility (TC)  |  8.0  |   10%    |   0.80   | No signup. Professional branding. Growth mindset framing. Empathetic expired token page. But: no explicit privacy statement. |
| 9   | Emotional Engagement (EE) |  7.0  |    3%    |   0.21   | Score reveal is delightful. Thank-you email is appreciative. Minimal celebration after submit.                               |
| 10  | Value Perception (VP)     |  7.5  |    2%    |   0.15   | Score reveal gives immediate reciprocal value. "Blind spots" framing is powerful.                                            |
|     | **Total**                 |       | **100%** | **7.84** |                                                                                                                              |

### Scenario Walkthroughs

#### S-1: First-time Feedback Submission (Target: < 90 sec)

**Marcus Taylor (Willing Colleague):**

- Opens email on iPhone between meetings. Subject: "60-Second Feedback: How's [Name] Doing?"
- Clicks "Share Feedback" — form loads with welcome modal.
- Welcome modal: "Your perspective reveals blind spots..." — reads it quickly, clicks "Got it."
- Sees objective + behaviors to observe. Scrolls to rating buttons.
- 11 buttons (0-10) per score on mobile: 6-column grid. Buttons are h-10 but narrow on iPhone.
- Taps effort 7, performance 6. Skips comment. Submits.
- Success animation + score reveal after 500ms. Done.
- **Est. Time: ~75s** | **Success: Yes** | **Score: 7.8**
- **Issues:** [Minor] Mobile button grid is cramped. [Polish] Welcome modal adds 10s.

**Linda Park (Skeptical Manager):**

- Opens email in Outlook on desktop. Subject line is clear. Sender: "Forbetra" — unfamiliar.
- Scans email: sees individual's name, "60 seconds", objective context. Cautiously clicks.
- Form loads. No signup — good. Branded header — looks professional.
- But: no privacy statement. Where does this go? Who sees it? Linda hesitates.
- Reads welcome modal. "Your identity is always associated with your ratings" — NOT stated. Concern.
- Completes form anyway (desktop: 11-column grid is spacious). Submits.
- **Est. Time: ~2 min** | **Success: Yes** | **Score: 7.0**
- **Issues:** [Major] No privacy statement on form. [Minor] Unfamiliar sender brand. [Minor] No "who sees this" clarity.

#### S-2: Score Reveal Experience (Observe)

**Both personas:**

- After submit: "Feedback submitted!" success banner (green, animated).
- 500ms delay → score reveal card slides up from bottom.
- "Here's what [Name] rated themselves:" — shows effort and performance side by side.
- Marcus: "Interesting, they rated effort lower than I did." Feels collaborative.
- Linda: "Wait, they can see what I rated?" — reveal is reciprocal, but wasn't explained before submitting.
- **Score: 7.5**
- **Issues:** [Minor] Reveal wasn't signposted before submission. [Polish] Could explain reveal upfront.

#### S-3: Return Visit Feedback, 4th Time (Target: < 60 sec)

**Marcus Taylor:**

- Familiar flow by now. No welcome modal (only shown first time).
- Previous ratings shown: "Last time you rated effort 7." Auto-save draft if he started and closed.
- Adjusts scores. Submits. Done.
- **Est. Time: ~45s** | **Success: Yes** | **Score: 8.5**
- **Issues:** [Polish] Could pre-fill with last week's scores as starting point.

**Linda Park:**

- Trusts the system by 4th time. Form is familiar. Quick submission.
- **Est. Time: ~50s** | **Success: Yes** | **Score: 8.0**
- **Issues:** None significant.

#### S-4: Expired Token Handling (Observe)

**Both personas:**

- Click old email link → redirect to `/stakeholder/invalid`.
- Page: "This feedback link is no longer valid" + "It may have been used already or expired."
- No CTA (correct — nothing user can do). Suggests contacting the participant.
- **Score: 7.5**
- **Issues:** [Minor] Could show participant's name for context. [Polish] Could offer "Request new link" button.

---

## 4. Validated Issue Catalog

### Critical Issues (P0) — Score Impact: -3 to -4

_None found._ No task is fully blocked. The app is functional.

### Major Issues (P1) — Score Impact: -2 to -3

| #   | Issue                                                                                               | User Types | Dimensions | Freq | Effort | Priority Score |
| --- | --------------------------------------------------------------------------------------------------- | :--------: | :--------: | :--: | :----: | :------------: |
| 1   | ~~**Individual hub: 8-12 information zones**~~ — **FIXED Phase A.** 10→5 zones.                     |     I      | CL, IA, FI |  3   |  M(2)  |     0.203      |
| 2   | **11-button rating scale (0-10)** — **VETOED.** Product owner: integral to ratings philosophy.      |    I, S    |   CT, CL   |  3   |  M(2)  |     0.191      |
| 3   | ~~**Coach session page: no tabs/sections**~~ — **FIXED Phase A.** 4 tabs added.                     |     C      | CL, IA, CT |  3   |  M(2)  |     0.158      |
| 4   | **No celebration/feedback after key milestones** — **VETOED (animations).** Replaced with empties.  |    All     |   EE, FP   |  2   |  S(1)  |     0.132      |
| 5   | ~~**Coach pre-fill feature hidden in accordion**~~ — **FIXED Phase A.** Toggle switch + onboarding. |     C      |   OE, CT   |  2   |  S(1)  |     0.108      |
| 6   | ~~**New Cycle form: too long, no steps/progress**~~ — **FIXED Phase B.** 3-step wizard.             |     I      |   CL, CT   |  1   |  M(2)  |     0.101      |
| 7   | ~~**Coach roster: no risk/urgency sort**~~ — **FIXED Phase A.** 3-way sort dropdown.                |     C      |   CT, IA   |  3   |  M(2)  |     0.095      |
| 8   | ~~**No guidance when no action available**~~ — **FIXED Phase A.** Adaptive empty states.            |     I      | FP, EE, VP |  2   |  S(1)  |     0.090      |
| 9   | ~~**Metrics unexplained everywhere**~~ — **FIXED Phase A.** One-line definitions + tooltips.        |    I, C    |   CL, CP   |  2   |  S(1)  |     0.087      |
| 10  | ~~**Insights: 6 section colors**~~ — **FIXED Phase B.** Consolidated to 3 semantic groups.          |     I      |   CL, FI   |  2   |  S(1)  |     0.081      |
| 11  | ~~**No privacy statement on stakeholder form**~~ — **FIXED Phase A.** Added to welcome modal.       |     S      |     TC     |  1   |  S(1)  |     0.075      |
| 12  | ~~**Coach analytics: no export**~~ — **FIXED Phase B.** CSV export button.                          |     C      |   VP, CT   |  2   |  L(3)  |     0.065      |
| 13  | **No bulk invite for coaches** — one-at-a-time paradigm for 30+ clients                             |     C      |     CT     |  1   |  L(3)  |     0.045      |

### Minor Issues (P2) — Score Impact: -1 to -2

| #   | Issue                                                                                                | User Types | Dimensions | Freq | Effort | Priority Score |
| --- | ---------------------------------------------------------------------------------------------------- | :--------: | :--------: | :--: | :----: | :------------: |
| 14  | ~~Behavioral indicators collapsed by default~~ — **FIXED Phase A.** Auto-expand on first check-in.   |     I      |   CT, CL   |  3   |  S(1)  |     0.068      |
| 15  | Mobile tab bar hides History, Ask, Settings in "More"                                                |     I      |     IA     |  3   |  S(1)  |     0.054      |
| 16  | ~~Relationship field on stakeholder form has no examples~~ — **FIXED Phase C.** Placeholder updated. |     I      |   CP, CT   |  2   |  S(1)  |     0.045      |
| 17  | Chat loses history on page refresh (state only)                                                      |     I      |   FP, VP   |  2   |  M(2)  |     0.038      |
| 18  | ~~Stakeholder comment placeholder is vague~~ — **FIXED Phase C.** Structured prompt.                 |     S      |   CT, VP   |  2   |  S(1)  |     0.038      |
| 19  | ~~Coach notes week number requires manual entry~~ — **RESOLVED.** Already auto-populates.            |     C      |   CT, CL   |  3   |  S(1)  |     0.036      |
| 20  | ~~Score reveal not signposted before submission~~ — **FIXED Phase C.** Signpost added.               |     S      |   TC, EE   |  1   |  S(1)  |     0.035      |
| 21  | History page: all weeks expanded, no search/filter                                                   |     I      |   IA, CL   |  1   |  M(2)  |     0.030      |
| 22  | Read-only check-in shows disabled form instead of summary                                            |     I      |   FP, CL   |  1   |  M(2)  |     0.028      |
| 23  | ~~No loading skeletons on hub/roster initial load~~ — **N/A.** SSR renders with data.                |    I, C    |     FP     |  3   |  S(1)  |     0.027      |
| 24  | Hub/Dashboard distinction unclear                                                                    |     I      |   CP, IA   |  2   |  L(3)  |     0.023      |
| 25  | ~~Invite form doesn't clear after success~~ — **FIXED Phase C.** Form + prefill reset on success.    |     C      |     CT     |  2   |  S(1)  |     0.022      |
| 26  | Desktop sidebar color contrast may be low                                                            |     I      |   FI, TC   |  3   |  S(1)  |     0.020      |

### Polish Issues (P3) — Score Impact: -0.5 to -1

| #   | Issue                                                   | User Types | Dimensions |
| --- | ------------------------------------------------------- | :--------: | :--------: |
| 27  | No confetti/celebration on onboarding completion        |     I      |     EE     |
| 28  | Streak badge could be larger/more prominent             |     I      |     EE     |
| 29  | Character counter (500) not explained upfront           |    I, S    |     CL     |
| 30  | Copy-to-clipboard toast disappears in 2s (too fast)     |    I, C    |     FP     |
| 31  | Preview mode badge may overlap content on small screens |     I      |     FI     |
| 32  | Analytics chart "16 weeks" cutoff is arbitrary          |     C      |     VP     |
| 33  | Expired token page could show participant name          |     S      |     TC     |
| 34  | Thank-you email philosophical quote feels disconnected  |     S      |     EE     |

---

## 5. Score-Lift Prioritization

Sorted by Priority Score (descending). These are the fixes that will move the platform score most per unit of effort.

| Rank | Issue                                                               | Priority Score | Est. Platform Lift | Phase |
| :--: | ------------------------------------------------------------------- | :------------: | :----------------: | :---: |
|  1   | Hub: reduce 8-12 zones to 4-5 focused cards                         |     0.203      |       +0.20        |   A   |
|  2   | Replace 11-button grid with simpler input (5-point or slider)       |     0.191      |       +0.18        |   A   |
|  3   | Coach session: add tabs (Prep / Timeline / Notes / Chart)           |     0.158      |       +0.14        |   A   |
|  4   | Add celebrations after key milestones                               |     0.132      |       +0.12        |   A   |
|  5   | Surface coach pre-fill (promote from accordion, show in onboarding) |     0.108      |       +0.10        |   A   |
|  6   | New Cycle: split into 3 steps with progress indicator               |     0.101      |       +0.09        |   B   |
|  7   | Coach roster: add urgency sort + alert filter                       |     0.095      |       +0.09        |   A   |
|  8   | Add adaptive empty states ("nothing to do" guidance)                |     0.090      |       +0.08        |   A   |
|  9   | Add metric definitions (tooltips or help text)                      |     0.087      |       +0.08        |   A   |
|  10  | Consolidate insight section colors (3 max)                          |     0.081      |       +0.07        |   B   |
|  11  | Add privacy statement to stakeholder form                           |     0.075      |       +0.06        |   A   |
|  12  | Coach analytics: add CSV export                                     |     0.065      |       +0.05        |   B   |
|  13  | Expand behavioral indicators on first check-in                      |     0.068      |       +0.06        |   A   |
|  14  | Coach bulk invite capability                                        |     0.045      |       +0.04        |   C   |

**Phase A actual lift: +0.40** (6.87 → 7.27, 2 items vetoed)
**Phase B actual lift: +0.12** (7.27 → 7.39, 3 fixes + landing copy)
**Remaining gap: 1.91 points to 9.3 target**

---

## 6. Phase A Results

### Delivered

- [x] **Hub restructure** — 10 zones → 5: Top Bar, Hero Next Action, At-a-Glance (2 cards), Quick Insight (1) + AI teaser, Recent Activity. Max width reduced to `max-w-3xl`.
- [x] **Coach session tabs** — 4 tabs: Prep (AI + alerts), Timeline, Notes, Chart. Alert indicator dot on Prep tab.
- [x] **Surface pre-fill** — Accordion → visible toggle switch with description. Added mention in coach onboarding step 3.
- [x] **Roster urgency sort** — 3-way sort: Needs attention / Name / Recent.
- [x] **Adaptive empty states** — Hub shows contextual guidance: "Appears after your first check-in", "Appears when stakeholders respond", "Your first check-in opens on [Day]" with stakeholder add nudge.
- [x] **Privacy statement** — Added to stakeholder feedback welcome modal: "Your feedback is shared with [Name] and their coach. Your name is attached to your ratings."
- [x] **Metric definitions** — One-line definitions on insights page (Stability, Trajectory, Alignment). Title tooltips on coach roster.
- [x] **Auto-expand behavioral indicators** — Expanded by default on first check-in (`!data.previousEntry && data.currentWeek <= 1`).

### Vetoed by Product Owner

- **Rating input simplification** — "The 10-point scale is integral to how I think about ratings." 11-button grid stays.
- **Celebration animations** — "Success animations seem very cheesy." Replaced with adaptive empty states approach.

### Phase A Dimension Scores

#### Individual (was 6.73 → 7.20, +0.47)

| #   | Dimension                 | Baseline | Phase A | Delta | Evidence                                                                                                     |
| --- | ------------------------- | :------: | :-----: | :---: | ------------------------------------------------------------------------------------------------------------ |
| 1   | First Impression (FI)     |   7.0    | **7.5** | +0.5  | Hub: clean 5-zone layout, max-w-3xl, hero card. Data-curated vs data-dense.                                  |
| 2   | Clarity of Purpose (CP)   |   7.5    | **8.0** | +0.5  | Hero next-action makes purpose instant. Metric definitions explain data. Empty states explain what's coming. |
| 3   | Onboarding Ease (OE)      |   6.5    | **6.8** | +0.3  | Behavioral indicators auto-expand on first check-in. No scoring guide (vetoed).                              |
| 4   | Core Task Flow (CT)       |   7.0    | **7.3** | +0.3  | Hero card points to check-in. Auto-expand indicators help first-timers. 11-button grid unchanged.            |
| 5   | Info Architecture (IA)    |   6.0    | **7.0** | +1.0  | 10 zones → 5. Clear hierarchy: action → data → insight → history.                                            |
| 6   | Feedback & Progress (FP)  |   7.0    | **7.5** | +0.5  | Adaptive empty states. AI insight teaser with "Read →".                                                      |
| 7   | Cognitive Load (CL)       |   5.5    | **6.5** | +1.0  | Zones halved. Single insight instead of 3. Two metric cards instead of 4. 11-button grid still drags.        |
| 8   | Trust & Credibility (TC)  |   7.5    | **7.5** |   0   | No Individual trust changes.                                                                                 |
| 9   | Emotional Engagement (EE) |   6.5    | **6.8** | +0.3  | Empty states feel helpful. Hub feels focused. No celebrations (vetoed).                                      |
| 10  | Value Perception (VP)     |   7.0    | **7.3** | +0.3  | AI insight teaser on hub. Metric definitions make data interpretable.                                        |

#### Coach (was 6.27 → 6.85, +0.58)

| #   | Dimension                 | Baseline | Phase A | Delta | Evidence                                                                                              |
| --- | ------------------------- | :------: | :-----: | :---: | ----------------------------------------------------------------------------------------------------- |
| 1   | First Impression (FI)     |   6.5    | **7.0** | +0.5  | Session page: clean tabbed UI. Roster: sort controls.                                                 |
| 2   | Clarity of Purpose (CP)   |   7.0    | **7.5** | +0.5  | "Prep" tab clearly labeled. Pre-fill toggle has description. Metric tooltips.                         |
| 3   | Onboarding Ease (OE)      |   6.5    | **7.0** | +0.5  | Pre-fill mentioned in onboarding step 3 with Invitations link.                                        |
| 4   | Core Task Flow (CT)       |   6.5    | **7.5** | +1.0  | Session tabs: Prep visible, Notes one click. Pre-fill is a toggle. Roster sort finds at-risk clients. |
| 5   | Info Architecture (IA)    |   6.0    | **7.0** | +1.0  | 4 clear tabs on session. Roster sort. Content organized by task.                                      |
| 6   | Feedback & Progress (FP)  |   5.5    | **6.0** | +0.5  | Alert dot on Prep tab. Empty states for Timeline/Chart with no data.                                  |
| 7   | Cognitive Load (CL)       |   5.5    | **6.5** | +1.0  | Session: one tab at a time. Pre-fill: toggle vs accordion. Metric tooltips.                           |
| 8   | Trust & Credibility (TC)  |   7.0    | **7.0** |   0   | No coach trust changes.                                                                               |
| 9   | Emotional Engagement (EE) |   5.0    | **5.0** |   0   | No celebrations (vetoed). Still clinical.                                                             |
| 10  | Value Perception (VP)     |   6.5    | **7.0** | +0.5  | Urgency sort surfaces value. Tabs make AI prep prominent.                                             |

#### Stakeholder (was 7.84 → 7.89, +0.05)

| #   | Dimension                | Baseline | Phase A | Delta | Evidence                                                                             |
| --- | ------------------------ | :------: | :-----: | :---: | ------------------------------------------------------------------------------------ |
| 8   | Trust & Credibility (TC) |   8.0    | **8.5** | +0.5  | Privacy statement addresses Linda Park's hesitation. All other dimensions unchanged. |

## 7. Phase B Results

### Delivered

- [x] **New Cycle wizard** — 13+ fields in one scroll → 3-step wizard (Objective → Schedule → Settings). Progress dots with back-navigation, per-step validation, review summary card before submit.
- [x] **Insight color consolidation** — 6 distinct colors → 3 semantic groups: purple (Executive Summary, Progress Trajectory = overview), emerald (Key Strengths, Recommendations = positive/action), amber (Perception Analysis, Growth Opportunities = attention).
- [x] **Coach analytics CSV export** — "Export CSV" button in header, downloads full client comparison table (Name, Objective, Effort, Performance, Stability, Trajectory, Completion %, Alerts).
- [x] **Landing page copy** — Rewrote marketing copy with grounded language. Removed jargon ("behavioral science", "cognitive clarity"). Added clearer value propositions.

### Phase B Dimension Scores

#### Individual (was 7.20 → 7.44, +0.24)

| #   | Dimension                 | Phase A | Phase B | Delta | Evidence                                                                                           |
| --- | ------------------------- | :-----: | :-----: | :---: | -------------------------------------------------------------------------------------------------- |
| 1   | First Impression (FI)     |   7.5   | **7.7** | +0.2  | Insight colors coherent (3 semantic groups). Wizard progress dots polished. Low-frequency screens. |
| 2   | Clarity of Purpose (CP)   |   8.0   | **8.2** | +0.2  | Wizard step labels make purpose instant. Review summary confirms intent before submit.             |
| 3   | Onboarding Ease (OE)      |   6.8   | **7.0** | +0.2  | Wizard reduces new-cycle setup anxiety. Guided 3-step flow vs wall of fields.                      |
| 4   | Core Task Flow (CT)       |   7.3   | **7.5** | +0.2  | Per-step validation prevents errors. But new-cycle is 1x per cycle (low frequency).                |
| 5   | Info Architecture (IA)    |   7.0   | **7.3** | +0.3  | 13 fields → 3 logical groups. Insight colors semantically grouped.                                 |
| 6   | Feedback & Progress (FP)  |   7.5   | **7.8** | +0.3  | Progress dots + step validation + review summary = strong progress visibility.                     |
| 7   | Cognitive Load (CL)       |   6.5   | **7.0** | +0.5  | Biggest win. 13→4 fields per step. 6→3 colors. Both directly reduce cognitive overhead.            |
| 8   | Trust & Credibility (TC)  |   7.5   | **7.7** | +0.2  | Review summary before "Start Cycle" lets user confirm choices.                                     |
| 9   | Emotional Engagement (EE) |   6.8   | **6.9** | +0.1  | Wizard feels guided. No celebrations (vetoed). Marginal.                                           |
| 10  | Value Perception (VP)     |   7.3   | **7.4** | +0.1  | Wizard doesn't change value proposition, just delivery. Marginal.                                  |

#### Coach (was 6.85 → 6.89, +0.04)

| #   | Dimension             | Phase A | Phase B | Delta | Evidence                                                                       |
| --- | --------------------- | :-----: | :-----: | :---: | ------------------------------------------------------------------------------ |
| 4   | Core Task Flow (CT)   |   7.5   | **7.6** | +0.1  | Export adds capability but isn't the core repeated task (session prep).        |
| 10  | Value Perception (VP) |   7.0   | **7.3** | +0.3  | CSV export resolves "no export" issue. Amara can pull data into own reporting. |
|     | All others            |    —    |    —    |   0   | No changes to coach screens beyond analytics export.                           |

#### Stakeholder (was 7.89 → 7.89, 0)

No Phase B changes affected stakeholder screens.

---

## 8. Score Update Log

| Date       | Phase          | Platform | Individual | Coach | Stakeholder | Notes                                   |
| ---------- | -------------- | :------: | :--------: | :---: | :---------: | --------------------------------------- |
| 2026-02-28 | Baseline       |   6.87   |    6.73    | 6.27  |    7.84     | Full codebase walkthrough, all personas |
| 2026-02-28 | Phase A actual |   7.27   |    7.20    | 6.85  |    7.89     | 8 fixes shipped, 2 vetoed. +0.40 lift.  |
| 2026-02-28 | Phase B actual |   7.39   |    7.44    | 6.89  |    7.89     | 3 fixes + landing copy. +0.12 lift.     |
|            | Phase D target |   9.3+   |    9.3+    | 9.0+  |    9.5+     | Final goal                              |
