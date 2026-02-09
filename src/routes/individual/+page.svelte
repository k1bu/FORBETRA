<script lang="ts">
	import type { PageData } from './$types';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';

	const { data }: { data: PageData } = $props();

	if (!data) {
		throw new Error('Page data is missing');
	}

	// AI Coaching state
	let generating = $state(false);
	let freshInsight = $state<string | null>(null);
	let generateError = $state<string | null>(null);
	let insightExpanded = $state(false);

	// Derived insight content (fresh takes priority)
	let insightContent = $derived(freshInsight ?? data.latestInsight?.content ?? null);

	async function generateSummary() {
		generating = true;
		generateError = null;
		try {
			const res = await fetch('/api/insights/hub-summary', { method: 'POST' });
			if (!res.ok) {
				const err = await res.json();
				generateError = err.error ?? 'Something went wrong';
				return;
			}
			const result = await res.json();
			freshInsight = result.content;
			insightExpanded = true;
		} catch {
			generateError = 'Network error. Please try again.';
		} finally {
			generating = false;
		}
	}

	function truncate(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trimEnd() + '...';
	}

	function trendColor(change: number | null): string {
		if (change === null) return 'bg-neutral-300';
		if (change > 0) return 'bg-green-500';
		if (change < 0) return 'bg-red-500';
		return 'bg-neutral-400';
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

	// Heat map color helpers — self
	function effortBg(score: number): string {
		if (score >= 8) return 'bg-amber-500 text-white';
		if (score >= 6) return 'bg-amber-400 text-amber-900';
		if (score >= 4) return 'bg-amber-300 text-amber-900';
		if (score >= 1) return 'bg-amber-100 text-amber-700';
		return 'bg-neutral-50 text-neutral-400';
	}

	function perfBg(score: number): string {
		if (score >= 8) return 'bg-indigo-600 text-white';
		if (score >= 6) return 'bg-indigo-400 text-white';
		if (score >= 4) return 'bg-indigo-300 text-indigo-900';
		if (score >= 1) return 'bg-indigo-100 text-indigo-700';
		return 'bg-neutral-50 text-neutral-400';
	}

	// Stakeholder colors — teal/emerald to differentiate from self
	function shEffortBg(score: number): string {
		if (score >= 8) return 'bg-teal-600 text-white';
		if (score >= 6) return 'bg-teal-400 text-white';
		if (score >= 4) return 'bg-teal-300 text-teal-900';
		if (score >= 1) return 'bg-teal-100 text-teal-700';
		return 'bg-neutral-50 text-neutral-400';
	}

	function shPerfBg(score: number): string {
		if (score >= 8) return 'bg-emerald-500 text-white';
		if (score >= 6) return 'bg-emerald-400 text-emerald-900';
		if (score >= 4) return 'bg-emerald-300 text-emerald-900';
		if (score >= 1) return 'bg-emerald-100 text-emerald-700';
		return 'bg-neutral-50 text-neutral-400';
	}

</script>

<section class="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
	<!-- Top bar: welcome + week -->
	<div class="flex items-center justify-between">
		<p class="text-sm text-neutral-500">
			{#if data.isFirstVisit}Welcome to Forbetra{:else}Welcome back{/if}
		</p>
		{#if data.currentWeek}
			{#if data.cycle?.isOverdue}
				<span class="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">Week {data.currentWeek} &middot; Cycle ended at week {data.totalWeeks}</span>
			{:else}
				<span class="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">Week {data.currentWeek}{#if data.totalWeeks} of {data.totalWeeks}{/if}</span>
			{/if}
		{/if}
	</div>

	<!-- Cycle overdue banner -->
	{#if data.cycle?.isOverdue && !extendSuccess}
		<div class="flex flex-wrap items-center gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
			<div class="flex-1 min-w-0">
				<p class="text-sm font-semibold text-amber-900">Your cycle has passed its end date.</p>
				<p class="text-xs text-amber-700">Extend to keep tracking, or wrap up when you're ready.</p>
			</div>
			{#if extendError}
				<span class="text-xs text-red-600">{extendError}</span>
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
		<div class="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
			<span class="text-sm font-semibold text-green-700">Cycle extended! Reloading...</span>
		</div>
	{/if}

	<!-- Objective Card -->
	{#if data.objective}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-5 shadow-sm">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
				<!-- Objective + subgoals -->
				<div class="flex-1 min-w-0">
					<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Your Objective</p>
					<h1 class="text-xl font-bold text-neutral-900 sm:text-2xl">{data.objective.title}</h1>

					<!-- Expandable subgoals -->
					{#if data.objective.subgoals && data.objective.subgoals.length > 0}
						<button
							onclick={() => showSubgoals = !showSubgoals}
							class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
						>
							<svg class="h-3.5 w-3.5 transition-transform {showSubgoals ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							{data.objective.subgoals.length} sub-objective{data.objective.subgoals.length === 1 ? '' : 's'}
						</button>
						{#if showSubgoals}
							<ul class="mt-2 space-y-1 pl-1">
								{#each data.objective.subgoals as subgoal}
									<li class="flex items-start gap-2 text-sm text-neutral-600">
										<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
										{subgoal.label}
									</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</div>

				<!-- Intention anchor (right side on desktop) -->
				{#if data.identityAnchor}
					<div class="sm:max-w-[40%] shrink-0 rounded-xl bg-purple-50 p-3">
						<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-400">Week 1 Intention</p>
						<p class="text-sm italic text-purple-700 leading-snug">"{data.identityAnchor}"</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Quick Insights -->
	{#if quickInsights.length > 0}
		<div class="flex flex-col gap-1.5">
			{#each quickInsights as insight}
				<div class="flex items-start gap-2 rounded-lg px-3 py-2 {insight.tone === 'positive' ? 'bg-green-50' : insight.tone === 'warning' ? 'bg-amber-50' : 'bg-neutral-50'}">
					<span class="mt-0.5 shrink-0 text-xs">
						{#if insight.tone === 'positive'}&#9650;{:else if insight.tone === 'warning'}&#9660;{:else}&#9654;{/if}
					</span>
					<p class="text-sm text-neutral-700">{insight.text}</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Onboarding Status -->
	{#if !data.isOnboardingComplete}
		<div class="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm">🚀</div>
				<div class="flex-1">
					<p class="text-sm font-semibold text-amber-900">Complete your onboarding to get started</p>
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
				class="group flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md {data.nextAction.state === 'missed' ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}"
			>
				<span class="text-lg">
					{#if data.nextAction.state === 'missed'}⚠{:else if data.nextAction.state === 'upcoming'}📅{:else}✓{/if}
				</span>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-neutral-800 truncate">{data.nextAction.label}</p>
				</div>
				<span class="shrink-0 text-xs font-semibold {data.nextAction.state === 'missed' ? 'text-red-600' : 'text-blue-600'} transition-transform group-hover:translate-x-0.5">
					{#if data.nextAction.state === 'missed'}Complete now →{:else}Go →{/if}
				</span>
			</a>
		{:else}
			<div class="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
				<span class="text-lg">✓</span>
				<p class="text-sm font-medium text-neutral-600">{data.nextAction.label}</p>
			</div>
		{/if}

	{/if}

	<!-- Latest Ratings Scorecard -->
	{#if data.myLastRatings && data.latestScorecard && data.latestScorecard.length > 0}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<h2 class="mb-1 text-lg font-bold text-neutral-900">Latest Ratings</h2>
			<p class="mb-4 text-xs text-neutral-400">How you see yourself vs. how each stakeholder sees you. Negative gap = they rated you lower.</p>

			<!-- Summary row: You vs Stakeholder Avg -->
			<div class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-neutral-50 px-4 py-3">
				<!-- Your scores -->
				<div class="flex items-center gap-3">
					<span class="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">You</span>
					{#if data.myLastRatings.effort !== null}
						<div class="flex items-center gap-1">
							<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {effortBg(data.myLastRatings.effort)}">{data.myLastRatings.effort}</div>
							{#if data.myLastRatings.effortChange !== null && data.myLastRatings.weekNumber && data.myLastRatings.weekNumber > 1}
								<span class="text-[10px] font-semibold {data.myLastRatings.effortChange >= 0 ? 'text-green-600' : 'text-red-600'}">{data.myLastRatings.effortChange > 0 ? '+' : ''}{data.myLastRatings.effortChange.toFixed(1)}</span>
							{/if}
						</div>
					{/if}
					{#if data.myLastRatings.performance !== null}
						<div class="flex items-center gap-1">
							<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {perfBg(data.myLastRatings.performance)}">{data.myLastRatings.performance}</div>
							{#if data.myLastRatings.performanceChange !== null && data.myLastRatings.weekNumber && data.myLastRatings.weekNumber > 1}
								<span class="text-[10px] font-semibold {data.myLastRatings.performanceChange >= 0 ? 'text-green-600' : 'text-red-600'}">{data.myLastRatings.performanceChange > 0 ? '+' : ''}{data.myLastRatings.performanceChange.toFixed(1)}</span>
							{/if}
						</div>
					{/if}
				</div>
				<!-- Stakeholder avg -->
				{#if data.stakeholdersLastRatings && (data.stakeholdersLastRatings.effort !== null || data.stakeholdersLastRatings.performance !== null)}
					<div class="h-4 w-px bg-neutral-300"></div>
					<div class="flex items-center gap-3">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Stk Avg</span>
						{#if data.stakeholdersLastRatings.effort !== null}
							<div class="flex items-center gap-1">
								<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {effortBg(data.stakeholdersLastRatings.effort)}">{data.stakeholdersLastRatings.effort}</div>
								{#if data.stakeholdersLastRatings.effortChange !== null && data.stakeholdersLastRatings.weekNumber && data.stakeholdersLastRatings.weekNumber > 1}
									<span class="text-[10px] font-semibold {data.stakeholdersLastRatings.effortChange >= 0 ? 'text-green-600' : 'text-red-600'}">{data.stakeholdersLastRatings.effortChange > 0 ? '+' : ''}{data.stakeholdersLastRatings.effortChange.toFixed(1)}</span>
								{/if}
							</div>
						{/if}
						{#if data.stakeholdersLastRatings.performance !== null}
							<div class="flex items-center gap-1">
								<div class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold {perfBg(data.stakeholdersLastRatings.performance)}">{data.stakeholdersLastRatings.performance}</div>
								{#if data.stakeholdersLastRatings.performanceChange !== null && data.stakeholdersLastRatings.weekNumber && data.stakeholdersLastRatings.weekNumber > 1}
									<span class="text-[10px] font-semibold {data.stakeholdersLastRatings.performanceChange >= 0 ? 'text-green-600' : 'text-red-600'}">{data.stakeholdersLastRatings.performanceChange > 0 ? '+' : ''}{data.stakeholdersLastRatings.performanceChange.toFixed(1)}</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
				<!-- Week label -->
				{#if data.myLastRatings.weekNumber}
					<span class="ml-auto text-[10px] text-neutral-400">Wk {data.myLastRatings.weekNumber}</span>
				{/if}
			</div>

			<div class="grid gap-2 grid-cols-2 sm:grid-cols-4">
				{#each data.latestScorecard as row}
					{@const effortGap = (data.myLastRatings.effort !== null && row.stakeholderEffort !== null) ? Number((row.stakeholderEffort - data.myLastRatings.effort).toFixed(1)) : null}
					{@const perfGap = (data.myLastRatings.performance !== null && row.stakeholderPerformance !== null) ? Number((row.stakeholderPerformance - data.myLastRatings.performance).toFixed(1)) : null}
					{@const maxGap = Math.max(Math.abs(effortGap ?? 0), Math.abs(perfGap ?? 0))}
					{@const gapData = (data.perceptionGaps ?? []).find(g => g.stakeholderId === row.stakeholderId)}
					<div class="rounded-lg border p-2.5 {maxGap > 2 ? 'border-red-200' : maxGap > 1 ? 'border-amber-200' : 'border-neutral-200'}">
						<!-- Column labels -->
						<div class="mb-1.5 flex items-end justify-between">
							<span class="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">You</span>
							<span class="text-[9px] font-semibold uppercase tracking-wider text-neutral-400 truncate max-w-[60%] text-right">{row.stakeholderName}</span>
						</div>

						<!-- Effort row -->
						<div class="mb-1">
							<p class="mb-0.5 text-[10px] font-medium text-neutral-500">Effort</p>
							<div class="flex items-center gap-0.5">
								{#if data.myLastRatings.effort !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {effortBg(data.myLastRatings.effort)}">{data.myLastRatings.effort}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] text-neutral-400">--</div>
								{/if}
								{#if effortGap !== null}
									<div class="flex flex-1 items-center gap-0.5">
										<div class="h-px flex-1 {Math.abs(effortGap) <= 1 ? 'bg-green-300' : Math.abs(effortGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
										<span class="text-[9px] font-bold {Math.abs(effortGap) <= 1 ? 'text-green-600' : Math.abs(effortGap) <= 2 ? 'text-amber-600' : 'text-red-600'}">
											{effortGap > 0 ? '+' : ''}{effortGap}
										</span>
										<div class="h-px flex-1 {Math.abs(effortGap) <= 1 ? 'bg-green-300' : Math.abs(effortGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
									</div>
								{:else}
									<div class="flex flex-1 items-center"><div class="h-px flex-1 bg-neutral-200"></div></div>
								{/if}
								{#if row.stakeholderEffort !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {effortBg(row.stakeholderEffort)}">{row.stakeholderEffort}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] text-neutral-400">--</div>
								{/if}
							</div>
						</div>

						<!-- Performance row -->
						<div>
							<p class="mb-0.5 text-[10px] font-medium text-neutral-500">Performance</p>
							<div class="flex items-center gap-0.5">
								{#if data.myLastRatings.performance !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {perfBg(data.myLastRatings.performance)}">{data.myLastRatings.performance}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] text-neutral-400">--</div>
								{/if}
								{#if perfGap !== null}
									<div class="flex flex-1 items-center gap-0.5">
										<div class="h-px flex-1 {Math.abs(perfGap) <= 1 ? 'bg-green-300' : Math.abs(perfGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
										<span class="text-[9px] font-bold {Math.abs(perfGap) <= 1 ? 'text-green-600' : Math.abs(perfGap) <= 2 ? 'text-amber-600' : 'text-red-600'}">
											{perfGap > 0 ? '+' : ''}{perfGap}
										</span>
										<div class="h-px flex-1 {Math.abs(perfGap) <= 1 ? 'bg-green-300' : Math.abs(perfGap) <= 2 ? 'bg-amber-300' : 'bg-red-300'}"></div>
									</div>
								{:else}
									<div class="flex flex-1 items-center"><div class="h-px flex-1 bg-neutral-200"></div></div>
								{/if}
								{#if row.stakeholderPerformance !== null}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold {perfBg(row.stakeholderPerformance)}">{row.stakeholderPerformance}</div>
								{:else}
									<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] text-neutral-400">--</div>
								{/if}
							</div>
						</div>

						<!-- Trend indicator -->
						{#if gapData && (gapData.effortGapTrend || gapData.performanceGapTrend)}
							<div class="mt-1.5 border-t border-neutral-100 pt-1.5">
								{#if gapData.effortGapTrend === 'closing' || gapData.performanceGapTrend === 'closing'}
									<p class="text-[9px] text-green-600">Gap closing</p>
								{:else if gapData.effortGapTrend === 'widening' || gapData.performanceGapTrend === 'widening'}
									<p class="text-[9px] text-red-600">Gap widening</p>
								{:else}
									<p class="text-[9px] text-neutral-400">Gap stable</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Insight Visualizations -->
	{#if data.isOnboardingComplete && data.heatMapWeeks && data.heatMapWeeks.length > 0}
		<!-- Performance & Effort Chart -->
		{#if data.visualizationData && data.visualizationData.individual.length > 0}
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
				<PerformanceEffortChart
					individualData={data.visualizationData.individual}
					stakeholderData={data.visualizationData.stakeholders}
					stakeholders={data.visualizationData.stakeholderList}
				/>
			</div>
		{/if}

		<!-- Detailed Heat Strip (behind toggle) -->
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<button
				onclick={() => showDetailedHeatStrip = !showDetailedHeatStrip}
				class="flex w-full items-center justify-between text-left"
			>
				<span class="text-sm font-medium text-neutral-600">Show detailed week-by-week scores</span>
				<svg class="h-5 w-5 text-neutral-400 transition-transform {showDetailedHeatStrip ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
									<th class="w-24 pb-2 pr-2 text-right text-xs font-medium text-neutral-400">Week</th>
									{#each data.heatMapWeeks as week}
										<th class="pb-2 text-center text-xs font-bold {week.weekNumber === data.currentWeek ? 'text-blue-700' : 'text-neutral-500'}" style="min-width: 2.75rem;">
											{week.weekNumber}
											{#if week.weekNumber === data.currentWeek}
												<div class="mx-auto mt-0.5 h-0.5 w-4 rounded bg-blue-500"></div>
											{/if}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="pr-2 py-0.5 text-right text-xs font-semibold text-amber-600">My Effort</td>
									{#each data.heatMapWeeks as week}
										{@const isCurrent = week.weekNumber === data.currentWeek}
										{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
										<td class="p-0.5 text-center">
											{#if week.effort !== null}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {effortBg(week.effort)} {isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
													{week.effort}
												</div>
											{:else if isFuture}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-neutral-200 text-xs text-neutral-300">-</div>
											{:else}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">-</div>
											{/if}
										</td>
									{/each}
								</tr>
								<tr>
									<td class="pr-2 py-0.5 text-right text-xs font-semibold text-indigo-600">My Perf</td>
									{#each data.heatMapWeeks as week}
										{@const isCurrent = week.weekNumber === data.currentWeek}
										{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
										<td class="p-0.5 text-center">
											{#if week.performance !== null}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {perfBg(week.performance)} {isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
													{week.performance}
												</div>
											{:else if isFuture}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-neutral-200 text-xs text-neutral-300">-</div>
											{:else}
												<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">-</div>
											{/if}
										</td>
									{/each}
								</tr>

								{#if data.stakeholderAvgHeatMap && data.stakeholderAvgHeatMap.length > 0}
									<tr>
										<td colspan={data.heatMapWeeks.length + 1} class="py-1">
											<div class="border-t border-neutral-200"></div>
										</td>
									</tr>
									<tr>
										<td class="pr-2 py-0.5 text-right text-xs font-semibold text-teal-600">Stk Effort</td>
										{#each data.stakeholderAvgHeatMap as week}
											{@const isCurrent = week.weekNumber === data.currentWeek}
											{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
											<td class="p-0.5 text-center">
												{#if week.effort !== null}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {shEffortBg(week.effort)} {isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
														{week.effort}
													</div>
												{:else if isFuture}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-neutral-200 text-xs text-neutral-300">-</div>
												{:else}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">-</div>
												{/if}
											</td>
										{/each}
									</tr>
									<tr>
										<td class="pr-2 py-0.5 text-right text-xs font-semibold text-emerald-600">Stk Perf</td>
										{#each data.stakeholderAvgHeatMap as week}
											{@const isCurrent = week.weekNumber === data.currentWeek}
											{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
											<td class="p-0.5 text-center">
												{#if week.performance !== null}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold {shPerfBg(week.performance)} {isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
														{week.performance}
													</div>
												{:else if isFuture}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-neutral-200 text-xs text-neutral-300">-</div>
												{:else}
													<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">-</div>
												{/if}
											</td>
										{/each}
									</tr>
								{/if}
							</tbody>
						</table>
					</div>

					<!-- Legend -->
					<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500">
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm bg-amber-100"></div>
							<div class="h-3 w-3 rounded-sm bg-amber-400"></div>
							<div class="h-3 w-3 rounded-sm bg-amber-500"></div>
							<span class="text-amber-600">My Effort</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm bg-indigo-100"></div>
							<div class="h-3 w-3 rounded-sm bg-indigo-400"></div>
							<div class="h-3 w-3 rounded-sm bg-indigo-600"></div>
							<span class="text-indigo-600">My Perf</span>
						</div>
						{#if data.stakeholderAvgHeatMap && data.stakeholderAvgHeatMap.length > 0}
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded-sm bg-teal-100"></div>
								<div class="h-3 w-3 rounded-sm bg-teal-400"></div>
								<div class="h-3 w-3 rounded-sm bg-teal-600"></div>
								<span class="text-teal-600">Stk Effort</span>
							</div>
							<div class="flex items-center gap-1.5">
								<div class="h-3 w-3 rounded-sm bg-emerald-100"></div>
								<div class="h-3 w-3 rounded-sm bg-emerald-400"></div>
								<div class="h-3 w-3 rounded-sm bg-emerald-500"></div>
								<span class="text-emerald-600">Stk Perf</span>
							</div>
						{/if}
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm border-2 border-dashed border-neutral-300"></div>
							<span>Future</span>
						</div>
						<div class="flex items-center gap-1.5">
							<div class="h-3 w-3 rounded-sm ring-2 ring-blue-500"></div>
							<span>Current</span>
						</div>
					</div>

					<!-- Per-Stakeholder Detail Toggle -->
					{#if data.stakeholderDetail && data.stakeholderDetail.length > 0}
						<button
							onclick={() => showStakeholderDetail = !showStakeholderDetail}
							class="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 transition-colors"
						>
							<svg class="h-4 w-4 transition-transform {showStakeholderDetail ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							{showStakeholderDetail ? 'Hide' : 'Show'} individual stakeholder ratings ({data.stakeholderDetail.length})
						</button>

						{#if showStakeholderDetail}
							<div class="mt-3 space-y-4">
								{#each data.stakeholderDetail as stakeholder}
									<div class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
										<p class="mb-2 text-sm font-semibold text-neutral-700">{stakeholder.name}</p>
										<div class="overflow-x-auto">
											<table class="w-full border-collapse">
												<thead>
													<tr>
														<th class="w-24 pb-1 pr-2 text-right text-xs font-medium text-neutral-400">Week</th>
														{#each stakeholder.weeks as week}
															<th class="pb-1 text-center text-xs {week.weekNumber === data.currentWeek ? 'font-bold text-blue-700' : 'text-neutral-500'}" style="min-width: 2.75rem;">
																{week.weekNumber}
															</th>
														{/each}
													</tr>
												</thead>
												<tbody>
													<tr>
														<td class="pr-2 py-0.5 text-right text-xs font-semibold text-teal-600">Effort</td>
														{#each stakeholder.weeks as week}
															{@const isCurrent = week.weekNumber === data.currentWeek}
															{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
															<td class="p-0.5 text-center">
																{#if week.effort !== null}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded text-xs font-bold {shEffortBg(week.effort)} {isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
																		{week.effort}
																	</div>
																{:else if isFuture}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded border border-dashed border-neutral-200 text-xs text-neutral-300">-</div>
																{:else}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-xs text-neutral-400">-</div>
																{/if}
															</td>
														{/each}
													</tr>
													<tr>
														<td class="pr-2 py-0.5 text-right text-xs font-semibold text-emerald-600">Perf</td>
														{#each stakeholder.weeks as week}
															{@const isCurrent = week.weekNumber === data.currentWeek}
															{@const isFuture = data.currentWeek !== null && week.weekNumber > data.currentWeek}
															<td class="p-0.5 text-center">
																{#if week.performance !== null}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded text-xs font-bold {shPerfBg(week.performance)} {isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
																		{week.performance}
																	</div>
																{:else if isFuture}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded border border-dashed border-neutral-200 text-xs text-neutral-300">-</div>
																{:else}
																	<div class="mx-auto flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-xs text-neutral-400">-</div>
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
					<div class="rounded-xl border p-3 {stab >= 70 ? 'border-green-200 bg-green-50' : stab >= 40 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}">
						<p class="text-xs font-medium text-neutral-500">Stability</p>
						<p class="text-2xl font-bold {stab >= 70 ? 'text-green-700' : stab >= 40 ? 'text-amber-700' : 'text-red-700'}">{stab}<span class="text-sm font-normal text-neutral-400">/100</span></p>
						<p class="text-xs text-neutral-400">Consistency of scores</p>
					</div>
				{/if}

				<!-- Trajectory -->
				{#if data.cycleMetrics.trajectoryScore !== null}
					{@const traj = data.cycleMetrics.trajectoryScore}
					<div class="rounded-xl border p-3 {traj > 0 ? 'border-green-200 bg-green-50' : traj < 0 ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-neutral-50'}">
						<p class="text-xs font-medium text-neutral-500">Trajectory</p>
						<p class="text-2xl font-bold {traj > 0 ? 'text-green-700' : traj < 0 ? 'text-red-700' : 'text-neutral-600'}">
							{#if traj > 0}↑ +{traj}{:else if traj < 0}↓ {traj}{:else}→ 0{/if}
						</p>
						<p class="text-xs text-neutral-400">4-week trend</p>
					</div>
				{/if}

				<!-- Completion -->
				{#if data.cycleMetrics.completionRate !== null}
					<div class="rounded-xl border border-blue-200 bg-blue-50 p-3">
						<p class="text-xs font-medium text-neutral-500">Completion</p>
						<p class="text-2xl font-bold text-blue-700">{data.cycleMetrics.completionRate}%</p>
						<p class="text-xs text-neutral-400">Check-ins done</p>
					</div>
				{/if}

				<!-- Alignment -->
				{#if data.cycleMetrics.alignmentRatio !== null}
					<div class="rounded-xl border border-purple-200 bg-purple-50 p-3">
						<p class="text-xs font-medium text-neutral-500">Alignment</p>
						<p class="text-2xl font-bold text-purple-700">{data.cycleMetrics.alignmentRatio}%</p>
						<p class="text-xs text-neutral-400">Stakeholder feedback this week</p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- AI Coaching Card -->
	{#if data.isOnboardingComplete}
		<div class="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-sm">
			<div class="mb-4 flex items-center gap-2">
				<span class="text-xl" role="img" aria-label="robot">🤖</span>
				<h2 class="text-lg font-bold text-neutral-900">AI Coach</h2>
			</div>

			{#if insightContent}
				<div class="mb-3">
					{#if data.latestInsight?.weekNumber && !freshInsight}
						<p class="mb-2 text-xs text-purple-500">
							Week {data.latestInsight.weekNumber}
							<span class="ml-1 text-neutral-400">{data.latestInsight.type === 'WEEKLY_SYNTHESIS' ? 'Weekly Synthesis' : 'Check-in Insight'}</span>
							{#if data.latestInsight.createdAt}
								<span class="ml-1"> &middot; {new Date(data.latestInsight.createdAt).toLocaleDateString()}</span>
							{/if}
						</p>
					{/if}
					{#if freshInsight}
						<p class="mb-2 text-xs font-medium text-green-600">Fresh summary generated just now</p>
					{/if}
					<div class="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
						{#if insightExpanded || insightContent.length <= 300}
							{insightContent}
						{:else}
							{truncate(insightContent, 300)}
						{/if}
					</div>
					{#if insightContent.length > 300}
						<button
							class="mt-2 text-xs font-medium text-purple-600 hover:text-purple-800"
							onclick={() => insightExpanded = !insightExpanded}
						>
							{insightExpanded ? 'Show less' : 'Read more'}
						</button>
					{/if}
				</div>
			{:else}
				<p class="mb-4 text-sm text-neutral-500">Complete your first check-in to receive AI coaching insights.</p>
			{/if}

			{#if generateError}
				<p class="mb-2 text-xs text-red-600">{generateError}</p>
			{/if}

			<button
				onclick={generateSummary}
				disabled={generating}
				class="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if generating}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					Generating...
				{:else}
					Generate Fresh Summary
				{/if}
			</button>
		</div>
	{/if}

	<!-- Navigation Cards -->
	{#if data.isOnboardingComplete}
		<div class="grid gap-6 md:grid-cols-3">
			<a
				href="/individual/dashboard"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-3">
						<span class="text-2xl" role="img" aria-label="calendar">📅</span>
					</div>
					<h2 class="text-xl font-bold text-neutral-900">Dashboard</h2>
				</div>
				<p class="mb-4 text-sm text-neutral-600">
					View your weekly experiences, complete check-ins, and track your cycle progress.
				</p>
				<div class="flex items-center gap-2 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1">
					Go to Dashboard <span>→</span>
				</div>
			</a>

			<a
				href="/individual/insights"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-purple-50/30 p-8 shadow-sm transition-all hover:border-purple-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3">
						<span class="text-2xl" role="img" aria-label="bar chart">📊</span>
					</div>
					<h2 class="text-xl font-bold text-neutral-900">Insights</h2>
				</div>
				<p class="mb-4 text-sm text-neutral-600">
					Review reflection trends, stability metrics, and stakeholder alignment over time.
				</p>
				<div class="flex items-center gap-2 text-sm font-semibold text-purple-700 transition-transform group-hover:translate-x-1">
					View Insights <span>→</span>
				</div>
			</a>

			<a
				href="/individual/stakeholders"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-emerald-50/30 p-8 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3">
						<span class="text-2xl" role="img" aria-label="people">👥</span>
					</div>
					<h2 class="text-xl font-bold text-neutral-900">Stakeholders</h2>
				</div>
				<p class="mb-4 text-sm text-neutral-600">
					Manage the people who provide feedback on your progress and generate feedback links.
				</p>
				<div class="flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-transform group-hover:translate-x-1">
					Manage Stakeholders <span>→</span>
				</div>
			</a>
		</div>
	{/if}
</section>
