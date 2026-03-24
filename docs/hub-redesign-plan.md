# Individual Hub Redesign — Implementation Plan

Tri-model validated (Claude + Gemini + OpenAI, March 2026). Addresses expert panel C+ rating for cognitive overload.

## Architecture Decision

**Approach 2 + 4 + 1 hybrid:**

- **Tab structure** (Approach 2): Today / Progress / Scorecard — three tabs matching user intent
- **Question-first** (Approach 4): Today tab answers "What should I do THIS WEEK?" with minimal supporting data
- **Maturity-gated** (Approach 1): Progress and Scorecard tabs hide advanced features until enough data exists

**Implementation strategy**: Client-side tabs on the existing `/individual` route (not nested routes). This avoids conflicts with existing deep-dive routes (`/individual/scorecard`, `/individual/dashboard`, `/individual/feedback`) which remain as full-page destinations.

## Current State → Target State

### Current (6 zones, all rendered simultaneously)

```
Zone 1: Header (welcome, goal, week badge, streak)
Zone 2: Primary CTA (next action / overdue / cycle complete)
Zone 3: At-a-Glance Scores (4 score cards)
Zone 4: Trend Chart (Chart.js)
Zone 5: Perception Gap Summary (top 3 gaps)
Zone 6: AI Insight Teaser
Footer: Trust badges, coach, privacy
```

### Target (3 tabs, one rendered at a time)

```
[Today]  [Progress]  [Scorecard]

Today (default):
  - Header: "What should you focus on this week?" (not "Welcome back, Marc")
  - Primary CTA: Next action card (prominent, single focus)
  - Weekly intention (if set)
  - Identity anchor (goal + subgoals, collapsed)
  - AI insight teaser (1 card)
  - Journey progress bar

Progress:
  - At-a-Glance scores (4 cards)
  - Trend chart (Chart.js)
  - Heat map weeks (GATED: visible only when currentWeek >= 4)
  - Completion metrics (streak, rate, total)
  - Link to /individual/dashboard for full analytics

Scorecard:
  - Self vs reviewer comparison (effort + performance)
  - Perception gap summary (top 3)
  - Gap severity indicators
  - GATED: Full stakeholder breakdown (visible when >= 2 stakeholders have rated)
  - Link to /individual/feedback for full view
```

## Implementation Steps

### Step 1: Refactor `+page.server.ts` — Split data loading

Current: 147-line monolith loads everything sequentially.
Target: 3 focused data functions, only Today loads on initial render.

```
load() → returns:
  - todayData (always loaded — lightweight)
  - progressData (null on initial load)
  - scorecardData (null on initial load)
  - maturityStage: 'new' | 'growing' | 'established'
```

Maturity stages (based on completed check-ins):

- **New**: 0–3 check-ins → hide heat map, hide stakeholder breakdown
- **Growing**: 4–11 → show heat map, still gate full stakeholder breakdown
- **Established**: 12+ → show everything

### Step 2: Add API endpoints for lazy tab loading

```
POST /api/individual/progress-data  → returns progressData
POST /api/individual/scorecard-data → returns scorecardData
```

These mirror the data shapes currently computed in `+page.server.ts` but are called on-demand when the user switches tabs. Auth via Clerk — same pattern as existing API routes.

### Step 3: Create tab component

New component: `src/lib/components/HubTabs.svelte`

```
- Tab bar (3 tabs, fixed position on mobile)
- Active tab state (Svelte $state rune)
- URL param sync (?tab=today|progress|scorecard)
- Lazy loading: fetch tab data on first activation, cache in component state
- Loading skeleton per tab
```

### Step 4: Redesign Today tab — Question-first

Replace current Zone 1 + 2 with a single-focus layout:

```svelte
<!-- Primary: What to do -->
<ActionCard>
	<!-- Full-width, prominent -->
	{#if overdue}
		"You're overdue — check in now" + button
	{:else if cycleComplete}
		Journey complete — view insights / start new
	{:else}
		"Check in {dayName}" + countdown or "Check in now" if today
	{/if}
</ActionCard>

<!-- Secondary: Context -->
<WeeklyIntention />
<!-- If set, one line -->
<GoalAnchor />
<!-- Collapsed by default -->
<InsightTeaser />
<!-- Single card, link to /insights -->
<JourneyProgress />
<!-- Thin progress bar -->
```

### Step 5: Redesign Progress tab — Maturity-gated

```svelte
<ScoreCards scores={atAGlance} />
<!-- Always visible -->
<TrendChart data={chartData} />
<!-- Always visible -->

{#if maturityStage !== 'new'}
	<HeatMap weeks={heatMapWeeks} />
{/if}

<CompletionMetrics {streak} rate={completionRate} />

<a href="/individual/dashboard">View full analytics →</a>
```

### Step 6: Redesign Scorecard tab — Maturity-gated

```svelte
<SelfVsReviewer self={selfRatings} reviewer={reviewerRatings} />

<PerceptionGaps gaps={topGaps} />

{#if hasMultipleStakeholderRatings}
	<StakeholderBreakdown stakeholders={perceptionGaps} />
{/if}

<a href="/individual/feedback">View full feedback →</a>
```

### Step 7: Update mobile nav

Current bottom bar has 5 tabs (Home, Check-in, Feedback, Insights, Scorecard). The hub redesign doesn't change the bottom nav — it changes what "Home" renders. The in-hub tab bar is a secondary navigation within the Home view.

### Step 8: Parallelize remaining server queries

In `+page.server.ts`, wrap independent Prisma queries in `Promise.all`:

```typescript
const [completionMetrics, latestInsight, selfRatings, reviewerRatings] = await Promise.all([
	getCompletionMetrics(dbUserId, cycle.id),
	getLatestInsight(dbUserId),
	getSelfRatings(dbUserId, cycle.id),
	getReviewerRatings(dbUserId, cycle.id)
]);
```

## Files Modified

| File                                                  | Change                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/routes/individual/+page.server.ts`               | Split into todayData-only initial load + maturityStage computation        |
| `src/routes/individual/+page.svelte`                  | Replace 6-zone layout with tab container + Today/Progress/Scorecard views |
| `src/routes/api/individual/progress-data/+server.ts`  | NEW — lazy load endpoint                                                  |
| `src/routes/api/individual/scorecard-data/+server.ts` | NEW — lazy load endpoint                                                  |
| `src/lib/components/HubTabs.svelte`                   | NEW — tab bar component                                                   |
| `src/lib/components/ActionCard.svelte`                | NEW — question-first primary CTA                                          |

## What Stays the Same

- `/individual/+layout.svelte` — sidebar/bottom nav unchanged
- `/individual/+layout.server.ts` — shared context unchanged
- All existing child routes — scorecard, dashboard, feedback, etc. remain as deep-dive pages
- Onboarding flow — redirects still handled by layout
- Footer trust badges / coach info

## Performance Impact

- **Initial load**: ~60% fewer Prisma queries (Today data only vs everything)
- **Tab switch**: ~200ms per lazy load (single-purpose query)
- **Parallelized queries**: Remaining sequential queries wrapped in Promise.all

## Risk Mitigation

- Tab state persists in URL param (`?tab=progress`) so refresh doesn't lose context
- Existing deep-dive pages untouched — no regression risk on /scorecard, /dashboard, /feedback
- Loading skeletons prevent layout shift during lazy loads
- Maturity gates use simple numeric thresholds — easy to adjust if stages feel wrong
