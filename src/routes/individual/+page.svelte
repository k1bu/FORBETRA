<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { Flame, AlertTriangle, Calendar, CircleCheck, Rocket, TrendingUp, TrendingDown, ArrowRight, MessageSquare, User } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	if (!data) {
		throw new Error('Page data is missing');
	}

	// Stakeholder detail expansion
	let showSubgoals = $state(false);

	// Cycle extension
	let extending = $state(false);
	let extendError = $state<string | null>(null);
	let extendSuccess = $state(false);

	async function extendCycle(weeks: number) {
		if (!data.cycle) return;
		extending = true;
		extendError = null;
		try {
			const res = await fetch('/api/cycle/extend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cycleId: data.cycle.id, weeks })
			});
			if (!res.ok) {
				const err = await res.json();
				extendError = err.error ?? 'Something went wrong';
				return;
			}
			extendSuccess = true;
			// Refresh data to reflect new endDate
			setTimeout(() => invalidateAll(), 1000);
		} catch {
			extendError = 'Network error. Please try again.';
		} finally {
			extending = false;
		}
	}

	// Quick insights — pattern-based, derived from existing data
	const quickInsights = $derived((() => {
		const insights: Array<{ text: string; tone: 'positive' | 'warning' | 'neutral' }> = [];
		if (!data.isOnboardingComplete) return insights;

		const my = data.myLastRatings;
		const stk = data.stakeholdersLastRatings;
		const metrics = data.cycleMetrics;
		const gaps = data.perceptionGaps ?? [];

		// Effort trend
		if (my?.effortChange !== null && my?.effortChange !== undefined) {
			if (my.effortChange >= 1) {
				insights.push({ text: 'Your effort is climbing — keep it up.', tone: 'positive' });
			} else if (my.effortChange <= -1) {
				insights.push({ text: 'Your effort dipped this week. Worth a check-in with yourself.', tone: 'warning' });
			}
		}

		// Performance trend
		if (my?.performanceChange !== null && my?.performanceChange !== undefined) {
			if (my.performanceChange >= 1) {
				insights.push({ text: 'Performance trending up — nice momentum.', tone: 'positive' });
			} else if (my.performanceChange <= -1) {
				insights.push({ text: 'Performance slipped a bit. What shifted?', tone: 'warning' });
			}
		}

		// Effort up but performance flat/down
		if (my?.effortChange !== null && my?.performanceChange !== null &&
			my?.effortChange !== undefined && my?.performanceChange !== undefined &&
			my.effortChange >= 0.5 && my.performanceChange <= -0.5) {
			insights.push({ text: 'You\'re putting in more effort but performance isn\'t following yet — could be a lag or a strategy issue.', tone: 'neutral' });
		}

		// Stakeholder alignment
		if (stk?.effortChange !== null && stk?.effortChange !== undefined && stk.effortChange >= 1) {
			insights.push({ text: 'Stakeholders are noticing more effort from you.', tone: 'positive' });
		}
		if (stk?.performanceChange !== null && stk?.performanceChange !== undefined && stk.performanceChange >= 1) {
			insights.push({ text: 'Stakeholders see your performance improving.', tone: 'positive' });
		}

		// Big perception gaps
		const bigGaps = gaps.filter(g => g.maxAbsGap > 2);
		if (bigGaps.length > 0) {
			const name = bigGaps[0].stakeholderName;
			const isEffort = Math.abs(bigGaps[0].effortGap ?? 0) > Math.abs(bigGaps[0].performanceGap ?? 0);
			const gap = isEffort ? bigGaps[0].effortGap : bigGaps[0].performanceGap;
			if (gap !== null) {
				const metric = isEffort ? 'effort' : 'performance';
				const direction = gap > 0 ? 'higher' : 'lower';
				insights.push({ text: `You rate your ${metric} ${direction} than ${name} does — worth a conversation.`, tone: 'warning' });
			}
		}

		// Closing gaps
		const closingGaps = gaps.filter(g => g.effortGapTrend === 'closing' || g.performanceGapTrend === 'closing');
		if (closingGaps.length > 0) {
			insights.push({ text: `Perception gap with ${closingGaps[0].stakeholderName} is closing — alignment improving.`, tone: 'positive' });
		}

		// Stability
		if (metrics?.stabilityScore !== null && metrics?.stabilityScore !== undefined) {
			if (metrics.stabilityScore >= 80) {
				insights.push({ text: 'Your scores are very consistent — strong stability.', tone: 'positive' });
			} else if (metrics.stabilityScore < 40) {
				insights.push({ text: 'Your scores are fluctuating a lot — what\'s driving the swings?', tone: 'warning' });
			}
		}

		// Trajectory
		if (metrics?.trajectoryScore !== null && metrics?.trajectoryScore !== undefined) {
			if (metrics.trajectoryScore >= 15) {
				insights.push({ text: 'Strong upward trajectory over the last 4 weeks.', tone: 'positive' });
			} else if (metrics.trajectoryScore <= -15) {
				insights.push({ text: 'Scores are trending down over the last 4 weeks.', tone: 'warning' });
			}
		}

		// Cap at 3 most relevant
		return insights.slice(0, 3);
	})());

</script>

<svelte:head>
	<title>Today | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
	<!-- Top bar: welcome + week -->
	<div class="flex items-center justify-between">
		<p class="text-sm text-text-tertiary">
			{#if data.isFirstVisit}Welcome to Forbetra{:else}Welcome back{/if}
		</p>
		<div class="flex items-center gap-2">
			{#if data.summary?.currentStreak && data.summary.currentStreak > 0}
				<span class="rounded-full bg-surface-subtle px-3 py-0.5 text-xs font-semibold text-warning flex items-center gap-1">
					<Flame class="h-3.5 w-3.5" /> {data.summary.currentStreak}{#if data.summary.currentStreak >= 12}+ streak!{:else if data.summary.currentStreak >= 9} streak!{:else if data.summary.currentStreak >= 6} streak{:else if data.summary.currentStreak >= 3} streak{:else} streak{/if}
				</span>
			{/if}
			{#if data.currentWeek}
				{#if data.cycle?.isCycleCompleted}
					<span class="rounded-full bg-surface-subtle px-3 py-0.5 text-xs font-semibold text-success">Cycle Complete</span>
				{:else if data.cycle?.isOverdue}
					<span class="rounded-full bg-surface-subtle px-3 py-0.5 text-xs font-semibold text-warning">Week {data.currentWeek} &middot; Cycle ended at week {data.totalWeeks}</span>
				{:else}
					<span class="rounded-full bg-surface-subtle px-3 py-0.5 text-xs font-semibold text-accent">Week {data.currentWeek}{#if data.totalWeeks} of {data.totalWeeks}{/if}</span>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Cycle completed banner -->
	{#if data.cycle?.isCycleCompleted}
		<div class="flex flex-wrap items-center gap-3 rounded-xl border border-success/20 bg-success-muted px-4 py-3">
			<div class="flex-1 min-w-0">
				<p class="text-sm font-semibold text-success">Your cycle is complete! Your growth report is ready.</p>
				<p class="text-xs text-success">Review your progress or start a new cycle when you're ready.</p>
			</div>
			<a
				href="/individual/insights"
				class="shrink-0 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
			>
				See Your Growth Report
			</a>
			<a
				href="/individual/new-cycle"
				class="shrink-0 rounded-lg border border-success/20 bg-surface-raised px-4 py-1.5 text-xs font-semibold text-success hover:bg-success-muted transition-colors"
			>
				Start New Cycle
			</a>
		</div>
	{/if}

	<!-- Cycle overdue banner -->
	{#if data.cycle?.isOverdue && !data.cycle?.isCycleCompleted && !extendSuccess}
		<div class="flex flex-wrap items-center gap-3 rounded-xl border border-warning/20 bg-warning-muted px-4 py-3">
			<div class="flex-1 min-w-0">
				<p class="text-sm font-semibold text-warning">Your cycle has passed its end date.</p>
				<p class="text-xs text-warning">Extend to keep tracking, or wrap up when you're ready.</p>
			</div>
			{#if extendError}
				<span class="text-xs text-error">{extendError}</span>
			{/if}
			<button
				onclick={() => extendCycle(4)}
				disabled={extending}
				class="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
			>
				{#if extending}Extending...{:else}Extend 4 weeks{/if}
			</button>
		</div>
	{/if}
	{#if extendSuccess}
		<div class="flex items-center gap-2 rounded-xl border border-success/20 bg-success-muted px-4 py-3">
			<span class="text-sm font-semibold text-success">Cycle extended! Reloading...</span>
		</div>
	{/if}

	<!-- Objective Card -->
	{#if data.objective}
		<div class="rounded-xl border border-border-default bg-surface-raised p-6">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
				<!-- Objective + subgoals -->
				<div class="flex-1 min-w-0">
					<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Your Objective</p>
					<h1 class="text-xl font-bold text-text-primary sm:text-2xl">{data.objective.title}</h1>

					<!-- Expandable subgoals -->
					{#if data.objective.subgoals && data.objective.subgoals.length > 0}
						<button
							onclick={() => showSubgoals = !showSubgoals}
							class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
						>
							<svg class="h-3.5 w-3.5 transition-transform {showSubgoals ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							{data.objective.subgoals.length} sub-objective{data.objective.subgoals.length === 1 ? '' : 's'}
						</button>
						{#if showSubgoals}
							<ul class="mt-2 space-y-1 pl-1">
								{#each data.objective.subgoals as subgoal}
									<li class="flex items-start gap-2 text-sm text-text-secondary">
										<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
										{subgoal.label}
									</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</div>

				<!-- Intention anchor (right side on desktop) -->
				{#if data.identityAnchor}
					<div class="sm:max-w-[40%] shrink-0 rounded-xl bg-accent-muted p-3">
						<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">Week 1 Intention</p>
						<p class="text-sm italic text-accent leading-snug">"{data.identityAnchor}"</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Welcome to Week 1 guidance card -->
	{#if data.isOnboardingComplete && data.currentWeek === 1 && data.summary && data.summary.totalCompleted === 0}
		<div class="rounded-xl border border-accent/20 bg-accent-muted p-6">
			<h2 class="text-lg font-bold text-text-primary mb-3">Welcome to your first week!</h2>
			<ul class="space-y-2 text-sm text-text-secondary">
				<li class="flex items-start gap-2">
					<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
					Your first check-in is on {data.nextCheckInDay}
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
					Rate your effort and performance on a 0-10 scale
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
					Your stakeholders will provide their perspective
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
					AI will surface patterns after 2 weeks of data
				</li>
			</ul>
		</div>
	{/if}

	<!-- At a Glance -->
	{#if data.isOnboardingComplete && (data.myLastRatings || data.stakeholdersLastRatings || data.currentWeek || data.summary)}
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			<!-- Self Effort -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Your Effort</p>
				{#if data.myLastRatings?.effort !== null && data.myLastRatings?.effort !== undefined}
					<p class="text-3xl font-bold tabular-nums text-cyan-400">{data.myLastRatings.effort}</p>
					{#if data.myLastRatings.effortChange !== null && data.myLastRatings.effortChange !== undefined}
						<p class="mt-0.5 text-xs {data.myLastRatings.effortChange > 0 ? 'text-success' : data.myLastRatings.effortChange < 0 ? 'text-error' : 'text-text-muted'}">
							{data.myLastRatings.effortChange > 0 ? '+' : ''}{data.myLastRatings.effortChange.toFixed(1)} from last week
						</p>
					{/if}
				{:else}
					<p class="text-2xl font-bold text-text-muted">--</p>
				{/if}
			</div>

			<!-- Self Performance -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Your Performance</p>
				{#if data.myLastRatings?.performance !== null && data.myLastRatings?.performance !== undefined}
					<p class="text-3xl font-bold tabular-nums text-amber-400">{data.myLastRatings.performance}</p>
					{#if data.myLastRatings.performanceChange !== null && data.myLastRatings.performanceChange !== undefined}
						<p class="mt-0.5 text-xs {data.myLastRatings.performanceChange > 0 ? 'text-success' : data.myLastRatings.performanceChange < 0 ? 'text-error' : 'text-text-muted'}">
							{data.myLastRatings.performanceChange > 0 ? '+' : ''}{data.myLastRatings.performanceChange.toFixed(1)} from last week
						</p>
					{/if}
				{:else}
					<p class="text-2xl font-bold text-text-muted">--</p>
				{/if}
			</div>

			<!-- Stakeholder Average -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Stakeholder Avg</p>
				{#if data.stakeholdersLastRatings?.effort !== null && data.stakeholdersLastRatings?.effort !== undefined}
					<div class="flex items-baseline gap-3">
						<span class="text-lg font-bold tabular-nums text-cyan-400">{data.stakeholdersLastRatings.effort}<span class="text-xs font-normal text-text-muted"> E</span></span>
						{#if data.stakeholdersLastRatings?.performance !== null && data.stakeholdersLastRatings?.performance !== undefined}
							<span class="text-lg font-bold tabular-nums text-amber-400">{data.stakeholdersLastRatings.performance}<span class="text-xs font-normal text-text-muted"> P</span></span>
						{/if}
					</div>
					{#if data.stakeholdersLastRatings.weekNumber}
						<p class="mt-0.5 text-[10px] text-text-muted">Week {data.stakeholdersLastRatings.weekNumber}</p>
					{/if}
				{:else}
					<p class="text-2xl font-bold text-text-muted">--</p>
					<p class="mt-0.5 text-[10px] text-text-muted">No feedback yet</p>
				{/if}
			</div>

			<!-- Completion Rate -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Completion</p>
				{#if data.summary?.completionRate !== null && data.summary?.completionRate !== undefined}
					<p class="text-3xl font-bold tabular-nums text-accent">{data.summary.completionRate}%</p>
					<p class="mt-0.5 text-[10px] text-text-muted">{data.summary.totalCompleted}/{data.summary.totalExpected} check-ins</p>
				{:else}
					<p class="text-2xl font-bold text-text-muted">--</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Quick Insights -->
	{#if quickInsights.length > 0}
		<div class="flex flex-col gap-1.5">
			{#each quickInsights as insight}
				<div class="flex items-start gap-2 rounded-lg px-3 py-2 bg-surface-raised">
					<span class="mt-0.5 shrink-0">
						{#if insight.tone === 'positive'}<TrendingUp class="h-3.5 w-3.5 shrink-0 text-success" />{:else if insight.tone === 'warning'}<TrendingDown class="h-3.5 w-3.5 shrink-0 text-warning" />{:else}<ArrowRight class="h-3.5 w-3.5 shrink-0 text-text-muted" />{/if}
					</span>
					<p class="text-sm text-text-secondary">{insight.text}</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Recent Notes -->
	{#if data.recentNotes && data.recentNotes.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Recent Notes</p>
			<div class="flex flex-col gap-3">
				{#each data.recentNotes as note}
					<div class="flex items-start gap-2">
						{#if note.source === 'self'}
							<User class="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
						{:else}
							<MessageSquare class="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-sm text-text-secondary">{note.text}</p>
							<p class="mt-0.5 text-[10px] text-text-muted">
								{#if note.source === 'self'}You{:else}{note.name}{/if} &middot; Week {note.weekNumber}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Onboarding Status -->
	{#if !data.isOnboardingComplete}
		<div class="rounded-xl border border-warning/20 bg-surface-raised p-4">
			<div class="flex items-center gap-3">
				<Rocket class="h-4 w-4 shrink-0 text-warning" />
				<div class="flex-1">
					<p class="text-sm font-semibold text-warning">Complete your onboarding to get started</p>
				</div>
				<a href="/onboarding" class="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
					Start
				</a>
			</div>
		</div>
	{/if}

	<!-- What to Do Next — slim banner -->
	{#if data.isOnboardingComplete && data.nextAction}
		{#if data.nextAction.url}
			<a
				href={data.nextAction.url}
				class="group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all {data.nextAction.state === 'missed' ? 'border-error/30 bg-error-muted' : 'border-border-default bg-surface-raised hover:border-accent/30'}"
			>
				<span>
					{#if data.nextAction.state === 'missed'}<AlertTriangle class="h-4 w-4 text-error" />{:else if data.nextAction.state === 'upcoming'}<Calendar class="h-4 w-4 text-accent" />{:else}<CircleCheck class="h-4 w-4 text-success" />{/if}
				</span>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-text-primary truncate">{data.nextAction.label}</p>
				</div>
				<span class="shrink-0 text-xs font-semibold {data.nextAction.state === 'missed' ? 'text-error' : 'text-accent'} transition-transform group-hover:translate-x-0.5">
					{#if data.nextAction.state === 'missed'}Complete now →{:else}Go →{/if}
				</span>
			</a>
		{:else}
			<div class="flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3">
				<CircleCheck class="h-4 w-4 text-success" />
				<p class="text-sm font-medium text-text-secondary">{data.nextAction.label}</p>
			</div>
		{/if}
	{/if}
</section>
