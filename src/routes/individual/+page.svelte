<script lang="ts">
	import type { PageData } from './$types';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { Flame, AlertTriangle, Calendar, CircleCheck, Rocket, LayoutDashboard, BarChart3, Users, History, MessageSquare, TrendingUp, TrendingDown, ArrowRight, ChevronRight } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const { data }: { data: PageData } = $props();

	const validViews = ['today', 'progress', 'scorecard'] as const;
	type View = typeof validViews[number];

	const activeView = $derived<View>((() => {
		const param = $page.url.searchParams.get('view');
		return validViews.includes(param as View) ? (param as View) : 'today';
	})());

	function setView(view: View) {
		const url = new URL($page.url);
		if (view === 'today') {
			url.searchParams.delete('view');
		} else {
			url.searchParams.set('view', view);
		}
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	if (!data) {
		throw new Error('Page data is missing');
	}

	function trendColor(change: number | null): string {
		if (change === null) return 'bg-text-muted';
		if (change > 0) return 'bg-green-500';
		if (change < 0) return 'bg-red-500';
		return 'bg-text-tertiary';
	}

	// Stakeholder detail expansion
	let showStakeholderDetail = $state(false);
	let showDetailedHeatStrip = $state(false);
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
			// Reload to reflect new endDate
			setTimeout(() => window.location.reload(), 1000);
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

	// Heat map color helpers — self (dark-adapted)
	function effortBg(score: number): string {
		if (score >= 8) return 'bg-cyan-700/40 text-cyan-200';
		if (score >= 6) return 'bg-cyan-800/30 text-cyan-300';
		if (score >= 4) return 'bg-cyan-800/25 text-cyan-300';
		if (score >= 1) return 'bg-cyan-900/20 text-cyan-400';
		return 'bg-surface-raised text-text-muted';
	}

	function perfBg(score: number): string {
		if (score >= 8) return 'bg-amber-700/40 text-amber-200';
		if (score >= 6) return 'bg-amber-800/30 text-amber-300';
		if (score >= 4) return 'bg-amber-800/25 text-amber-300';
		if (score >= 1) return 'bg-amber-900/20 text-amber-400';
		return 'bg-surface-raised text-text-muted';
	}

	// Stakeholder colors — teal/emerald to differentiate from self (dark-adapted)
	function shEffortBg(score: number): string {
		if (score >= 8) return 'bg-teal-700/40 text-teal-200';
		if (score >= 6) return 'bg-teal-800/30 text-teal-300';
		if (score >= 4) return 'bg-teal-800/25 text-teal-300';
		if (score >= 1) return 'bg-teal-900/20 text-teal-400';
		return 'bg-surface-raised text-text-muted';
	}

	function shPerfBg(score: number): string {
		if (score >= 8) return 'bg-emerald-700/40 text-emerald-200';
		if (score >= 6) return 'bg-emerald-800/30 text-emerald-300';
		if (score >= 4) return 'bg-emerald-800/25 text-emerald-300';
		if (score >= 1) return 'bg-emerald-900/20 text-emerald-400';
		return 'bg-surface-raised text-text-muted';
	}

</script>

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

	<!-- Tab Navigation -->
	{#if data.isOnboardingComplete}
		<nav class="flex gap-1 rounded-xl border border-border-default bg-surface-raised p-1">
			{#each [
				{ id: 'today', label: 'Today' },
				{ id: 'progress', label: 'Progress' },
				{ id: 'scorecard', label: 'Scorecard' }
			] as tab}
				<button
					onclick={() => setView(tab.id as View)}
					class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all
						{activeView === tab.id ? 'bg-surface-subtle text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}"
				>
					{tab.label}
				</button>
			{/each}
		</nav>
	{/if}

	{#if activeView === 'today'}
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
				View Cycle Report
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
		<div class="rounded-lg border border-border-default bg-surface-raised p-5">
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
				class="group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all {data.nextAction.state === 'missed' ? 'border-border-default bg-surface-raised' : 'border-border-default bg-surface-raised'}"
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
	{/if}<!-- end today view -->

	<!-- Latest Ratings Scorecard -->
	{#if activeView === 'scorecard'}
	{#if data.myLastRatings && data.latestScorecard && data.latestScorecard.length > 0}
		<div class="rounded-lg border border-border-default bg-surface-raised p-6">
			<h2 class="mb-1 text-lg font-bold text-text-primary">Latest Ratings</h2>
			<p class="mb-4 text-xs text-text-muted">How you see yourself vs. how each stakeholder sees you. Negative gap = they rated you lower.</p>

			<!-- Summary row: You vs Stakeholder Avg -->
			<div class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-surface-subtle px-4 py-3">
				<!-- Your scores -->
				<div class="flex items-center gap-3">
					<span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted">You</span>
					{#if data.myLastRatings.effort !== null}
						<div class="flex items-center gap-1">
							<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {effortBg(data.myLastRatings.effort)}">{data.myLastRatings.effort}</div>
							{#if data.myLastRatings.effortChange !== null && data.myLastRatings.weekNumber && data.myLastRatings.weekNumber > 1}
								<span class="text-[10px] font-semibold {data.myLastRatings.effortChange >= 0 ? 'text-success' : 'text-error'}">{data.myLastRatings.effortChange > 0 ? '+' : ''}{data.myLastRatings.effortChange.toFixed(1)}</span>
							{/if}
						</div>
					{/if}
					{#if data.myLastRatings.performance !== null}
						<div class="flex items-center gap-1">
							<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {perfBg(data.myLastRatings.performance)}">{data.myLastRatings.performance}</div>
							{#if data.myLastRatings.performanceChange !== null && data.myLastRatings.weekNumber && data.myLastRatings.weekNumber > 1}
								<span class="text-[10px] font-semibold {data.myLastRatings.performanceChange >= 0 ? 'text-success' : 'text-error'}">{data.myLastRatings.performanceChange > 0 ? '+' : ''}{data.myLastRatings.performanceChange.toFixed(1)}</span>
							{/if}
						</div>
					{/if}
				</div>
				<!-- Stakeholder avg -->
				{#if data.stakeholdersLastRatings && (data.stakeholdersLastRatings.effort !== null || data.stakeholdersLastRatings.performance !== null)}
					<div class="h-4 w-px bg-border-strong"></div>
					<div class="flex items-center gap-3">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Stk Avg</span>
						{#if data.stakeholdersLastRatings.effort !== null}
							<div class="flex items-center gap-1">
								<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {effortBg(data.stakeholdersLastRatings.effort)}">{data.stakeholdersLastRatings.effort}</div>
								{#if data.stakeholdersLastRatings.effortChange !== null && data.stakeholdersLastRatings.weekNumber && data.stakeholdersLastRatings.weekNumber > 1}
									<span class="text-[10px] font-semibold {data.stakeholdersLastRatings.effortChange >= 0 ? 'text-success' : 'text-error'}">{data.stakeholdersLastRatings.effortChange > 0 ? '+' : ''}{data.stakeholdersLastRatings.effortChange.toFixed(1)}</span>
								{/if}
							</div>
						{/if}
						{#if data.stakeholdersLastRatings.performance !== null}
							<div class="flex items-center gap-1">
								<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {perfBg(data.stakeholdersLastRatings.performance)}">{data.stakeholdersLastRatings.performance}</div>
								{#if data.stakeholdersLastRatings.performanceChange !== null && data.stakeholdersLastRatings.weekNumber && data.stakeholdersLastRatings.weekNumber > 1}
									<span class="text-[10px] font-semibold {data.stakeholdersLastRatings.performanceChange >= 0 ? 'text-success' : 'text-error'}">{data.stakeholdersLastRatings.performanceChange > 0 ? '+' : ''}{data.stakeholdersLastRatings.performanceChange.toFixed(1)}</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
				<!-- Week label -->
				{#if data.myLastRatings.weekNumber}
					<span class="ml-auto text-[10px] text-text-muted">Wk {data.myLastRatings.weekNumber}</span>
				{/if}
			</div>

			<div class="grid gap-2 grid-cols-2 sm:grid-cols-4">
				{#each data.latestScorecard as row}
					{@const effortGap = (data.myLastRatings.effort !== null && row.stakeholderEffort !== null) ? Number((row.stakeholderEffort - data.myLastRatings.effort).toFixed(1)) : null}
					{@const perfGap = (data.myLastRatings.performance !== null && row.stakeholderPerformance !== null) ? Number((row.stakeholderPerformance - data.myLastRatings.performance).toFixed(1)) : null}
					{@const maxGap = Math.max(Math.abs(effortGap ?? 0), Math.abs(perfGap ?? 0))}
					{@const gapData = (data.perceptionGaps ?? []).find(g => g.stakeholderId === row.stakeholderId)}
					<div class="rounded-lg border p-2.5 {maxGap > 2 ? 'border-error/30' : maxGap > 1 ? 'border-warning/30' : 'border-border-default'}">
						<!-- Column labels -->
						<div class="mb-1.5 flex items-end justify-between">
							<span class="text-[9px] font-semibold uppercase tracking-wider text-text-muted">You</span>
							<span class="text-[9px] font-semibold uppercase tracking-wider text-text-muted truncate max-w-[60%] text-right">{row.stakeholderName}</span>
						</div>

						<!-- Effort row -->
						<div class="mb-1">
							<p class="mb-0.5 text-[10px] font-medium text-text-tertiary">Effort</p>
							<div class="flex items-center gap-0.5">
								{#if data.myLastRatings.effort !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {effortBg(data.myLastRatings.effort)}">{data.myLastRatings.effort}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
								{/if}
								{#if effortGap !== null}
									<div class="flex flex-1 items-center gap-0.5">
										<div class="h-px flex-1 {Math.abs(effortGap) <= 1 ? 'bg-green-300' : Math.abs(effortGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
										<span class="text-[9px] font-bold {Math.abs(effortGap) <= 1 ? 'text-success' : Math.abs(effortGap) <= 2 ? 'text-warning' : 'text-error'}">
											{effortGap > 0 ? '+' : ''}{effortGap}
										</span>
										<div class="h-px flex-1 {Math.abs(effortGap) <= 1 ? 'bg-green-300' : Math.abs(effortGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
									</div>
								{:else}
									<div class="flex flex-1 items-center"><div class="h-px flex-1 bg-border-default"></div></div>
								{/if}
								{#if row.stakeholderEffort !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {effortBg(row.stakeholderEffort)}">{row.stakeholderEffort}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
								{/if}
							</div>
						</div>

						<!-- Performance row -->
						<div>
							<p class="mb-0.5 text-[10px] font-medium text-text-tertiary">Performance</p>
							<div class="flex items-center gap-0.5">
								{#if data.myLastRatings.performance !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {perfBg(data.myLastRatings.performance)}">{data.myLastRatings.performance}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
								{/if}
								{#if perfGap !== null}
									<div class="flex flex-1 items-center gap-0.5">
										<div class="h-px flex-1 {Math.abs(perfGap) <= 1 ? 'bg-green-300' : Math.abs(perfGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
										<span class="text-[9px] font-bold {Math.abs(perfGap) <= 1 ? 'text-success' : Math.abs(perfGap) <= 2 ? 'text-warning' : 'text-error'}">
											{perfGap > 0 ? '+' : ''}{perfGap}
										</span>
										<div class="h-px flex-1 {Math.abs(perfGap) <= 1 ? 'bg-green-300' : Math.abs(perfGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
									</div>
								{:else}
									<div class="flex flex-1 items-center"><div class="h-px flex-1 bg-border-default"></div></div>
								{/if}
								{#if row.stakeholderPerformance !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {perfBg(row.stakeholderPerformance)}">{row.stakeholderPerformance}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
								{/if}
							</div>
						</div>

						<!-- Trend indicator -->
						{#if gapData && (gapData.effortGapTrend || gapData.performanceGapTrend)}
							<div class="mt-1.5 border-t border-border-default pt-1.5">
								{#if gapData.effortGapTrend === 'closing' || gapData.performanceGapTrend === 'closing'}
									<p class="text-[9px] text-success">Gap closing</p>
								{:else if gapData.effortGapTrend === 'widening' || gapData.performanceGapTrend === 'widening'}
									<p class="text-[9px] text-error">Gap widening</p>
								{:else}
									<p class="text-[9px] text-text-muted">Gap stable</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
	{/if}<!-- end scorecard view -->

	<!-- Insight Visualizations -->
	{#if activeView === 'progress'}
	{#if data.isOnboardingComplete && data.heatMapWeeks && data.heatMapWeeks.length > 0}
		<!-- Performance & Effort Chart -->
		{#if data.visualizationData && data.visualizationData.individual.length > 0}
			<div class="rounded-lg border border-border-default bg-surface-raised p-6">
				<PerformanceEffortChart
					individualData={data.visualizationData.individual}
					stakeholderData={data.visualizationData.stakeholders}
					stakeholders={data.visualizationData.stakeholderList}
				/>
			</div>
		{/if}

		<!-- Detailed Heat Strip (behind toggle) -->
		<div class="rounded-lg border border-border-default bg-surface-raised p-6">
			<button
				onclick={() => showDetailedHeatStrip = !showDetailedHeatStrip}
				class="flex w-full items-center justify-between text-left"
			>
				<span class="text-sm font-medium text-text-secondary">Show detailed week-by-week scores</span>
				<svg class="h-5 w-5 text-text-muted transition-transform {showDetailedHeatStrip ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if showDetailedHeatStrip}
				<div class="mt-4">
					<!-- Heat Strip Table -->
					<div class="overflow-x-auto pb-2">
						<table class="w-full border-collapse">
							<thead>
								<tr>
									<th scope="col" class="w-24 pb-2 pr-2 text-right text-xs font-medium text-text-muted">Week</th>
									{#each data.heatMapWeeks as week}
										<th scope="col" class="pb-2 text-center text-xs font-bold {week.weekNumber === data.currentWeek ? 'text-accent' : 'text-text-tertiary'}" style="min-width: 2.75rem;">
											{week.weekNumber}
											{#if week.weekNumber === data.currentWeek}
												<div class="mx-auto mt-0.5 h-0.5 w-4 rounded bg-accent"></div>
											{/if}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="pr-2 py-0.5 text-right text-xs font-semibold text-cyan-400">My Effort</td>
									{#each data.heatMapWeeks as week}
										{@const isCurrent = week.weekNumber === data.currentWeek}
										{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
										<td class="p-0.5 text-center">
											{#if week.effort !== null}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {effortBg(week.effort)} {isCurrent ? 'ring-2 ring-accent ring-offset-1' : ''}">
													{week.effort}
												</div>
											{:else if isFuture}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-border-default text-xs text-text-muted">-</div>
											{:else}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-surface-subtle text-xs text-text-muted">-</div>
											{/if}
										</td>
									{/each}
								</tr>
								<tr>
									<td class="pr-2 py-0.5 text-right text-xs font-semibold text-amber-400">My Perf</td>
									{#each data.heatMapWeeks as week}
										{@const isCurrent = week.weekNumber === data.currentWeek}
										{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
										<td class="p-0.5 text-center">
											{#if week.performance !== null}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {perfBg(week.performance)} {isCurrent ? 'ring-2 ring-accent ring-offset-1' : ''}">
													{week.performance}
												</div>
											{:else if isFuture}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-border-default text-xs text-text-muted">-</div>
											{:else}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-surface-subtle text-xs text-text-muted">-</div>
											{/if}
										</td>
									{/each}
								</tr>

								{#if data.stakeholderAvgHeatMap && data.stakeholderAvgHeatMap.length > 0}
									<tr>
										<td colspan={data.heatMapWeeks.length + 1} class="py-1">
											<div class="border-t border-border-default"></div>
										</td>
									</tr>
									<tr>
										<td class="pr-2 py-0.5 text-right text-xs font-semibold text-teal-400">Stk Effort</td>
										{#each data.stakeholderAvgHeatMap as week}
											{@const isCurrent = week.weekNumber === data.currentWeek}
											{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
											<td class="p-0.5 text-center">
												{#if week.effort !== null}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {shEffortBg(week.effort)} {isCurrent ? 'ring-2 ring-accent ring-offset-1' : ''}">
														{week.effort}
													</div>
												{:else if isFuture}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-border-default text-xs text-text-muted">-</div>
												{:else}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-surface-subtle text-xs text-text-muted">-</div>
												{/if}
											</td>
										{/each}
									</tr>
									<tr>
										<td class="pr-2 py-0.5 text-right text-xs font-semibold text-emerald-400">Stk Perf</td>
										{#each data.stakeholderAvgHeatMap as week}
											{@const isCurrent = week.weekNumber === data.currentWeek}
											{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
											<td class="p-0.5 text-center">
												{#if week.performance !== null}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {shPerfBg(week.performance)} {isCurrent ? 'ring-2 ring-accent ring-offset-1' : ''}">
														{week.performance}
													</div>
												{:else if isFuture}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-border-default text-xs text-text-muted">-</div>
												{:else}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-surface-subtle text-xs text-text-muted">-</div>
												{/if}
											</td>
										{/each}
									</tr>
								{/if}
							</tbody>
						</table>
					</div>

					<!-- Legend -->
					<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-tertiary">
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm bg-cyan-900/20"></div>
							<div class="h-3 w-3 rounded-sm bg-cyan-800/30"></div>
							<div class="h-3 w-3 rounded-sm bg-cyan-700/40"></div>
							<span class="text-cyan-400">My Effort</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm bg-amber-900/20"></div>
							<div class="h-3 w-3 rounded-sm bg-amber-800/30"></div>
							<div class="h-3 w-3 rounded-sm bg-amber-700/40"></div>
							<span class="text-amber-400">My Perf</span>
						</div>
						{#if data.stakeholderAvgHeatMap && data.stakeholderAvgHeatMap.length > 0}
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded-sm bg-teal-900/20"></div>
								<div class="h-3 w-3 rounded-sm bg-teal-800/30"></div>
								<div class="h-3 w-3 rounded-sm bg-teal-700/40"></div>
								<span class="text-teal-400">Stk Effort</span>
							</div>
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded-sm bg-emerald-900/20"></div>
								<div class="h-3 w-3 rounded-sm bg-emerald-800/30"></div>
								<div class="h-3 w-3 rounded-sm bg-emerald-700/40"></div>
								<span class="text-emerald-400">Stk Perf</span>
							</div>
						{/if}
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm border-2 border-dashed border-border-strong"></div>
							<span>Future</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm ring-2 ring-accent"></div>
							<span>Current</span>
						</div>
					</div>

					<!-- Per-Stakeholder Detail Toggle -->
					{#if data.stakeholderDetail && data.stakeholderDetail.length > 0}
						<button
							onclick={() => showStakeholderDetail = !showStakeholderDetail}
							class="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
						>
							<svg class="h-4 w-4 transition-transform {showStakeholderDetail ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							{showStakeholderDetail ? 'Hide' : 'Show'} individual stakeholder ratings ({data.stakeholderDetail.length})
						</button>

						{#if showStakeholderDetail}
							<div class="mt-3 space-y-4">
								{#each data.stakeholderDetail as stakeholder}
									<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
										<p class="mb-2 text-sm font-semibold text-text-secondary">{stakeholder.name}</p>
										<div class="overflow-x-auto">
											<table class="w-full border-collapse">
												<thead>
													<tr>
														<th scope="col" class="w-24 pb-1 pr-2 text-right text-xs font-medium text-text-muted">Week</th>
														{#each stakeholder.weeks as week}
															<th scope="col" class="pb-1 text-center text-xs {week.weekNumber === data.currentWeek ? 'font-bold text-accent' : 'text-text-tertiary'}" style="min-width: 2.75rem;">
																{week.weekNumber}
															</th>
														{/each}
													</tr>
												</thead>
												<tbody>
													<tr>
														<td class="pr-2 py-0.5 text-right text-xs font-semibold text-teal-400">Effort</td>
														{#each stakeholder.weeks as week}
															{@const isCurrent = week.weekNumber === data.currentWeek}
															{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
															<td class="p-0.5 text-center">
																{#if week.effort !== null}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded text-xs font-bold {shEffortBg(week.effort)} {isCurrent ? 'ring-2 ring-accent ring-offset-1' : ''}">
																		{week.effort}
																	</div>
																{:else if isFuture}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded border border-dashed border-border-default text-xs text-text-muted">-</div>
																{:else}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded bg-surface-subtle text-xs text-text-muted">-</div>
																{/if}
															</td>
														{/each}
													</tr>
													<tr>
														<td class="pr-2 py-0.5 text-right text-xs font-semibold text-emerald-400">Perf</td>
														{#each stakeholder.weeks as week}
															{@const isCurrent = week.weekNumber === data.currentWeek}
															{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
															<td class="p-0.5 text-center">
																{#if week.performance !== null}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded text-xs font-bold {shPerfBg(week.performance)} {isCurrent ? 'ring-2 ring-accent ring-offset-1' : ''}">
																		{week.performance}
																	</div>
																{:else if isFuture}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded border border-dashed border-border-default text-xs text-text-muted">-</div>
																{:else}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded bg-surface-subtle text-xs text-text-muted">-</div>
																{/if}
															</td>
														{/each}
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</div>

		<!-- Metric Pills -->
		{#if data.cycleMetrics}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<!-- Stability -->
				{#if data.cycleMetrics.stabilityScore !== null}
					{@const stab = data.cycleMetrics.stabilityScore}
					<div class="rounded-lg border border-border-default bg-surface-raised p-3">
						<p class="text-xs font-medium text-text-tertiary">Stability</p>
						<p class="text-2xl font-bold {stab >= 70 ? 'text-success' : stab >= 40 ? 'text-warning' : 'text-error'}">{stab}<span class="text-sm font-normal text-text-muted">/100</span></p>
						<p class="text-xs text-text-muted">Consistency of scores</p>
					</div>
				{/if}

				<!-- Trajectory -->
				{#if data.cycleMetrics.trajectoryScore !== null}
					{@const traj = data.cycleMetrics.trajectoryScore}
					<div class="rounded-lg border border-border-default bg-surface-raised p-3">
						<p class="text-xs font-medium text-text-tertiary">Trajectory</p>
						<p class="text-2xl font-bold {traj > 0 ? 'text-success' : traj < 0 ? 'text-error' : 'text-text-secondary'}">
							{#if traj > 0}↑ +{traj}{:else if traj < 0}↓ {traj}{:else}→ 0{/if}
						</p>
						<p class="text-xs text-text-muted">4-week trend</p>
					</div>
				{/if}

				<!-- Completion -->
				{#if data.cycleMetrics.completionRate !== null}
					<div class="rounded-lg border border-border-default bg-surface-raised p-3">
						<p class="text-xs font-medium text-text-tertiary">Completion</p>
						<p class="text-2xl font-bold text-accent">{data.cycleMetrics.completionRate}%</p>
						<p class="text-xs text-text-muted">Check-ins done</p>
					</div>
				{/if}

				<!-- Alignment -->
				{#if data.cycleMetrics.alignmentRatio !== null}
					<div class="rounded-lg border border-border-default bg-surface-raised p-3">
						<p class="text-xs font-medium text-text-tertiary">Alignment</p>
						<p class="text-2xl font-bold text-accent">{data.cycleMetrics.alignmentRatio}%</p>
						<p class="text-xs text-text-muted">Stakeholder feedback this week</p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
	{/if}<!-- end progress view -->

	<!-- Navigation Cards -->
	{#if activeView === 'today'}
	{#if data.isOnboardingComplete}
		<div class="flex flex-col gap-2">
			<a href="/individual/dashboard" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
				<LayoutDashboard class="h-4 w-4 shrink-0 text-text-muted" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-text-primary">Dashboard</p>
					<p class="truncate text-xs text-text-tertiary">Weekly experiences, check-ins, and cycle progress</p>
				</div>
				<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
			</a>

			<a href="/individual/insights" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
				<BarChart3 class="h-4 w-4 shrink-0 text-text-muted" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-text-primary">Insights</p>
					<p class="truncate text-xs text-text-tertiary">AI report, reflection trends, and stakeholder alignment</p>
				</div>
				<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
			</a>

			<a href="/individual/stakeholders" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
				<Users class="h-4 w-4 shrink-0 text-text-muted" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-text-primary">Stakeholders</p>
					<p class="truncate text-xs text-text-tertiary">Manage feedback providers and generate links</p>
				</div>
				<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
			</a>

			<a href="/individual/history" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
				<History class="h-4 w-4 shrink-0 text-text-muted" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-text-primary">History</p>
					<p class="truncate text-xs text-text-tertiary">Past reflections, ratings, and feedback week by week</p>
				</div>
				<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
			</a>

			<a href="/individual/ask" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
				<MessageSquare class="h-4 w-4 shrink-0 text-text-muted" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-text-primary">Ask About Your Data</p>
					<p class="truncate text-xs text-text-tertiary">Chat with AI about your progress and patterns</p>
				</div>
				<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
			</a>
		</div>
	{/if}
	{/if}<!-- end today view (nav cards) -->
</section>
