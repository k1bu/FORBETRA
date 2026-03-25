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

<section class="mx-auto max-w-lg px-6 pt-12 pb-24">
	{#if !data.isOnboardingComplete}
		<!-- Welcome -->
		<div class="anim-fade-in py-20 text-center">
			<div class="glow-soft mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
				<span class="text-5xl">&#127793;</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">Start your growth journey</h1>
			<p class="mx-auto mt-4 max-w-xs text-base leading-relaxed text-text-secondary">
				Set a goal, invite your reviewers, and begin tracking your progress.
			</p>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/onboarding"
				class="mt-10 inline-flex items-center gap-2.5 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-surface-base shadow-[0_0_24px_rgba(232,160,74,0.2)] transition-all duration-350 hover:bg-accent-hover hover:shadow-[0_0_32px_rgba(232,160,74,0.3)] active:scale-[0.98]"
			>
				Get Started <ArrowRight class="h-4 w-4" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{:else if data.cycle?.isCycleCompleted}
		<!-- Complete -->
		<div class="anim-fade-in py-20 text-center">
			<div class="glow-soft mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
				<span class="text-5xl">&#127942;</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-text-primary">Journey complete</h1>
			<p class="mx-auto mt-4 max-w-xs text-base leading-relaxed text-text-secondary">
				You did the work. See what the data says.
			</p>
			<div class="mt-10 flex justify-center gap-3">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/progress"
					class="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-surface-base shadow-[0_0_24px_rgba(232,160,74,0.2)] transition-all duration-350 hover:bg-accent-hover active:scale-[0.98]"
				>
					View Report <ArrowRight class="h-4 w-4" />
				</a>
				<a
					href="/individual/new-cycle"
					class="rounded-full border border-border-strong px-7 py-3.5 text-sm font-semibold text-text-primary transition-all duration-350 hover:bg-surface-raised active:scale-[0.98]"
				>
					Start New
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>
	{:else}
		<!-- ═══ Active journey ═══ -->

		<!-- Header -->
		<div class="anim-slide-up mb-14">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs font-medium tracking-wider text-text-tertiary uppercase">
						Week {data.currentWeek}{#if data.totalWeeks}<span class="text-text-muted">
								/ {data.totalWeeks}</span
							>{/if}
					</p>
					<h1 class="mt-2 text-2xl font-bold tracking-tight text-text-primary">
						{data.objective?.title ?? 'Your Journey'}
					</h1>
				</div>
				{#if data.summary?.currentStreak && data.summary.currentStreak > 0}
					<div class="flex items-center gap-1.5 rounded-full bg-warning-muted px-3 py-1.5">
						<Flame class="h-3.5 w-3.5 text-warning" />
						<span class="text-xs font-bold text-warning">{data.summary.currentStreak}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- CTA -->
		{#if data.nextAction}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual/checkin"
				class="group anim-slide-up card card-hover mb-14 flex items-center justify-between px-6 py-6"
				style="--stagger: 1;"
			>
				<div>
					<p class="text-base font-semibold text-accent">Check in</p>
					<p class="mt-1 text-sm text-text-secondary">How did you show up this week?</p>
				</div>
				<div
					class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-surface-base shadow-[0_0_16px_rgba(232,160,74,0.2)] transition-all duration-350 group-hover:translate-x-0.5 group-hover:shadow-[0_0_24px_rgba(232,160,74,0.3)]"
				>
					<ArrowRight class="h-5 w-5" />
				</div>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		<!-- Signals -->
		{#if data.signals}
			{@const s = data.signals}

			<div
				class="anim-slide-up glow-amber relative mb-14 grid grid-cols-2 gap-10 py-2"
				style="--stagger: 2;"
			>
				<!-- Effort -->
				<div>
					<p class="text-[11px] font-semibold tracking-[0.1em] text-text-tertiary uppercase">
						Effort
					</p>
					{#if s.effort.avg != null}
						<p class="mt-3 text-5xl font-bold tracking-tight text-data-effort tabular-nums">
							{s.effort.avg}
						</p>
						<div class="mt-2 flex items-center gap-1.5 {trendColor(s.effort.trend.direction)}">
							<svelte:component this={trendIcon(s.effort.trend.direction)} class="h-3.5 w-3.5" />
							<span class="text-xs font-medium">
								{s.effort.trend.delta > 0 ? '+' : ''}{s.effort.trend.delta}
							</span>
						</div>
						{#if s.hasFeedback && s.effortGap != null}
							<p class="mt-4 text-xs {gapColor(s.effortGap)}">
								Reviewers: {gapWord(s.effortGap)}
							</p>
						{/if}
					{:else}
						<p class="mt-3 text-4xl font-extralight text-text-muted">—</p>
						<p class="mt-2 text-xs text-text-muted">Check in to start</p>
					{/if}
				</div>

				<!-- Performance -->
				<div>
					<p class="text-[11px] font-semibold tracking-[0.1em] text-text-tertiary uppercase">
						Performance
					</p>
					{#if s.performance.avg != null}
						<p class="mt-3 text-5xl font-bold tracking-tight text-data-performance tabular-nums">
							{s.performance.avg}
						</p>
						<div class="mt-2 flex items-center gap-1.5 {trendColor(s.performance.trend.direction)}">
							<svelte:component
								this={trendIcon(s.performance.trend.direction)}
								class="h-3.5 w-3.5"
							/>
							<span class="text-xs font-medium">
								{s.performance.trend.delta > 0 ? '+' : ''}{s.performance.trend.delta}
							</span>
						</div>
						{#if s.hasFeedback && s.perfGap != null}
							<p class="mt-4 text-xs {gapColor(s.perfGap)}">
								Reviewers: {gapWord(s.perfGap)}
							</p>
						{/if}
					{:else}
						<p class="mt-3 text-4xl font-extralight text-text-muted">—</p>
						<p class="mt-2 text-xs text-text-muted">Check in to start</p>
					{/if}
				</div>
			</div>

			<!-- Perception gap -->
			{#if s.hasFeedback && s.perfGap != null && s.effortGap != null}
				{@const bothAligned = Math.abs(s.effortGap) < 0.5 && Math.abs(s.perfGap) < 0.5}
				{@const bigGap = Math.abs(s.perfGap) > 1.5 || Math.abs(s.effortGap) > 1.5}
				<div
					class="anim-slide-up mb-14 border-l-2 py-1 pl-5 {bothAligned
						? 'border-success/30'
						: bigGap
							? 'border-warning/30'
							: 'border-border-strong'}"
					style="--stagger: 3;"
				>
					<p class="text-sm leading-relaxed text-text-secondary">
						{#if bothAligned}
							Your reviewers see you the way you see yourself. That's rare — strong self-awareness.
						{:else if s.perfGap > 1.5}
							Your reviewers rate your performance lower than you do. Worth exploring in your next
							session.
						{:else if s.perfGap < -1.5}
							Your reviewers think you're doing better than you give yourself credit for.
						{:else}
							Small gaps between self and reviewer ratings are normal. Watch how these shift.
						{/if}
					</p>
				</div>
			{/if}
		{/if}

		<!-- AI Insight -->
		{#if data.latestInsight?.content}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a href="/individual/progress" class="group anim-slide-up mb-14 block" style="--stagger: 4;">
				<div class="mb-2.5 flex items-center gap-2">
					<Sparkles class="h-3.5 w-3.5 text-accent" />
					<span class="text-[11px] font-semibold tracking-[0.1em] text-accent uppercase"
						>Latest insight</span
					>
				</div>
				<p class="line-clamp-3 text-sm leading-[1.7] text-text-secondary">
					{data.latestInsight.content.slice(0, 280)}{data.latestInsight.content.length > 280
						? '...'
						: ''}
				</p>
				<span
					class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-all duration-350 group-hover:gap-2.5"
				>
					Read full report <ArrowRight class="h-3 w-3" />
				</span>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		<!-- Secondary nav -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<div class="anim-slide-up grid grid-cols-2 gap-3" style="--stagger: 5;">
			<a href="/individual/progress" class="card card-hover px-5 py-4 text-center">
				<p class="text-sm font-medium text-text-secondary">Progress</p>
				<p class="mt-0.5 text-[11px] text-text-muted">Reports & charts</p>
			</a>
			<a href="/individual/feedback" class="card card-hover px-5 py-4 text-center">
				<p class="text-sm font-medium text-text-secondary">Feedback</p>
				<p class="mt-0.5 text-[11px] text-text-muted">What reviewers see</p>
			</a>
		</div>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
</section>
