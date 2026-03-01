<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import HistoricRatingsChart from '$lib/components/HistoricRatingsChart.svelte';
	import {
		getScoreColor,
		getScoreBgColor,
		getButtonSelectedColors,
		getButtonHoverColors,
		getFocusRing,
		getScoreLabel
	} from '$lib/utils/scoreColors';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const reflectionLabel = 'Check-in';
	const scoreType =
		data.reflectionType === 'RATING_A' ? ('effort' as const) : ('performance' as const);
	const sliderLabel = data.reflectionType === 'RATING_A' ? 'Effort score' : 'Performance score';
	const helperText =
		data.reflectionType === 'RATING_A'
			? 'How much effort did you invest this week?'
			: 'How satisfied are you with your progress this week?';

	const previousBySubgoal = new Map(data.previousEntries.map((entry) => [entry.subgoalId, entry]));

	// Track selected scores per subgoal
	let scores = $state<Record<string, number>>({});
	const getScore = (subgoalId: string) => {
		if (scores[subgoalId] !== undefined) return scores[subgoalId];
		const previous = previousBySubgoal.get(subgoalId);
		return previous?.score ?? 5;
	};
	const setScore = (subgoalId: string, value: number) => {
		scores[subgoalId] = value;
	};

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	const getPreviousRatings = (subgoalId: string) => {
		return data.previousRatingsBySubgoal?.[subgoalId] ?? null;
	};

	const getHistoricRatings = (subgoalId: string) => {
		return data.historicRatingsBySubgoal?.[subgoalId] ?? [];
	};
</script>

<svelte:head>
	<title>Reflection | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
	<!-- Back to Today Link -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<div class="flex items-center justify-between">
		<a
			href="/individual"
			class="group flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
			aria-label="Back to Today"
		>
			<svg
				class="h-4 w-4 transition-transform group-hover:-translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Today
		</a>
	</div>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->

	<header class="space-y-3 text-center">
		<div
			class="inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent"
		>
			<span class="h-2 w-2 rounded-full bg-accent"></span>
			Week {data.currentWeek}
			{reflectionLabel}
		</div>
		<h1 class="text-3xl font-bold text-text-primary">{reflectionLabel}</h1>
		<p class="text-base text-text-secondary">
			Current cycle started on {formatDate(data.cycle.startDate)}. Submit a check-in for each focus
			area below.
		</p>
	</header>

	{#if form?.error}
		<div
			class="rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error"
			role="alert"
		>
			{form.error}
		</div>
	{/if}

	<div class="space-y-6">
		{#each data.subgoals as subgoal (subgoal.id)}
			{@const previous = previousBySubgoal.get(subgoal.id)}
			{@const previousRatings = getPreviousRatings(subgoal.id)}
			{@const currentScore = getScore(subgoal.id)}
			<form
				method="post"
				class="space-y-4 rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-border-strong"
			>
				<input type="hidden" name="subgoalId" value={subgoal.id} />
				<input type="hidden" name="score" value={currentScore} />
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-lg font-bold text-text-primary">{subgoal.label}</h2>
						{#if subgoal.description}
							<p class="text-sm text-text-secondary">{subgoal.description}</p>
						{/if}
					</div>
					{#if form?.success && form.subgoalId === subgoal.id}
						<span class="text-sm font-semibold text-success">Saved</span>
					{:else if previous && previous.score !== null}
						<span class="text-xs tracking-wide text-text-tertiary uppercase">
							Last submitted: {previous.score}
						</span>
					{/if}
				</div>
				{#if previousRatings && (previousRatings.effortScore !== null || previousRatings.performanceScore !== null)}
					{@const historicRatings = getHistoricRatings(subgoal.id)}
					<div class="rounded-xl border border-accent/20 bg-accent-muted p-4">
						<div class="mb-2">
							<p class="text-xs font-semibold text-accent">Your last ratings:</p>
						</div>
						<div class="flex gap-4 text-sm">
							{#if previousRatings.effortScore !== null}
								<div class="flex items-center gap-2">
									<span class="text-accent">Effort:</span>
									<span class="text-lg font-bold text-accent">{previousRatings.effortScore}</span>
								</div>
							{/if}
							{#if previousRatings.performanceScore !== null}
								<div class="flex items-center gap-2">
									<span class="text-accent">Performance:</span>
									<span class="text-lg font-bold text-accent"
										>{previousRatings.performanceScore}</span
									>
								</div>
							{/if}
						</div>
						<p class="mt-2 text-xs text-accent">
							Use this as context - adjust freely based on this week.
						</p>
						{#if historicRatings.length > 1}
							<div class="mt-3">
								<HistoricRatingsChart {historicRatings} />
							</div>
						{/if}
					</div>
				{/if}

				<!-- Score Label and Current Score Display -->
				<div class="flex items-center justify-between">
					<label class="text-sm font-semibold text-text-primary" for={`score-${subgoal.id}`}>
						{sliderLabel}
					</label>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							currentScore,
							scoreType
						)}"
						aria-valuetext="{sliderLabel}: {currentScore} out of 10"
					>
						<span class="text-lg font-bold {getScoreColor(currentScore, scoreType)}"
							>{currentScore}</span
						>
					</div>
				</div>

				<!-- Button Grid (replaces range slider) -->
				<div
					class="grid grid-cols-6 gap-2 sm:grid-cols-11"
					role="radiogroup"
					aria-label="{sliderLabel} selection"
					id={`score-${subgoal.id}`}
				>
					{#each Array.from({ length: 11 }, (_, idx) => idx) as i (i)}
						{@const isSelected = currentScore === i}
						{@const buttonColors = getButtonSelectedColors(i, scoreType)}
						{@const hoverColors = getButtonHoverColors(i, scoreType)}
						{@const focusRing = getFocusRing(i, scoreType)}
						<button
							type="button"
							onclick={() => setScore(subgoal.id, i)}
							aria-pressed={isSelected}
							aria-label="Score {i} out of 10"
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
								? buttonColors + ' shadow-md'
								: 'border-border-default bg-surface-raised text-text-secondary ' +
									hoverColors} focus:ring-2 focus:outline-none {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-text-tertiary">
						{data.reflectionType === 'RATING_A' ? 'Rarely intentional' : 'Not yet visible'}
					</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							currentScore,
							scoreType
						)} {getScoreColor(currentScore, scoreType)}"
					>
						{getScoreLabel(currentScore, scoreType)}
					</div>
					<span class="text-xs font-medium text-text-tertiary">
						{data.reflectionType === 'RATING_A' ? 'Relentless commitment' : 'Transformative impact'}
					</span>
				</div>
				<p class="text-xs text-text-muted italic">{helperText}</p>

				<label class="text-sm font-semibold text-text-primary" for={`notes-${subgoal.id}`}>
					Notes (optional)
				</label>
				<textarea
					name="notes"
					id={`notes-${subgoal.id}`}
					rows="3"
					class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
					placeholder="What went well? What's challenging?">{previous?.notes ?? ''}</textarea
				>

				<div class="flex justify-end">
					<button
						type="submit"
						class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
					>
						Save reflection
					</button>
				</div>
			</form>
		{/each}
	</div>
</section>
