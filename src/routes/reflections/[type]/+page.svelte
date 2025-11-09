<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const reflectionLabel =
		data.reflectionType === 'EFFORT' ? 'Effort check-in' : 'Progress reflection';
	const sliderLabel = data.reflectionType === 'EFFORT' ? 'Effort score' : 'Progress score';
	const helperText =
		data.reflectionType === 'EFFORT'
			? 'How much effort did you invest this week?'
			: 'How satisfied are you with your progress this week?';

	const previousBySubgoal = new Map(data.previousEntries.map((entry) => [entry.subgoalId, entry]));

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
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
