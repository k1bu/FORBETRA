<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import HistoricRatingsChart from '$lib/components/HistoricRatingsChart.svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const reflectionLabel =
		data.reflectionType === 'RATING_A' ? 'Wednesday check-in' : 'Friday check-in';
	const sliderLabel = data.reflectionType === 'RATING_A' ? 'Effort score' : 'Performance score';
	const helperText =
		data.reflectionType === 'RATING_A'
			? 'How much effort did you invest this week?'
			: 'How satisfied are you with your progress this week?';

	const previousBySubgoal = new Map(data.previousEntries.map((entry) => [entry.subgoalId, entry]));

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	const getPreviousRatings = (subgoalId: string) => {
		return data.previousRatingsBySubgoal?.[subgoalId] ?? null;
	};

	const getHistoricRatings = (subgoalId: string) => {
		return data.historicRatingsBySubgoal?.[subgoalId] ?? [];
	};
</script>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4">
	<header class="space-y-2">
		<p class="text-sm text-neutral-400 uppercase">Week {data.currentWeek}</p>
		<h1 class="text-2xl font-semibold">{reflectionLabel}</h1>
		<p class="text-neutral-600">
			Current cycle started on {formatDate(data.cycle.startDate)}. Submit a check-in for each
			subgoal below.
		</p>
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<div class="space-y-4">
		{#each data.subgoals as subgoal (subgoal.id)}
			{@const previous = previousBySubgoal.get(subgoal.id)}
			{@const previousRatings = getPreviousRatings(subgoal.id)}
			<form
				method="post"
				class="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
			>
				<input type="hidden" name="subgoalId" value={subgoal.id} />
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-lg font-semibold">{subgoal.label}</h2>
						{#if subgoal.description}
							<p class="text-sm text-neutral-600">{subgoal.description}</p>
						{/if}
					</div>
					{#if form?.success && form.subgoalId === subgoal.id}
						<span class="text-sm text-emerald-600">Saved</span>
					{:else if previous?.score !== null}
						<span class="text-xs tracking-wide text-neutral-500 uppercase">
							Last submitted: {previous.score}
						</span>
					{/if}
				</div>
				{#if previousRatings && (previousRatings.effortScore !== null || previousRatings.performanceScore !== null)}
					{@const historicRatings = getHistoricRatings(subgoal.id)}
					<div class="rounded-lg border border-blue-100/50 bg-blue-50/30 p-3">
						<div class="mb-2">
							<p class="text-xs font-semibold text-blue-800">Your last ratings:</p>
						</div>
						<div class="flex gap-4 text-sm">
							{#if previousRatings.effortScore !== null}
								<div class="flex items-center gap-2">
									<span class="text-blue-600">Effort:</span>
									<span class="font-semibold text-blue-800">{previousRatings.effortScore}</span>
								</div>
							{/if}
							{#if previousRatings.performanceScore !== null}
								<div class="flex items-center gap-2">
									<span class="text-blue-600">Performance:</span>
									<span class="font-semibold text-blue-800">{previousRatings.performanceScore}</span>
								</div>
							{/if}
						</div>
						<p class="mt-2 text-xs text-blue-600">Use this as context - adjust freely based on this week.</p>
						{#if historicRatings.length > 1}
							<div class="mt-3">
								<HistoricRatingsChart historicRatings={historicRatings} />
							</div>
						{/if}
					</div>
				{/if}
				<label class="text-sm font-medium text-neutral-700" for={`score-${subgoal.id}`}>
					{sliderLabel}
				</label>
				<input
					type="range"
					name="score"
					id={`score-${subgoal.id}`}
					min="0"
					max="10"
					step="1"
					value={previous?.score ?? 5}
					class="w-full"
				/>
				<p class="text-xs text-neutral-500">{helperText}</p>

				<label class="text-sm font-medium text-neutral-700" for={`notes-${subgoal.id}`}>
					Notes (optional)
				</label>
				<textarea
					name="notes"
					id={`notes-${subgoal.id}`}
					rows="3"
					class="w-full rounded border border-neutral-300 px-3 py-2"
					>{previous?.notes ?? ''}</textarea
				>

				<div class="flex justify-end">
					<button type="submit" class="rounded bg-black px-4 py-2 text-sm font-medium text-white">
						Save reflection
					</button>
				</div>
			</form>
		{/each}
	</div>
</section>
