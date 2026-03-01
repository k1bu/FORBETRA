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
		MessageSquare,
		User,
		Sparkles,
		ChevronRight,
		ChevronDown,
		ArrowUpDown
	} from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	if (!data) {
		throw new Error('Page data is missing');
	}

	let showRecentActivity = $state(false);

	// Milestone-aware subtitle
	const milestoneMessage = $derived(
		(() => {
			if (!data.isOnboardingComplete) return null;
			if (!data.currentWeek || !data.totalWeeks) return null;

			const pct = data.summary?.completionRate ?? 0;
			const week = data.currentWeek;
			const total = data.totalWeeks;
			const streak = data.summary?.currentStreak ?? 0;

			// Streak milestones
			if (streak >= 10) return `${streak} check-ins in a row. Consistency is your superpower.`;
			if (streak >= 5) return `${streak}-check-in streak. The data is building.`;

			// Cycle completion milestones
			if (data.cycle?.isCycleCompleted) return null; // handled by hero card
			if (week === 1) return 'Week 1 — your baseline is being set.';
			if (pct >= 90 && week >= total - 1) return 'Final stretch. Strong finish ahead.';
			if (week === Math.ceil(total / 2)) return `Halfway through — week ${week} of ${total}.`;
			if (week === total) return `Last week of your cycle. Make it count.`;

			// General progress
			if (pct >= 80) return "You're keeping a strong pace.";
			if (pct < 40 && week > 2) return 'A few missed check-ins. Jump back in.';

			return null;
		})()
	);

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
			setTimeout(() => invalidateAll(), 1000);
		} catch {
			extendError = 'Network error. Please try again.';
		} finally {
			extending = false;
		}
	}

	// Quick insights — pattern-based, derived from existing data
	const quickInsights = $derived(
		(() => {
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
					insights.push({
						text: 'Your effort dipped this week. Worth a check-in with yourself.',
						tone: 'warning'
					});
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
			if (
				my?.effortChange !== null &&
				my?.performanceChange !== null &&
				my?.effortChange !== undefined &&
				my?.performanceChange !== undefined &&
				my.effortChange >= 0.5 &&
				my.performanceChange <= -0.5
			) {
				insights.push({
					text: "You're putting in more effort but performance isn't following yet — could be a lag or a strategy issue.",
					tone: 'neutral'
				});
			}

			// Stakeholder alignment
			if (stk?.effortChange !== null && stk?.effortChange !== undefined && stk.effortChange >= 1) {
				insights.push({
					text: 'Stakeholders are noticing more effort from you.',
					tone: 'positive'
				});
			}
			if (
				stk?.performanceChange !== null &&
				stk?.performanceChange !== undefined &&
				stk.performanceChange >= 1
			) {
				insights.push({ text: 'Stakeholders see your performance improving.', tone: 'positive' });
			}

			// Big perception gaps
			const bigGaps = gaps.filter((g) => g.maxAbsGap > 2);
			if (bigGaps.length > 0) {
				const name = bigGaps[0].stakeholderName;
				const isEffort =
					Math.abs(bigGaps[0].effortGap ?? 0) > Math.abs(bigGaps[0].performanceGap ?? 0);
				const gap = isEffort ? bigGaps[0].effortGap : bigGaps[0].performanceGap;
				if (gap !== null) {
					const metric = isEffort ? 'effort' : 'performance';
					const direction = gap > 0 ? 'higher' : 'lower';
					insights.push({
						text: `You rate your ${metric} ${direction} than ${name} does — worth a conversation.`,
						tone: 'warning'
					});
				}
			}

			// Closing gaps
			const closingGaps = gaps.filter(
				(g) => g.effortGapTrend === 'closing' || g.performanceGapTrend === 'closing'
			);
			if (closingGaps.length > 0) {
				insights.push({
					text: `Perception gap with ${closingGaps[0].stakeholderName} is closing — alignment improving.`,
					tone: 'positive'
				});
			}

			// Stability
			if (metrics?.stabilityScore !== null && metrics?.stabilityScore !== undefined) {
				if (metrics.stabilityScore >= 80) {
					insights.push({
						text: 'Your scores are very consistent — strong stability.',
						tone: 'positive'
					});
				} else if (metrics.stabilityScore < 40) {
					insights.push({
						text: "Your scores are fluctuating a lot — what's driving the swings?",
						tone: 'warning'
					});
				}
			}

			// Trajectory
			if (metrics?.trajectoryScore !== null && metrics?.trajectoryScore !== undefined) {
				if (metrics.trajectoryScore >= 15) {
					insights.push({
						text: 'Strong upward trajectory over the last 4 weeks.',
						tone: 'positive'
					});
				} else if (metrics.trajectoryScore <= -15) {
					insights.push({
						text: 'Scores are trending down over the last 4 weeks.',
						tone: 'warning'
					});
				}
			}

			// Return only the single most relevant insight
			return insights.slice(0, 1);
		})()
	);
</script>

<svelte:head>
	<title>Today | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-12">
	<!-- ═══ ZONE 1: Top Bar — Welcome + Objective + Week + Streak ═══ -->
	<div class="flex flex-col gap-1">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-text-tertiary">
					{#if data.isFirstVisit}Welcome to Forbetra{:else}Welcome back{/if}
				</p>
				{#if milestoneMessage}
					<p class="text-xs text-text-muted">{milestoneMessage}</p>
				{/if}
			</div>
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
						class="shrink-0 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
					>
						{data.objective.subgoals.length} sub-objective{data.objective.subgoals.length === 1
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

	<!-- ═══ ZONE 2: Next Action (Hero) ═══ -->
	<!-- This is the FIRST thing the user should focus on. Absorbs all status banners. -->

	{#if !data.isOnboardingComplete}
		<!-- Onboarding incomplete -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/onboarding"
			class="group flex items-center gap-4 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/5 to-transparent p-5 transition-all hover:border-accent/50"
		>
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
				<Rocket class="h-5 w-5 text-accent" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-base font-semibold text-text-primary">Complete your setup</p>
				<p class="text-sm text-text-tertiary">Set your objective and start your first cycle</p>
			</div>
			<ChevronRight
				class="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-0.5"
			/>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else if data.cycle?.isCycleCompleted}
		<!-- Cycle complete -->
		<div
			class="flex flex-col gap-3 rounded-xl border border-success/20 bg-gradient-to-r from-success/5 to-transparent p-5"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
					<CircleCheck class="h-5 w-5 text-success" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-text-primary">Cycle complete!</p>
					<p class="text-sm text-text-tertiary">Your growth report is ready</p>
				</div>
			</div>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<div class="flex gap-2 pl-[52px]">
				<a
					href="/individual/insights"
					class="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
				>
					See Growth Report
				</a>
				<a
					href="/individual/new-cycle"
					class="rounded-lg border border-success/20 bg-surface-raised px-4 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success-muted"
				>
					Start New Cycle
				</a>
			</div>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{:else if data.cycle?.isOverdue && !extendSuccess}
		<!-- Cycle overdue -->
		<div
			class="flex items-center gap-4 rounded-xl border border-warning/20 bg-gradient-to-r from-warning/5 to-transparent p-5"
		>
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10">
				<AlertTriangle class="h-5 w-5 text-warning" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-base font-semibold text-text-primary">Cycle has passed its end date</p>
				<p class="text-sm text-text-tertiary">Extend to keep tracking, or wrap up</p>
				{#if extendError}
					<p class="mt-1 text-xs text-error">{extendError}</p>
				{/if}
			</div>
			<button
				onclick={() => extendCycle(4)}
				disabled={extending}
				class="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
			>
				{#if extending}Extending...{:else}Extend 4 wks{/if}
			</button>
		</div>
	{:else if extendSuccess}
		<div
			class="flex items-center gap-3 rounded-xl border border-success/20 bg-success-muted px-5 py-4"
		>
			<CircleCheck class="h-5 w-5 text-success" />
			<span class="text-sm font-semibold text-success">Cycle extended! Reloading...</span>
		</div>
	{:else if data.nextAction}
		<!-- Regular next action -->
		{#if data.nextAction.url}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={data.nextAction.url}
				class="group flex items-center gap-4 rounded-xl border p-5 transition-all {data.nextAction
					.state === 'missed'
					? 'border-error/30 bg-gradient-to-r from-error/5 to-transparent'
					: 'border-accent/30 bg-gradient-to-r from-accent/5 to-transparent hover:border-accent/50'}"
			>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {data.nextAction
						.state === 'missed'
						? 'bg-error/10'
						: 'bg-accent/10'}"
				>
					{#if data.nextAction.state === 'missed'}<AlertTriangle
							class="h-5 w-5 text-error"
						/>{:else}<Calendar class="h-5 w-5 text-accent" />{/if}
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-text-primary">{data.nextAction.label}</p>
					{#if data.nextAction.state === 'missed'}
						<p class="text-sm text-error/80">Overdue — complete now</p>
					{/if}
				</div>
				<ChevronRight
					class="h-5 w-5 shrink-0 {data.nextAction.state === 'missed'
						? 'text-error'
						: 'text-accent'} transition-transform group-hover:translate-x-0.5"
				/>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{:else}
			<!-- All caught up -->
			<div
				class="flex items-center gap-4 rounded-xl border border-success/20 bg-gradient-to-r from-success/5 to-transparent p-5"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
					<CircleCheck class="h-5 w-5 text-success" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-text-primary">{data.nextAction.label}</p>
					{#if data.isOnboardingComplete && data.currentWeek === 1 && data.summary && data.summary.totalCompleted === 0}
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<p class="text-sm text-text-tertiary">
							Your first check-in opens on {data.nextCheckInDay}. In the meantime,
							<a href="/individual/stakeholders" class="text-accent hover:underline"
								>add stakeholders</a
							> for 360 feedback.
						</p>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{:else}
						<p class="text-sm text-text-tertiary">You're on track this week</p>
					{/if}
				</div>
			</div>
		{/if}
	{/if}

	<!-- ═══ ZONE 3: At-a-Glance (compact row) ═══ -->
	{#if data.isOnboardingComplete && (data.myLastRatings || data.stakeholdersLastRatings || data.summary)}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<span class="text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Effort</span
					>
					{#if data.myLastRatings?.effort !== null && data.myLastRatings?.effort !== undefined}
						<div class="flex items-baseline gap-1">
							<span class="text-xl font-bold text-cyan-400 tabular-nums"
								>{data.myLastRatings.effort}</span
							>
							{#if data.myLastRatings.effortChange !== null && data.myLastRatings.effortChange !== undefined}
								<span
									class="text-xs font-medium {data.myLastRatings.effortChange > 0
										? 'text-success'
										: data.myLastRatings.effortChange < 0
											? 'text-error'
											: 'text-text-muted'}"
								>
									{data.myLastRatings.effortChange > 0
										? '+'
										: ''}{data.myLastRatings.effortChange.toFixed(1)}
								</span>
							{/if}
						</div>
					{:else}
						<p class="text-xl font-bold text-text-muted">--</p>
					{/if}
				</div>
				<div>
					<span class="text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Performance</span
					>
					{#if data.myLastRatings?.effort !== null && data.myLastRatings?.effort !== undefined}
						<div class="flex items-baseline gap-1">
							<span class="text-xl font-bold text-amber-400 tabular-nums"
								>{data.myLastRatings.performance ?? '--'}</span
							>
							{#if data.myLastRatings.performanceChange !== null && data.myLastRatings.performanceChange !== undefined}
								<span
									class="text-xs font-medium {data.myLastRatings.performanceChange > 0
										? 'text-success'
										: data.myLastRatings.performanceChange < 0
											? 'text-error'
											: 'text-text-muted'}"
								>
									{data.myLastRatings.performanceChange > 0
										? '+'
										: ''}{data.myLastRatings.performanceChange.toFixed(1)}
								</span>
							{/if}
						</div>
					{:else}
						<p class="text-xl font-bold text-text-muted">--</p>
					{/if}
				</div>
				<div>
					<span class="text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Stakeholder</span
					>
					{#if data.stakeholdersLastRatings?.effort !== null && data.stakeholdersLastRatings?.effort !== undefined}
						<div class="flex items-baseline gap-1.5">
							<span class="text-xl font-bold text-cyan-400 tabular-nums"
								>{data.stakeholdersLastRatings.effort}<span
									class="text-[10px] font-normal text-text-muted"
								>
									E</span
								></span
							>
							{#if data.stakeholdersLastRatings?.performance !== null && data.stakeholdersLastRatings?.performance !== undefined}
								<span class="text-xl font-bold text-amber-400 tabular-nums"
									>{data.stakeholdersLastRatings.performance}<span
										class="text-[10px] font-normal text-text-muted"
									>
										P</span
									></span
								>
							{/if}
						</div>
					{:else}
						<p class="text-xl font-bold text-text-muted">--</p>
					{/if}
				</div>
				<div>
					<span class="text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Completion</span
					>
					{#if data.summary?.completionRate !== null && data.summary?.completionRate !== undefined}
						<p class="text-xl font-bold text-accent tabular-nums">{data.summary.completionRate}%</p>
					{:else}
						<p class="text-xl font-bold text-text-muted">--</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- ═══ ZONE 3b: Perception Gaps ═══ -->
	{#if data.perceptionGaps && data.perceptionGaps.length > 0}
		{@const significantGaps = data.perceptionGaps.filter((g) => g.maxAbsGap > 1)}
		{#if significantGaps.length > 0}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual/scorecard"
				class="group flex items-start gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-all hover:border-accent/30"
			>
				<ArrowUpDown class="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-text-primary">
						{significantGaps.length} perception gap{significantGaps.length !== 1 ? 's' : ''}
					</p>
					<div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
						{#each significantGaps.slice(0, 3) as gap (gap.stakeholderId)}
							{@const biggestGap =
								Math.abs(gap.effortGap ?? 0) > Math.abs(gap.performanceGap ?? 0)
									? gap.effortGap
									: gap.performanceGap}
							{@const absGap = Math.abs(biggestGap ?? 0)}
							<span class="text-xs {absGap > 2 ? 'text-error' : 'text-warning'}">
								{gap.stakeholderName}: {biggestGap !== null && biggestGap > 0
									? '+'
									: ''}{biggestGap?.toFixed(1)}
								{#if gap.effortGapTrend === 'closing' || gap.performanceGapTrend === 'closing'}
									<span class="text-success">closing</span>
								{:else if gap.effortGapTrend === 'widening' || gap.performanceGapTrend === 'widening'}
									<span class="text-error">widening</span>
								{/if}
							</span>
						{/each}
					</div>
				</div>
				<span
					class="mt-1 shrink-0 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5"
					>Details →</span
				>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	{/if}

	<!-- ═══ ZONE 4: Quick Insight (single) + AI Insight Teaser ═══ -->
	{#if quickInsights.length > 0 || data.latestInsight}
		<div class="flex flex-col gap-2">
			{#if quickInsights.length > 0}
				{@const insight = quickInsights[0]}
				<div
					class="flex items-start gap-2.5 rounded-xl border border-border-default bg-surface-raised px-4 py-3"
				>
					<span class="mt-0.5 shrink-0">
						{#if insight.tone === 'positive'}<TrendingUp
								class="h-4 w-4 text-success"
							/>{:else if insight.tone === 'warning'}<TrendingDown
								class="h-4 w-4 text-warning"
							/>{:else}<ArrowRight class="h-4 w-4 text-text-muted" />{/if}
					</span>
					<p class="text-sm text-text-secondary">{insight.text}</p>
				</div>
			{/if}
			{#if data.latestInsight}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/insights"
					class="group flex items-center gap-2.5 rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-all hover:border-accent/30"
				>
					<Sparkles class="h-4 w-4 shrink-0 text-accent" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm text-text-secondary">
							{#if data.latestInsight.weekNumber}Week {data.latestInsight.weekNumber}{/if} AI Insight
						</p>
						{#if data.latestInsight.content}
							<p class="mt-0.5 truncate text-xs text-text-muted">
								{data.latestInsight.content.slice(0, 80)}…
							</p>
						{/if}
					</div>
					<span
						class="shrink-0 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5"
						>Read →</span
					>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
		</div>
	{/if}

	<!-- ═══ ZONE 5: Recent Activity (collapsible) ═══ -->
	{#if data.recentNotes && data.recentNotes.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<button
				type="button"
				onclick={() => (showRecentActivity = !showRecentActivity)}
				class="flex w-full items-center justify-between"
			>
				<span class="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
					Recent Activity ({data.recentNotes.length})
				</span>
				<ChevronDown
					class="h-3.5 w-3.5 text-text-muted transition-transform {showRecentActivity
						? 'rotate-180'
						: ''}"
				/>
			</button>
			{#if showRecentActivity}
				<div class="mt-3 flex flex-col gap-3">
					{#each data.recentNotes as note, i (i)}
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
			{/if}
		</div>
	{/if}
</section>
