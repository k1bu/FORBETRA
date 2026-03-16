<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
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
		ChevronRight,
		HelpCircle,
		ShieldCheck
	} from 'lucide-svelte';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

	const { data }: { data: PageData } = $props();

	if (!data) {
		throw new Error('Page data is missing');
	}

	let showSubgoals = $state(false);

	// Orientation card — gate on mounted to avoid SSR hydration flash
	let orientationMounted = $state(false);
	let orientationDismissed = $state(true);
	onMount(() => {
		orientationDismissed = localStorage.getItem('forbetra-orientation-dismissed') === 'true';
		orientationMounted = true;
	});
	function dismissOrientation() {
		localStorage.setItem('forbetra-orientation-dismissed', 'true');
		orientationDismissed = true;
	}
	function showOrientation() {
		localStorage.removeItem('forbetra-orientation-dismissed');
		orientationDismissed = false;
	}

	// Cycle extension
	let extending = $state(false);
	let extendError = $state<string | null>(null);
	let extendSuccess = $state(false);
	let confirmExtend = $state(false);

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
	<title>Your Development Hub | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-4xl flex-col gap-5 p-4 pb-12">
	<!-- ═══ ZONE 1: Welcome + Goal + Week badge ═══ -->
	<div class="anim-slide-up flex flex-col gap-1">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5">
				<p class="text-sm text-text-tertiary">
					{#if data.isFirstVisit}Welcome to Forbetra{:else if data.summary?.currentStreak && data.summary.currentStreak >= 3}Welcome
						back — {data.summary.currentStreak}-week streak!{:else}Welcome back{/if}
				</p>
				{#if orientationDismissed}
					<button
						onclick={showOrientation}
						class="rounded-full p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-secondary"
						title="What is Forbetra?"
						aria-label="Show orientation guide"
					>
						<HelpCircle class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				{#if data.summary?.currentStreak && data.summary.currentStreak > 0}
					<span
						class="flex items-center gap-1 rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-warning"
						title="{data.summary.currentStreak}-week streak"
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

	<!-- ═══ Orientation Card ═══ -->
	{#if orientationMounted && !orientationDismissed}
		<div class="rounded-2xl border border-accent/20 bg-accent/5 p-5">
			<h2 class="text-sm font-semibold text-text-primary">How Forbetra works</h2>
			<p class="mt-2 text-sm leading-relaxed text-text-secondary">
				Each week, you rate your own effort and performance (0–10). Your reviewers do the same —
				independently. Over time, the gap between your view and theirs reveals your blind spots.
			</p>
			<div class="mt-3 rounded-lg border border-accent/20 bg-surface-raised px-4 py-3">
				<p class="text-xs font-semibold text-accent">Why it works</p>
				<p class="mt-1 text-xs text-text-secondary">
					Research shows that self-perception gaps are the #1 barrier to leadership growth. Forbetra
					makes these gaps visible, measurable, and actionable — so you grow faster with less
					guesswork.
				</p>
			</div>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<p class="mt-1.5 text-xs text-text-tertiary">
				Your data is TLS encrypted and shared only with your coach. Hosted on enterprise-grade
				infrastructure. <a href="/privacy" class="text-accent hover:underline">Privacy policy</a>
			</p>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<button
				onclick={dismissOrientation}
				class="mt-3 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
			>
				Got it
			</button>
		</div>
	{/if}

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
					Set your goal, invite reviewers, and log your first check-in.
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
						{#if data.summary && data.summary.completionRate != null && data.summary.completionRate >= 80}
							Exceptional dedication — {Math.round(data.summary.completionRate)}% completion rate
							shows real commitment to growth.
						{:else if data.summary && data.summary.completionRate != null && data.summary.completionRate >= 50}
							You showed up consistently and built a meaningful data picture. View your insights to
							see what emerged.
						{:else}
							You showed up and did the work. View your insights or start a new journey.
						{/if}
					</p>
				</div>
			</div>
			{#if data.summary}
				<div class="mt-3 grid grid-cols-3 gap-3">
					<div class="rounded-lg bg-surface-base px-3 py-2 text-center">
						<p class="text-lg font-bold text-accent tabular-nums">{data.summary.totalCompleted}</p>
						<p class="text-2xs text-text-muted">Check-ins</p>
					</div>
					<div class="rounded-lg bg-surface-base px-3 py-2 text-center">
						<p class="text-lg font-bold text-accent tabular-nums">
							{data.summary.completionRate != null
								? `${Math.round(data.summary.completionRate)}%`
								: '—'}
						</p>
						<p class="text-2xs text-text-muted">Completion</p>
					</div>
					<div class="rounded-lg bg-surface-base px-3 py-2 text-center">
						<p class="text-lg font-bold text-accent tabular-nums">
							{data.summary.totalStakeholders}
						</p>
						<p class="text-2xs text-text-muted">Reviewers</p>
					</div>
				</div>
			{/if}
			<div class="mt-4 flex flex-wrap gap-2">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/insights"
					class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
				>
					View Insights
				</a>
				<a
					href="/individual/new-cycle"
					class="rounded-lg border border-accent/30 bg-accent-muted px-4 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/50"
				>
					Start New Journey
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<button
					type="button"
					onclick={() => (confirmExtend = true)}
					disabled={extending || extendSuccess}
					class="rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle disabled:opacity-60"
				>
					{#if extendSuccess}Extended!{:else}Extend 4 Weeks{/if}
				</button>
				{#if confirmExtend}
					<div
						class="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-muted px-3 py-2"
					>
						<span class="text-xs text-accent">Add 4 more weeks to this cycle?</span>
						<button
							type="button"
							onclick={() => {
								confirmExtend = false;
								extendCycle(4);
							}}
							disabled={extending}
							class="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
						>
							{extending ? 'Extending...' : 'Yes, extend'}
						</button>
						<button
							type="button"
							onclick={() => (confirmExtend = false)}
							class="text-xs font-medium text-text-muted hover:text-text-secondary"
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
			{#if extendError}
				<p class="mt-2 text-sm text-error">{extendError}</p>
			{/if}
		</div>
	{:else if data.cycle?.isOverdue}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/individual/checkin"
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
		<div
			id="scores"
			class="scroll-anchor anim-slide-up grid grid-cols-2 gap-3"
			role="region"
			aria-label="Score summary"
			style="animation-delay: 50ms"
		>
			<!-- My Effort -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-2xs font-semibold tracking-wider text-text-muted uppercase">
					My Effort <InfoTip text="Your self-rated investment of energy and focus this week" />
				</p>
				<p class="mt-1 text-2xl font-bold text-data-effort tabular-nums">
					{data.myLastRatings?.effort != null ? `${data.myLastRatings.effort}/10` : '—'}
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
				<p class="text-2xs mt-1 text-text-muted">How hard you felt you worked this week</p>
			</div>

			<!-- My Performance -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-2xs font-semibold tracking-wider text-text-muted uppercase">
					My Performance <InfoTip
						text="Your self-rated satisfaction with progress toward your goal this week"
					/>
				</p>
				<p class="mt-1 text-2xl font-bold text-data-performance tabular-nums">
					{data.myLastRatings?.performance != null ? `${data.myLastRatings.performance}/10` : '—'}
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
				<p class="text-2xs mt-1 text-text-muted">How effective you felt this week</p>
			</div>

			<!-- Reviewer Effort -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-2xs font-semibold tracking-wider text-text-muted uppercase">
					Reviewer Effort <InfoTip
						text="How your reviewers rate your effort — compare with your own to spot gaps"
					/>
				</p>
				<p class="mt-1 text-2xl font-bold text-data-effort/80 tabular-nums">
					{data.stakeholdersLastRatings?.effort != null
						? `${data.stakeholdersLastRatings.effort}/10`
						: '—'}
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
				<p class="text-2xs mt-1 text-text-muted">How your reviewers rate your effort</p>
			</div>

			<!-- Reviewer Performance -->
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<p class="text-2xs font-semibold tracking-wider text-text-muted uppercase">
					Reviewer Performance <InfoTip
						text="How your reviewers rate your effectiveness — compare with your own to spot gaps"
					/>
				</p>
				<p class="mt-1 text-2xl font-bold text-data-performance/80 tabular-nums">
					{data.stakeholdersLastRatings?.performance != null
						? `${data.stakeholdersLastRatings.performance}/10`
						: '—'}
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
				<p class="text-2xs mt-1 text-text-muted">How your reviewers rate your effectiveness</p>
			</div>
			<p class="text-2xs col-span-2 text-center text-text-muted">
				Reviewer scores are averaged across all active reviewers
			</p>
		</div>
	{/if}

	<!-- ═══ Score Interpretation ═══ -->
	{#if data.isOnboardingComplete && data.myLastRatings && data.stakeholdersLastRatings}
		{@const selfAvg =
			((data.myLastRatings.effort ?? 0) + (data.myLastRatings.performance ?? 0)) / 2}
		{@const reviewerAvg =
			((data.stakeholdersLastRatings.effort ?? 0) +
				(data.stakeholdersLastRatings.performance ?? 0)) /
			2}
		{@const overallGap = Math.abs(selfAvg - reviewerAvg)}
		{#if overallGap > 2}
			<div
				class="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-2.5"
			>
				<AlertTriangle class="h-4 w-4 shrink-0 text-warning" />
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<p class="text-xs text-text-secondary">
					There's a perception gap worth exploring — this is exactly the kind of insight that
					accelerates growth. See your
					<a href="/individual/scorecard" class="font-semibold text-accent hover:underline"
						>scorecard</a
					>
					for details.
				</p>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		{:else if selfAvg >= 7 && reviewerAvg >= 7}
			<div
				class="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5"
			>
				<CircleCheck class="h-4 w-4 shrink-0 text-success" />
				<p class="text-xs text-text-secondary">
					Strong scores from both you and your reviewers — keep this momentum going.
				</p>
			</div>
		{/if}
	{/if}

	<!-- ═══ Journey Progress ═══ -->
	{#if data.isOnboardingComplete && data.currentWeek && data.totalWeeks && !data.cycle?.isCycleCompleted}
		{@const pct = Math.min(100, Math.round((data.currentWeek / data.totalWeeks) * 100))}
		<div class="rounded-xl border border-border-default bg-surface-raised px-4 py-3">
			<div class="flex items-center justify-between text-xs text-text-secondary">
				<span>Journey progress</span>
				<span class="tabular-nums">{pct}% — week {data.currentWeek} of {data.totalWeeks}</span>
			</div>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-subtle">
				<div class="h-full rounded-full bg-accent transition-all" style="width: {pct}%"></div>
			</div>
		</div>
	{/if}

	<!-- ═══ Early Journey Guidance ═══ -->
	{#if data.isOnboardingComplete && !data.myLastRatings && !data.visualizationData}
		<div class="rounded-2xl border border-dashed border-accent/30 bg-accent-muted/30 p-5">
			<p class="text-center text-sm font-semibold text-text-primary">
				You've taken the first step — that matters
			</p>
			<p class="mt-1 text-center text-xs text-text-secondary">
				Most people never get honest feedback on how they're really showing up. You just chose to.
				Here's what happens next:
			</p>
			<div class="mt-3 space-y-2">
				<div class="flex items-start gap-2 text-xs text-text-secondary">
					<span
						class="text-2xs mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white"
						>1</span
					>
					<span
						><strong>First check-in</strong> — sets your baseline effort and performance scores</span
					>
				</div>
				<div class="flex items-start gap-2 text-xs text-text-secondary">
					<span
						class="text-2xs mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/60 font-bold text-white"
						>2</span
					>
					<span
						><strong>Reviewer feedback arrives</strong> — reveals perception gaps between how you see
						yourself and how others see you</span
					>
				</div>
				<div class="flex items-start gap-2 text-xs text-text-secondary">
					<span
						class="text-2xs mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/40 font-bold text-white"
						>3</span
					>
					<span
						><strong>Week 2+</strong> — trends emerge, AI insights unlock, and the real growth begins</span
					>
				</div>
			</div>
			<div class="mt-3 rounded-lg bg-surface-raised px-4 py-3">
				<p class="text-xs font-medium text-text-primary">Tip for your first check-in</p>
				<p class="mt-1 text-xs leading-relaxed text-text-muted">
					Rate where you genuinely are, not where you want to be. Honest baselines lead to more
					meaningful growth — the numbers are for you, not for judgment.
				</p>
			</div>
		</div>
	{/if}

	<!-- ═══ ZONE 4: Trend Chart ═══ -->
	{#if data.isOnboardingComplete && data.visualizationData}
		<div
			id="trend"
			class="scroll-anchor rounded-2xl border border-border-default bg-surface-raised p-5"
		>
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
			<div
				id="gaps"
				class="scroll-anchor rounded-2xl border border-border-default bg-surface-raised p-5"
			>
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
										<p class="text-2xs text-text-muted">Effort</p>
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
										<p class="text-2xs text-text-muted">Perf</p>
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
				<div class="mb-1 flex items-center gap-2">
					<p class="text-xs font-semibold tracking-wider text-accent uppercase">Latest Insight</p>
					<span class="text-2xs text-text-tertiary"
						>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
							new Date(data.latestInsight.createdAt)
						)}</span
					>
				</div>
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

	<!-- ═══ Trust & Security ═══ -->
	{#if data.isOnboardingComplete}
		<div class="flex items-center justify-center gap-4 py-2 text-text-muted">
			<div class="flex items-center gap-1.5">
				<ShieldCheck class="h-3 w-3" />
				<span class="text-2xs">TLS encrypted · Enterprise-grade security</span>
			</div>
			{#if data.coachName}
				<span class="text-2xs"
					>Coach: <span class="font-medium text-text-secondary">{data.coachName}</span></span
				>
			{/if}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a href="/privacy" class="text-2xs hover:text-text-secondary hover:underline">Privacy</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{/if}
</section>
