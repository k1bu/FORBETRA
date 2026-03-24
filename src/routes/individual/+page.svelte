<script lang="ts">
	import type { PageData } from './$types';
	import { Flame, ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	const trendIcon = (dir: 'up' | 'down' | 'flat') =>
		dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
	const trendColor = (dir: 'up' | 'down' | 'flat') =>
		dir === 'up' ? 'text-success' : dir === 'down' ? 'text-error' : 'text-text-muted';
	const trendWord = (dir: 'up' | 'down' | 'flat') =>
		dir === 'up' ? 'trending up' : dir === 'down' ? 'trending down' : 'holding steady';

	const gapDescription = (gap: number | null) => {
		if (gap == null) return null;
		const abs = Math.abs(gap);
		if (abs < 0.5) return 'aligned with you';
		if (gap > 0) return `${abs.toFixed(1)} points lower than you`;
		return `${abs.toFixed(1)} points higher than you`;
	};
</script>

<svelte:head>
	<title>Home | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-xl flex-col gap-5 p-4 pb-16">
	{#if !data.isOnboardingComplete}
		<!-- Not onboarded -->
		<div class="rounded-2xl border border-border-default bg-surface-raised p-8 text-center">
			<h1 class="text-xl font-bold text-text-primary">Welcome to Forbetra</h1>
			<p class="mt-2 text-sm text-text-secondary">Set up your development goal to get started.</p>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/onboarding"
				class="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
			>
				Get Started
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{:else if data.cycle?.isCycleCompleted}
		<!-- Cycle complete -->
		<div class="rounded-2xl border border-success/30 bg-success-muted p-8 text-center">
			<h1 class="text-xl font-bold text-success">Journey Complete</h1>
			<p class="mt-2 text-sm text-text-secondary">
				You finished your cycle. View your full report or start a new journey.
			</p>
			<div class="mt-4 flex justify-center gap-3">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/insights"
					class="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
				>
					View Report
				</a>
				<a
					href="/individual/new-cycle"
					class="rounded-lg border border-border-default bg-surface-raised px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-subtle"
				>
					New Journey
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>
	{:else}
		<!-- ═══ Active cycle: the three signals ═══ -->

		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-lg font-bold text-text-primary">
					{data.objective?.title ?? 'Your Journey'}
				</h1>
				<p class="text-xs text-text-muted">
					Week {data.currentWeek}{#if data.totalWeeks}
						of {data.totalWeeks}{/if}
				</p>
			</div>
			{#if data.summary?.currentStreak && data.summary.currentStreak > 0}
				<span
					class="flex items-center gap-1 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-bold text-warning"
				>
					<Flame class="h-3 w-3" />
					{data.summary.currentStreak}
				</span>
			{/if}
		</div>

		<!-- Next action -->
		{#if data.nextAction}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual/checkin"
				class="group flex items-center justify-between rounded-2xl border-2 border-accent/30 bg-accent-muted px-5 py-4 transition-all hover:border-accent"
			>
				<div>
					<p class="text-sm font-bold text-accent">Check in now</p>
					<p class="text-xs text-text-secondary">Rate your effort and performance this week</p>
				</div>
				<ArrowRight class="h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		<!-- Three signal cards -->
		{#if data.signals}
			{@const s = data.signals}
			<div class="space-y-3">
				<!-- 1. Effort -->
				<div class="rounded-xl border border-border-default bg-surface-raised p-4">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Effort</p>
						{#if s.effort.avg != null}
							<span class="text-lg font-bold text-accent tabular-nums">{s.effort.avg}</span>
						{/if}
					</div>
					{#if s.effort.avg != null}
						<div class="mt-2 flex items-center gap-1.5 {trendColor(s.effort.trend.direction)}">
							<svelte:component this={trendIcon(s.effort.trend.direction)} class="h-3.5 w-3.5" />
							<p class="text-sm">
								{trendWord(s.effort.trend.direction)}
								{#if s.effort.trend.delta !== 0}
									<span class="text-text-muted"
										>({s.effort.trend.delta > 0 ? '+' : ''}{s.effort.trend.delta})</span
									>
								{/if}
							</p>
						</div>
						{#if s.hasFeedback && s.effortGap != null}
							<p class="mt-1.5 text-xs text-text-muted">
								Reviewers rate your effort {gapDescription(s.effortGap)}
							</p>
						{/if}
					{:else}
						<p class="mt-2 text-sm text-text-muted">
							Complete your first check-in to see your effort trend
						</p>
					{/if}
				</div>

				<!-- 2. Performance -->
				<div class="rounded-xl border border-border-default bg-surface-raised p-4">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
							Performance
						</p>
						{#if s.performance.avg != null}
							<span class="text-lg font-bold text-warning tabular-nums">{s.performance.avg}</span>
						{/if}
					</div>
					{#if s.performance.avg != null}
						<div class="mt-2 flex items-center gap-1.5 {trendColor(s.performance.trend.direction)}">
							<svelte:component
								this={trendIcon(s.performance.trend.direction)}
								class="h-3.5 w-3.5"
							/>
							<p class="text-sm">
								{trendWord(s.performance.trend.direction)}
								{#if s.performance.trend.delta !== 0}
									<span class="text-text-muted"
										>({s.performance.trend.delta > 0 ? '+' : ''}{s.performance.trend.delta})</span
									>
								{/if}
							</p>
						</div>
						{#if s.hasFeedback && s.perfGap != null}
							<p class="mt-1.5 text-xs text-text-muted">
								Reviewers rate your performance {gapDescription(s.perfGap)}
							</p>
						{/if}
					{:else}
						<p class="mt-2 text-sm text-text-muted">
							Complete your first check-in to see your performance trend
						</p>
					{/if}
				</div>

				<!-- 3. Perception gap summary -->
				{#if s.hasFeedback && (s.effortGap != null || s.perfGap != null)}
					<div class="rounded-xl border border-border-default bg-surface-raised p-4">
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
							How others see you
						</p>
						<div class="mt-2 space-y-1">
							{#if s.effortGap != null}
								{@const aligned = Math.abs(s.effortGap) < 0.5}
								<div class="flex items-center justify-between text-sm">
									<span class="text-text-secondary">Effort gap</span>
									<span
										class="{aligned
											? 'text-success'
											: Math.abs(s.effortGap) > 1.5
												? 'text-warning'
												: 'text-text-primary'} font-semibold tabular-nums"
									>
										{aligned ? 'Aligned' : `${s.effortGap > 0 ? '+' : ''}${s.effortGap}`}
									</span>
								</div>
							{/if}
							{#if s.perfGap != null}
								{@const aligned = Math.abs(s.perfGap) < 0.5}
								<div class="flex items-center justify-between text-sm">
									<span class="text-text-secondary">Performance gap</span>
									<span
										class="{aligned
											? 'text-success'
											: Math.abs(s.perfGap) > 1.5
												? 'text-warning'
												: 'text-text-primary'} font-semibold tabular-nums"
									>
										{aligned ? 'Aligned' : `${s.perfGap > 0 ? '+' : ''}${s.perfGap}`}
									</span>
								</div>
							{/if}
						</div>
						<p class="mt-2 text-xs text-text-muted">
							{#if s.effortGap != null && s.perfGap != null && Math.abs(s.effortGap) < 0.5 && Math.abs(s.perfGap) < 0.5}
								Your reviewers see you the way you see yourself. Strong self-awareness.
							{:else if s.perfGap != null && s.perfGap > 1.5}
								You rate your performance higher than your reviewers do. Dig deeper in your next
								session.
							{:else if s.perfGap != null && s.perfGap < -1.5}
								Your reviewers think you're doing better than you think. Trust the feedback.
							{:else}
								Small gaps are normal. Track this over time.
							{/if}
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- AI Insight teaser -->
		{#if data.latestInsight?.content}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual/insights"
				class="group rounded-xl border border-border-default bg-surface-raised p-4 transition-all hover:border-accent/30"
			>
				<div class="mb-1 flex items-center gap-1.5">
					<Sparkles class="h-3.5 w-3.5 text-accent" />
					<span class="text-xs font-semibold text-accent">AI Insight</span>
				</div>
				<p class="line-clamp-3 text-sm leading-relaxed text-text-secondary">
					{data.latestInsight.content.slice(0, 200)}{data.latestInsight.content.length > 200
						? '...'
						: ''}
				</p>
				<p class="mt-2 text-xs font-semibold text-accent group-hover:underline">
					Read more <ArrowRight class="inline h-3 w-3" />
				</p>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		<!-- Dig deeper links -->
		<div class="flex flex-wrap gap-2">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual/insights"
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				Full Insights
			</a>
			<a
				href="/individual/dashboard"
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				Charts & Trends
			</a>
			<a
				href="/individual/feedback"
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				Reviewer Feedback
			</a>
			<a
				href="/individual/ask"
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				Ask Your Data
			</a>
			<a
				href="/individual/history"
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				History
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{/if}
</section>
