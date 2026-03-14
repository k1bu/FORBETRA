<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import {
		Flame,
		AlertTriangle,
		Calendar,
		CircleCheck,
		Rocket,
		TrendingUp,
		TrendingDown,
		ArrowRight,
		Sparkles,
		ChevronRight
	} from 'lucide-svelte';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

	const { data }: { data: PageData } = $props();

	if (!data) {
		throw new Error('Page data is missing');
	}

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
			setTimeout(() => invalidateAll(), 1000);
		} catch {
			extendError = 'Network error. Please try again.';
		} finally {
			extending = false;
		}
	}
</script>

<svelte:head>
	<title>Home | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-12">
	<!-- ═══ ZONE 1: Welcome + Goal + Week badge ═══ -->
	<div class="flex flex-col gap-1">
		<div class="flex items-center justify-between">
			<p class="text-sm text-text-tertiary">
				{#if data.isFirstVisit}Welcome to Forbetra{:else}Welcome back{/if}
			</p>
			<div class="flex items-center gap-2">
				{#if data.summary?.currentStreak && data.summary.currentStreak > 0}
					<span
						class="flex items-center gap-1 rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-warning"
					>
						<Flame class="h-3 w-3" />
						{data.summary.currentStreak}
					</span>
				{/if}
				{#if data.currentWeek}
					{#if data.cycle?.isCycleCompleted}
						<span
							class="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-success"
							>Complete</span
						>
					{:else if data.cycle?.isOverdue}
						<span
							class="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-warning"
							>Wk {data.currentWeek} / {data.totalWeeks}</span
						>
					{:else}
						<span
							class="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-accent"
							>Wk {data.currentWeek}{#if data.totalWeeks}
								/ {data.totalWeeks}{/if}</span
						>
					{/if}
				{/if}
			</div>
		</div>
		{#if data.objective}
			<div class="flex items-baseline gap-2">
				<h1 class="truncate text-lg font-bold text-text-primary">{data.objective.title}</h1>
				{#if data.objective.subgoals && data.objective.subgoals.length > 0}
					<button
						onclick={() => (showSubgoals = !showSubgoals)}
						class="min-h-[44px] shrink-0 px-2 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
					>
						{data.objective.subgoals.length} focus area{data.objective.subgoals.length === 1
							? ''
							: 's'}
						<svg
							class="inline h-3 w-3 transition-transform {showSubgoals ? 'rotate-90' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>
				{/if}
			</div>
			{#if showSubgoals && data.objective.subgoals}
				<ul class="mt-1 space-y-0.5 pl-1">
					{#each data.objective.subgoals as subgoal (subgoal.label)}
						<li class="flex items-start gap-2 text-sm text-text-secondary">
							<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent"></span>
							{subgoal.label}
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>

	<!-- ═══ ZONE 2: Check-in CTA ═══ -->
	{#if !data.isOnboardingComplete}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/onboarding"
			class="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-5 transition-all hover:border-accent/50"
		>
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
				<Rocket class="h-6 w-6 text-accent" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-base font-semibold text-text-primary">Complete your setup</p>
				<p class="text-sm text-text-secondary">
					Finish onboarding to start tracking your performance.
				</p>
			</div>
			<ArrowRight
				class="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-1"
			/>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else if data.cycle?.isCycleCompleted}
		<div
			class="rounded-2xl border border-success/30 bg-gradient-to-r from-success/10 to-transparent p-5"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15">
					<CircleCheck class="h-6 w-6 text-success" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-text-primary">Journey complete!</p>
					<p class="text-sm text-text-secondary">
						Your journey is complete! View your insights or start a new one.
					</p>
				</div>
			</div>
			<div class="mt-4 flex flex-wrap gap-2">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/insights"
					class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
				>
					View Insights
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<button
					type="button"
					onclick={() => extendCycle(4)}
					disabled={extending || extendSuccess}
					class="rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle disabled:opacity-60"
				>
					{#if extendSuccess}Extended!{:else if extending}Extending...{:else}Extend 4 Weeks{/if}
				</button>
			</div>
			{#if extendError}
				<p class="mt-2 text-sm text-error">{extendError}</p>
			{/if}
		</div>
	{:else if data.cycle?.isOverdue}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/reflections/checkin"
			class="group flex items-center gap-4 rounded-2xl border border-warning/30 bg-gradient-to-r from-warning/10 to-transparent p-5 transition-all hover:border-warning/50"
		>
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/15">
				<AlertTriangle class="h-6 w-6 text-warning" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-base font-semibold text-text-primary">You're overdue for a check-in</p>
				<p class="text-sm text-text-secondary">
					Jump back in — consistency matters more than perfection.
				</p>
			</div>
			<ArrowRight
				class="h-5 w-5 shrink-0 text-warning transition-transform group-hover:translate-x-1"
			/>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else if data.nextAction}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		{#if data.nextAction.url}
			<a
				href={data.nextAction.url}
				class="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-5 transition-all hover:border-accent/50"
			>
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
					<Calendar class="h-6 w-6 text-accent" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-text-primary">{data.nextAction.label}</p>
					<p class="text-sm text-text-secondary">
						{data.nextAction.state === 'open'
							? "Today's check-in is ready."
							: 'Next check-in: ' + data.nextCheckInDay}
					</p>
				</div>
				<ArrowRight
					class="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-1"
				/>
			</a>
		{:else}
			<div
				class="flex items-center gap-4 rounded-2xl border border-success/20 bg-gradient-to-r from-success/5 to-transparent p-5"
			>
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15">
					<CircleCheck class="h-6 w-6 text-success" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-text-primary">{data.nextAction.label}</p>
					<p class="text-sm text-text-secondary">Next check-in: {data.nextCheckInDay}</p>
				</div>
			</div>
		{/if}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}

	<!-- ═══ ZONE 3: At-a-Glance scores ═══ -->
	{#if data.isOnboardingComplete && (data.myLastRatings || data.stakeholdersLastRatings)}
		<div class="grid grid-cols-2 gap-3">
			<!-- My Effort -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-[10px] font-semibold tracking-wider text-text-muted uppercase">My Effort</p>
				<p class="mt-1 text-2xl font-bold text-cyan-500 tabular-nums">
					{data.myLastRatings?.effort ?? '—'}
				</p>
				{#if data.myLastRatings?.effortChange !== null && data.myLastRatings?.effortChange !== undefined}
					<p
						class="mt-0.5 flex items-center gap-1 text-xs {data.myLastRatings.effortChange >= 0
							? 'text-success'
							: 'text-error'}"
					>
						{#if data.myLastRatings.effortChange >= 0}<TrendingUp
								class="h-3 w-3"
							/>{:else}<TrendingDown class="h-3 w-3" />{/if}
						{data.myLastRatings.effortChange >= 0 ? '+' : ''}{data.myLastRatings.effortChange}
					</p>
				{/if}
				<p class="mt-1 text-[10px] text-text-muted">Your self-rated effort this week</p>
			</div>

			<!-- My Performance -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
					My Performance
				</p>
				<p class="mt-1 text-2xl font-bold text-amber-500 tabular-nums">
					{data.myLastRatings?.performance ?? '—'}
				</p>
				{#if data.myLastRatings?.performanceChange !== null && data.myLastRatings?.performanceChange !== undefined}
					<p
						class="mt-0.5 flex items-center gap-1 text-xs {data.myLastRatings.performanceChange >= 0
							? 'text-success'
							: 'text-error'}"
					>
						{#if data.myLastRatings.performanceChange >= 0}<TrendingUp
								class="h-3 w-3"
							/>{:else}<TrendingDown class="h-3 w-3" />{/if}
						{data.myLastRatings.performanceChange >= 0 ? '+' : ''}{data.myLastRatings
							.performanceChange}
					</p>
				{/if}
				<p class="mt-1 text-[10px] text-text-muted">Your self-rated performance this week</p>
			</div>

			<!-- Reviewer Effort -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
					Reviewer Effort
				</p>
				<p class="mt-1 text-2xl font-bold text-cyan-400 tabular-nums">
					{data.stakeholdersLastRatings?.effort ?? '—'}
				</p>
				{#if data.stakeholdersLastRatings?.effortChange !== null && data.stakeholdersLastRatings?.effortChange !== undefined}
					<p
						class="mt-0.5 flex items-center gap-1 text-xs {data.stakeholdersLastRatings
							.effortChange >= 0
							? 'text-success'
							: 'text-error'}"
					>
						{#if data.stakeholdersLastRatings.effortChange >= 0}<TrendingUp
								class="h-3 w-3"
							/>{:else}<TrendingDown class="h-3 w-3" />{/if}
						{data.stakeholdersLastRatings.effortChange >= 0 ? '+' : ''}{data.stakeholdersLastRatings
							.effortChange}
					</p>
				{/if}
				<p class="mt-1 text-[10px] text-text-muted">How reviewers see your effort</p>
			</div>

			<!-- Reviewer Performance -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
					Reviewer Performance
				</p>
				<p class="mt-1 text-2xl font-bold text-amber-400 tabular-nums">
					{data.stakeholdersLastRatings?.performance ?? '—'}
				</p>
				{#if data.stakeholdersLastRatings?.performanceChange !== null && data.stakeholdersLastRatings?.performanceChange !== undefined}
					<p
						class="mt-0.5 flex items-center gap-1 text-xs {data.stakeholdersLastRatings
							.performanceChange >= 0
							? 'text-success'
							: 'text-error'}"
					>
						{#if data.stakeholdersLastRatings.performanceChange >= 0}<TrendingUp
								class="h-3 w-3"
							/>{:else}<TrendingDown class="h-3 w-3" />{/if}
						{data.stakeholdersLastRatings.performanceChange >= 0 ? '+' : ''}{data
							.stakeholdersLastRatings.performanceChange}
					</p>
				{/if}
				<p class="mt-1 text-[10px] text-text-muted">How reviewers see your performance</p>
			</div>
		</div>
	{/if}

	<!-- ═══ ZONE 4: Trend Chart ═══ -->
	{#if data.isOnboardingComplete && data.visualizationData}
		<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
			<h2 class="mb-3 text-sm font-semibold text-text-secondary">Trend</h2>
			<ErrorBoundary>
				<PerformanceEffortChart
					individualData={data.visualizationData.individual}
					stakeholderData={data.visualizationData.stakeholders}
					stakeholders={data.visualizationData.stakeholderList}
				/>
			</ErrorBoundary>
		</div>
	{/if}

	<!-- ═══ ZONE 5: Perception Gap Summary ═══ -->
	{#if data.isOnboardingComplete && data.perceptionGaps && data.perceptionGaps.length > 0}
		{@const significantGaps = data.perceptionGaps
			.filter((g) => g.maxAbsGap > 0.5)
			.sort((a, b) => b.maxAbsGap - a.maxAbsGap)
			.slice(0, 3)}
		{#if significantGaps.length > 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-sm font-semibold text-text-secondary">Top Perception Gaps</h2>
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href="/individual/feedback"
						class="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
					>
						View all <ChevronRight class="h-3 w-3" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
				<div class="space-y-3">
					{#each significantGaps as gap (gap.stakeholderId)}
						<div class="flex items-center justify-between rounded-lg bg-surface-subtle px-4 py-3">
							<div>
								<p class="text-sm font-medium text-text-primary">{gap.stakeholderName}</p>
								{#if gap.effortGapTrend || gap.performanceGapTrend}
									<p
										class="text-xs {gap.effortGapTrend === 'closing' ||
										gap.performanceGapTrend === 'closing'
											? 'text-success'
											: gap.effortGapTrend === 'widening' || gap.performanceGapTrend === 'widening'
												? 'text-error'
												: 'text-text-muted'}"
									>
										{gap.effortGapTrend === 'closing' || gap.performanceGapTrend === 'closing'
											? 'Closing'
											: gap.effortGapTrend === 'widening' || gap.performanceGapTrend === 'widening'
												? 'Widening'
												: 'Stable'}
									</p>
								{/if}
							</div>
							<div class="flex gap-4 text-right">
								{#if gap.effortGap !== null}
									<div>
										<p class="text-[10px] text-text-muted">Effort</p>
										<p
											class="text-sm font-semibold tabular-nums {Math.abs(gap.effortGap) <= 0.5
												? 'text-success'
												: Math.abs(gap.effortGap) <= 1.5
													? 'text-warning'
													: 'text-error'}"
										>
											{gap.effortGap > 0 ? '+' : ''}{gap.effortGap}
										</p>
									</div>
								{/if}
								{#if gap.performanceGap !== null}
									<div>
										<p class="text-[10px] text-text-muted">Perf</p>
										<p
											class="text-sm font-semibold tabular-nums {Math.abs(gap.performanceGap) <= 0.5
												? 'text-success'
												: Math.abs(gap.performanceGap) <= 1.5
													? 'text-warning'
													: 'text-error'}"
										>
											{gap.performanceGap > 0 ? '+' : ''}{gap.performanceGap}
										</p>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- ═══ AI Insight Teaser ═══ -->
	{#if data.latestInsight}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/individual/insights"
			class="group flex items-start gap-3 rounded-2xl border border-border-default bg-surface-raised p-5 transition-all hover:border-accent/30"
		>
			<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
				<Sparkles class="h-4 w-4 text-accent" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="mb-1 text-xs font-semibold tracking-wider text-accent uppercase">
					Latest Insight
				</p>
				<p class="line-clamp-2 text-sm text-text-secondary">
					{(data.latestInsight.content ?? '').slice(0, 150)}{(data.latestInsight.content ?? '')
						.length > 150
						? '...'
						: ''}
				</p>
			</div>
			<ChevronRight
				class="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
			/>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
</section>
