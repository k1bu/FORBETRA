<script lang="ts">
	import type { PageData } from './$types';
	import { Flame, ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	const trendIcon = (dir: 'up' | 'down' | 'flat') =>
		dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
	const trendColor = (dir: 'up' | 'down' | 'flat') =>
		dir === 'up' ? 'text-success' : dir === 'down' ? 'text-error' : 'text-text-tertiary';

	const gapWord = (gap: number | null): string => {
		if (gap == null) return '';
		const abs = Math.abs(gap);
		if (abs < 0.5) return 'Aligned';
		return gap > 0 ? `You +${abs.toFixed(1)}` : `They +${abs.toFixed(1)}`;
	};
	const gapColor = (gap: number | null): string => {
		if (gap == null) return '';
		if (Math.abs(gap) < 0.5) return 'text-success';
		if (Math.abs(gap) > 1.5) return 'text-warning';
		return 'text-text-secondary';
	};
</script>

<svelte:head>
	<title>Home | Forbetra</title>
</svelte:head>

<section class="mx-auto max-w-lg px-5 pt-8 pb-20">
	{#if !data.isOnboardingComplete}
		<div class="py-16 text-center">
			<p class="text-4xl">&#127793;</p>
			<h1 class="mt-4 text-2xl leading-tight font-bold text-text-primary">
				Your growth journey<br />starts here
			</h1>
			<p class="mt-3 text-base leading-relaxed text-text-secondary">
				Set a goal, invite your reviewers, and start checking in weekly.
			</p>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/onboarding"
				class="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-accent/30"
			>
				Get Started <ArrowRight class="h-4 w-4" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{:else if data.cycle?.isCycleCompleted}
		<div class="py-16 text-center">
			<p class="text-4xl">&#127942;</p>
			<h1 class="mt-4 text-2xl font-bold text-text-primary">Journey complete</h1>
			<p class="mt-3 text-base leading-relaxed text-text-secondary">
				You did the work. Now see what the data says.
			</p>
			<div class="mt-8 flex justify-center gap-3">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/progress"
					class="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover"
				>
					View Report <ArrowRight class="h-4 w-4" />
				</a>
				<a
					href="/individual/new-cycle"
					class="rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-raised"
				>
					Start New
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>
	{:else}
		<!-- ═══ Active journey ═══ -->

		<!-- Greeting -->
		<div class="mb-10">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-text-tertiary">
						Week {data.currentWeek}{#if data.totalWeeks}<span class="text-text-muted">
								of {data.totalWeeks}</span
							>{/if}
					</p>
					<h1 class="mt-1 text-2xl leading-tight font-bold text-text-primary">
						{data.objective?.title ?? 'Your Journey'}
					</h1>
				</div>
				{#if data.summary?.currentStreak && data.summary.currentStreak > 0}
					<div class="flex items-center gap-1.5 pt-1">
						<Flame class="h-4 w-4 text-warning" />
						<span class="text-sm font-bold text-warning">{data.summary.currentStreak}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- CTA -->
		{#if data.nextAction}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual/checkin"
				class="group mb-10 flex items-center justify-between rounded-2xl bg-accent/10 px-6 py-5 transition-all hover:bg-accent/15"
			>
				<div>
					<p class="text-base font-semibold text-accent">Check in</p>
					<p class="mt-0.5 text-sm text-text-secondary">
						How's your effort and performance this week?
					</p>
				</div>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-transform group-hover:translate-x-0.5"
				>
					<ArrowRight class="h-5 w-5" />
				</div>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		<!-- Signals -->
		{#if data.signals}
			{@const s = data.signals}

			<!-- Effort + Performance side by side -->
			<div class="mb-10 grid grid-cols-2 gap-6">
				<!-- Effort -->
				<div>
					<p class="text-xs font-medium tracking-wider text-text-muted uppercase">Effort</p>
					{#if s.effort.avg != null}
						<p class="mt-2 text-4xl font-bold text-data-effort tabular-nums">{s.effort.avg}</p>
						<div class="mt-1 flex items-center gap-1 {trendColor(s.effort.trend.direction)}">
							<svelte:component this={trendIcon(s.effort.trend.direction)} class="h-3.5 w-3.5" />
							<span class="text-xs">
								{s.effort.trend.delta > 0 ? '+' : ''}{s.effort.trend.delta}
							</span>
						</div>
						{#if s.hasFeedback && s.effortGap != null}
							<p class="mt-3 text-xs {gapColor(s.effortGap)}">
								Reviewers: {gapWord(s.effortGap)}
							</p>
						{/if}
					{:else}
						<p class="mt-2 text-3xl font-light text-text-muted">—</p>
						<p class="mt-1 text-xs text-text-muted">Check in to start tracking</p>
					{/if}
				</div>

				<!-- Performance -->
				<div>
					<p class="text-xs font-medium tracking-wider text-text-muted uppercase">Performance</p>
					{#if s.performance.avg != null}
						<p class="mt-2 text-4xl font-bold text-data-performance tabular-nums">
							{s.performance.avg}
						</p>
						<div class="mt-1 flex items-center gap-1 {trendColor(s.performance.trend.direction)}">
							<svelte:component
								this={trendIcon(s.performance.trend.direction)}
								class="h-3.5 w-3.5"
							/>
							<span class="text-xs">
								{s.performance.trend.delta > 0 ? '+' : ''}{s.performance.trend.delta}
							</span>
						</div>
						{#if s.hasFeedback && s.perfGap != null}
							<p class="mt-3 text-xs {gapColor(s.perfGap)}">
								Reviewers: {gapWord(s.perfGap)}
							</p>
						{/if}
					{:else}
						<p class="mt-2 text-3xl font-light text-text-muted">—</p>
						<p class="mt-1 text-xs text-text-muted">Check in to start tracking</p>
					{/if}
				</div>
			</div>

			<!-- Perception gap — only when meaningful -->
			{#if s.hasFeedback && s.perfGap != null && s.effortGap != null}
				{@const bothAligned = Math.abs(s.effortGap) < 0.5 && Math.abs(s.perfGap) < 0.5}
				{@const bigGap =
					(s.perfGap != null && Math.abs(s.perfGap) > 1.5) ||
					(s.effortGap != null && Math.abs(s.effortGap) > 1.5)}
				<div
					class="mb-10 border-l-2 {bothAligned
						? 'border-success/40'
						: bigGap
							? 'border-warning/40'
							: 'border-border-strong'} pl-4"
				>
					<p class="text-sm leading-relaxed text-text-secondary">
						{#if bothAligned}
							Your reviewers see you the way you see yourself. That's rare — strong self-awareness.
						{:else if s.perfGap != null && s.perfGap > 1.5}
							Your reviewers rate your performance lower than you do. Worth exploring in your next
							coaching session.
						{:else if s.perfGap != null && s.perfGap < -1.5}
							Your reviewers think you're doing better than you give yourself credit for.
						{:else}
							Small gaps between self and reviewer ratings are normal. Track how these shift over
							time.
						{/if}
					</p>
				</div>
			{/if}
		{/if}

		<!-- AI Insight -->
		{#if data.latestInsight?.content}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a href="/individual/progress" class="group mb-10 block">
				<div class="mb-2 flex items-center gap-1.5">
					<Sparkles class="h-3.5 w-3.5 text-ai" />
					<span class="text-xs font-semibold text-ai">Latest insight</span>
				</div>
				<p class="line-clamp-3 text-sm leading-relaxed text-text-secondary">
					{data.latestInsight.content.slice(0, 250)}{data.latestInsight.content.length > 250
						? '...'
						: ''}
				</p>
				<span
					class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ai transition-colors group-hover:text-ai-hover"
				>
					See full report <ArrowRight class="h-3 w-3" />
				</span>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		<!-- Secondary nav — just two clear paths -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<div class="flex gap-3">
			<a
				href="/individual/progress"
				class="flex-1 rounded-xl bg-surface-raised px-4 py-3 text-center text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
			>
				Progress & AI Report
			</a>
			<a
				href="/individual/feedback"
				class="flex-1 rounded-xl bg-surface-raised px-4 py-3 text-center text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
			>
				Reviewer Feedback
			</a>
		</div>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
</section>
