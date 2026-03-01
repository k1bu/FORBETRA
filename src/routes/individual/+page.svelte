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
		ArrowUpDown,
		Lock,
		Trophy
	} from 'lucide-svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';

	const { data }: { data: PageData } = $props();

	if (!data) {
		throw new Error('Page data is missing');
	}

	// Maturity stage helpers
	const stage = $derived(data.maturityStage ?? 'established');
	const isGrowingPlus = $derived(stage === 'growing' || stage === 'established');
	const isEstablished = $derived(stage === 'established');

	// Unlock celebration
	let unlockCelebration = $state<'growing' | 'established' | null>(null);
	$effect(() => {
		try {
			if (stage === 'growing' && !localStorage.getItem('forbetra_unlock_growing')) {
				unlockCelebration = 'growing';
			} else if (stage === 'established' && !localStorage.getItem('forbetra_unlock_established')) {
				unlockCelebration = 'established';
			}
		} catch {
			/* SSR / localStorage unavailable */
		}
	});
	function dismissCelebration() {
		try {
			if (unlockCelebration === 'growing') {
				localStorage.setItem('forbetra_unlock_growing', 'true');
			} else if (unlockCelebration === 'established') {
				localStorage.setItem('forbetra_unlock_established', 'true');
			}
		} catch {
			/* ignore */
		}
		unlockCelebration = null;
	}

	let showRecentActivity = $state(false);
	let showHeatMap = $state(false);

	// Streak milestone detection
	const streakMilestone = $derived(
		(() => {
			const streak = data.summary?.currentStreak ?? 0;
			if (streak >= 50)
				return {
					level: 50,
					label: 'Extraordinary',
					message: `${streak} check-ins in a row. You've built a practice that most people only talk about.`
				};
			if (streak >= 20)
				return {
					level: 20,
					label: 'Dedicated',
					message: `${streak}-check-in streak. This level of consistency is changing how you lead.`
				};
			if (streak >= 10)
				return {
					level: 10,
					label: 'Committed',
					message: `${streak} in a row. Consistency is your superpower — the data proves it.`
				};
			if (streak >= 5)
				return {
					level: 5,
					label: 'Building',
					message: `${streak}-check-in streak. Real patterns are forming in your data.`
				};
			return null;
		})()
	);

	// Milestone-aware subtitle
	const milestoneMessage = $derived(
		(() => {
			if (!data.isOnboardingComplete) return null;
			if (!data.currentWeek || !data.totalWeeks) return null;

			const pct = data.summary?.completionRate ?? 0;
			const week = data.currentWeek;
			const total = data.totalWeeks;
			const streak = data.summary?.currentStreak ?? 0;

			// Streak milestones — handled by streakMilestone card now
			if (streak >= 5) return null;

			// Cycle completion milestones
			if (data.cycle?.isCycleCompleted) return null; // handled by hero card
			if (week === 1) return 'Week 1 — your baseline is being set.';
			if (pct >= 90 && week >= total - 1) return 'Final stretch. Strong finish ahead.';
			if (week === Math.ceil(total / 2)) return `Halfway through — week ${week} of ${total}.`;
			if (week === total) return `Last week of your journey. Make it count.`;

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
	<div class="anim-stagger flex flex-col gap-1" style="--stagger: 0">
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
		{#if data.identityAnchor}
			<p class="mt-1 text-sm text-text-secondary italic">
				Becoming: "{data.identityAnchor}"
			</p>
		{/if}
	</div>

	<!-- Unlock Celebration -->
	{#if unlockCelebration}
		<div
			class="flex items-start gap-3 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-5"
		>
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15">
				<Trophy class="h-5 w-5 text-accent" />
			</div>
			<div class="min-w-0 flex-1">
				{#if unlockCelebration === 'growing'}
					<p class="text-base font-semibold text-text-primary">Scorecard unlocked!</p>
					<p class="mt-1 text-sm text-text-secondary">
						You've built enough data to unlock your Scorecard — see how your raters perceive you.
					</p>
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<div class="mt-3 flex gap-2">
						<a
							href="/individual/scorecard"
							onclick={dismissCelebration}
							class="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
						>
							View Scorecard
						</a>
						<button
							type="button"
							onclick={dismissCelebration}
							class="rounded-lg border border-border-default px-4 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-subtle"
						>
							Later
						</button>
					</div>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else}
					<p class="text-base font-semibold text-text-primary">Full platform unlocked!</p>
					<p class="mt-1 text-sm text-text-secondary">
						Your data is now deep enough for advanced analytics and AI conversation. Explore your
						full toolkit.
					</p>
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<div class="mt-3 flex gap-2">
						<a
							href="/individual/ask"
							onclick={dismissCelebration}
							class="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
						>
							Try Ask AI
						</a>
						<button
							type="button"
							onclick={dismissCelebration}
							class="rounded-lg border border-border-default px-4 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-subtle"
						>
							Later
						</button>
					</div>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			</div>
		</div>
	{/if}

	<!-- Streak Milestone Card -->
	{#if streakMilestone}
		<div
			class="flex items-center gap-3 rounded-xl border border-warning/20 bg-gradient-to-r from-warning/5 to-transparent px-4 py-3"
		>
			<span
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-lg"
			>
				<Flame class="h-4 w-4 text-warning" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="text-xs font-semibold tracking-wide text-warning uppercase">
					{streakMilestone.label} — {streakMilestone.level}+ streak
				</p>
				<p class="text-sm text-text-secondary">{streakMilestone.message}</p>
			</div>
		</div>
	{/if}

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
				<p class="text-sm text-text-tertiary">Set your objective and start your first journey</p>
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
					<p class="text-base font-semibold text-text-primary">Journey complete!</p>
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
					Start New Journey
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
				<p class="text-base font-semibold text-text-primary">Journey has passed its end date</p>
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
			<span class="text-sm font-semibold text-success">Journey extended! Reloading...</span>
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
							<a href="/individual/stakeholders" class="text-accent hover:underline">add raters</a> for
							360 feedback.
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
	{#if isGrowingPlus && data.isOnboardingComplete && (data.myLastRatings || data.stakeholdersLastRatings || data.summary)}
		<div
			class="anim-stagger rounded-xl border border-border-default bg-surface-raised p-4"
			style="--stagger: 1"
			role="region"
			aria-label="Weekly metrics at a glance"
		>
			<div class="mb-3 flex items-center gap-2">
				<p class="text-[10px] font-semibold tracking-widest text-text-muted uppercase">This week</p>
				<InfoTip
					text="Your latest self-ratings and rater averages. The +/- shows change from last week."
				/>
			</div>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<span
						class="flex items-center gap-1 text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Effort <InfoTip text="How much intentional effort you put in this week" /></span
					>
					<p class="text-[9px] text-text-tertiary">Your self-rating</p>
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
					<span
						class="flex items-center gap-1 text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Performance
						<InfoTip text="How effectively you performed on your objective this week" /></span
					>
					<p class="text-[9px] text-text-tertiary">Your self-rating</p>
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
					<span
						class="flex items-center gap-1 text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Rater <InfoTip text="Average scores from your raters this week" /></span
					>
					<p class="text-[9px] text-text-tertiary">Others' average</p>
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
					<span
						class="flex items-center gap-1 text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Completion
						<InfoTip text="How many check-ins you've completed this journey" /></span
					>
					<p class="text-[9px] text-text-tertiary">Check-in rate</p>
					{#if data.summary?.completionRate !== null && data.summary?.completionRate !== undefined}
						<p class="text-xl font-bold text-accent tabular-nums">{data.summary.completionRate}%</p>
					{:else}
						<p class="text-xl font-bold text-text-muted">--</p>
					{/if}
				</div>
			</div>
			{#if data.summary?.completionRate !== null && data.summary?.completionRate !== undefined && data.currentWeek && data.totalWeeks}
				<div class="mt-3 border-t border-border-default pt-3">
					<div class="flex items-center justify-between text-[10px] text-text-muted">
						<span>Week {data.currentWeek} of {data.totalWeeks}</span>
						<span class="font-semibold">{data.summary.completionRate}% completed</span>
					</div>
					<div class="relative mt-1 h-1.5 rounded-full bg-surface-subtle">
						<div
							class="h-full rounded-full bg-accent transition-all"
							style="width: {Math.min(data.summary.completionRate, 100)}%"
						></div>
						<div class="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-white/10"></div>
						<div class="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/10"></div>
						<div class="pointer-events-none absolute inset-y-0 left-3/4 w-px bg-white/10"></div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══ ZONE 3 Heat Map (collapsed by default) ═══ -->
	{#if isGrowingPlus && data.heatMapWeeks && data.heatMapWeeks.length > 1}
		<div class="rounded-xl border border-border-default bg-surface-raised">
			<button
				type="button"
				onclick={() => (showHeatMap = !showHeatMap)}
				class="flex w-full items-center justify-between px-4 py-3"
			>
				<span class="text-[10px] font-semibold tracking-wider text-text-muted uppercase"
					>Weekly heat map</span
				>
				<ChevronRight
					class="h-3.5 w-3.5 text-text-muted transition-transform {showHeatMap ? 'rotate-90' : ''}"
				/>
			</button>
			{#if showHeatMap}
				<div class="overflow-x-auto border-t border-border-default px-4 pt-3 pb-4">
					<div class="flex gap-1">
						{#each data.heatMapWeeks as week (week.weekNumber)}
							{@const avg =
								week.effort !== null && week.performance !== null
									? (week.effort + week.performance) / 2
									: (week.effort ?? week.performance)}
							<div class="flex flex-col items-center gap-1" title="Week {week.weekNumber}">
								<div
									class="h-6 w-6 rounded {avg !== null
										? avg >= 7
											? 'bg-success/60'
											: avg >= 4
												? 'bg-warning/60'
												: 'bg-error/60'
										: 'bg-surface-subtle'}"
								></div>
								<span class="text-[8px] text-text-muted">{week.weekNumber}</span>
							</div>
						{/each}
					</div>
					<div class="mt-2 flex items-center gap-3 text-[8px] text-text-muted">
						<span class="flex items-center gap-1"
							><span class="inline-block h-2 w-2 rounded bg-success/60"></span> 7+</span
						>
						<span class="flex items-center gap-1"
							><span class="inline-block h-2 w-2 rounded bg-warning/60"></span> 4–6</span
						>
						<span class="flex items-center gap-1"
							><span class="inline-block h-2 w-2 rounded bg-error/60"></span> 0–3</span
						>
						<span class="flex items-center gap-1"
							><span class="inline-block h-2 w-2 rounded bg-surface-subtle"></span> No data</span
						>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══ ZONE 3a: Quick Nav ═══ -->
	{#if data.isOnboardingComplete}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<div class="anim-stagger flex gap-2 overflow-x-auto" style="--stagger: 2">
			<a
				href="/reflections/checkin"
				class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				<Calendar class="h-3 w-3" /> Check-in
			</a>
			<a
				href="/individual/stakeholders"
				class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				<User class="h-3 w-3" /> Raters
			</a>
			{#if isGrowingPlus}
				<a
					href="/individual/scorecard"
					class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
				>
					<ArrowUpDown class="h-3 w-3" /> Scorecard
				</a>
				<a
					href="/individual/insights"
					class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
				>
					<Sparkles class="h-3 w-3" /> Insights
				</a>
			{/if}
		</div>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}

	<!-- ═══ ZONE 3a+: Weekly Focus ═══ -->
	{#if isGrowingPlus && data.isOnboardingComplete && data.currentWeek && data.currentWeek > 1}
		{@const gaps = data.perceptionGaps ?? []}
		{@const bigGaps = gaps.filter((g) => g.maxAbsGap > 2)}
		{@const rate = data.summary?.completionRate ?? 0}
		{@const streak = data.summary?.currentStreak ?? 0}
		{@const stkCount = data.summary?.totalStakeholders ?? 0}
		{@const focusItem = (() => {
			if (rate < 50 && data.currentWeek > 2)
				return {
					icon: 'catch-up',
					text: "Your completion rate is low — prioritize this week's check-in to build momentum."
				};
			if (bigGaps.length > 0)
				return {
					icon: 'gap',
					text: `You have a large perception gap with ${bigGaps[0].stakeholderName}. Consider discussing this in your next coaching session.`
				};
			if (stkCount === 0)
				return {
					icon: 'stakeholder',
					text: 'Add raters to get 360 feedback — outside perspectives show blind spots.'
				};
			if (streak === 0 && data.currentWeek > 2)
				return {
					icon: 'restart',
					text: 'Your streak reset. One check-in this week starts a new one.'
				};
			if (streak >= 3)
				return {
					icon: 'momentum',
					text: `${streak}-check-in streak — you're building strong data. Keep it going.`
				};
			return null;
		})()}
		{#if focusItem}
			<div
				class="flex items-start gap-3 rounded-xl border border-accent/15 bg-gradient-to-r from-accent/5 to-transparent px-4 py-3"
			>
				<div
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10"
				>
					{#if focusItem.icon === 'catch-up'}
						<AlertTriangle class="h-3.5 w-3.5 text-warning" />
					{:else if focusItem.icon === 'gap'}
						<ArrowUpDown class="h-3.5 w-3.5 text-accent" />
					{:else if focusItem.icon === 'stakeholder'}
						<User class="h-3.5 w-3.5 text-accent" />
					{:else if focusItem.icon === 'restart'}
						<Flame class="h-3.5 w-3.5 text-warning" />
					{:else}
						<TrendingUp class="h-3.5 w-3.5 text-success" />
					{/if}
				</div>
				<div>
					<p class="text-[10px] font-semibold tracking-wide text-accent uppercase">
						Focus this week
					</p>
					<p class="text-sm text-text-secondary">{focusItem.text}</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- ═══ ZONE 3b: Perception Gaps ═══ -->
	{#if isEstablished && data.perceptionGaps && data.perceptionGaps.length > 0}
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
					<p class="mt-0.5 text-[10px] text-text-tertiary">
						+ means you rate higher than others · − means others rate higher
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

	<!-- ═══ ZONE 3c: Progress Narrative ═══ -->
	{#if isGrowingPlus && data.isOnboardingComplete && data.summary && data.currentWeek && data.currentWeek > 1}
		{@const rate = data.summary.completionRate ?? 0}
		{@const streak = data.summary.currentStreak ?? 0}
		{@const stk = data.summary.totalStakeholders ?? 0}
		<div
			class="flex items-start gap-2.5 rounded-xl border border-accent/10 bg-gradient-to-r from-accent/5 to-transparent px-4 py-3"
		>
			<Sparkles class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
			<p class="text-sm text-text-secondary">
				{#if rate >= 90 && streak >= 5}You've built a strong practice — {rate}% completion with a {streak}-check-in
					streak.{:else if rate >= 80}Solid consistency at {rate}% completion.{#if stk > 0}
						{stk} rater{stk !== 1 ? 's' : ''} providing outside perspective.{/if}{:else if rate >= 50}Building
					momentum at {rate}% completion.{#if streak >= 3}
						Your {streak}-check-in streak shows commitment.{/if}{:else}Every check-in counts. Keep
					building the habit.{/if}
			</p>
		</div>
	{/if}

	<!-- ═══ ZONE 4: Quick Insight (single) + AI Insight Teaser ═══ -->
	{#if isGrowingPlus && (quickInsights.length > 0 || data.latestInsight)}
		<div class="anim-stagger flex flex-col gap-2" style="--stagger: 3">
			<div class="flex items-center gap-2">
				<p class="text-[10px] font-semibold tracking-widest text-text-muted uppercase">Insights</p>
				<Lock class="h-3 w-3 text-text-muted" />
				<span class="text-[10px] text-text-muted">Visible to you and your coach</span>
			</div>
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
	{#if isEstablished && data.recentNotes && data.recentNotes.length > 0}
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
