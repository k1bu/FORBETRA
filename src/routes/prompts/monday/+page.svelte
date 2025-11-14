<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
</script>

<section class="mx-auto flex max-w-3xl flex-col gap-6 p-4">
	<header class="space-y-2">
		<p class="text-sm text-neutral-400 uppercase">Week {data.weekNumber} intention</p>
		<h1 class="text-2xl font-semibold">{data.prompt.heading}</h1>
		<p class="text-neutral-600">{data.prompt.question}</p>
		<p class="text-xs tracking-wide text-neutral-500 uppercase">
			Cycle started on {formatDate(data.cycle.startDate)}
		</p>
	</header>

	{#if data.coachNotes && data.coachNotes.length > 0}
		<section class="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h2 class="text-sm font-semibold text-blue-900">Message from your coach</h2>
			{#each data.coachNotes as note (note.id)}
				<div class="rounded border border-blue-200 bg-white p-3">
					<p class="text-sm text-blue-900">{note.content}</p>
					<p class="mt-1 text-xs text-blue-600">— {note.coachName}</p>
				</div>
			{/each}
		</section>
	{/if}

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
			Intention saved.
		</div>
	{/if}

	<form method="post" class="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
		<label class="text-sm font-semibold text-neutral-500 uppercase" for="subgoalId">
			Focus area
		</label>
		<select
			id="subgoalId"
			name="subgoalId"
			required
			class="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
		>
			<option value="">Select a subgoal</option>
			{#each data.subgoals as subgoal (subgoal.id)}
				<option
					value={subgoal.id}
					selected={data.existing ? data.existing.subgoalId === subgoal.id : false}
				>
					{subgoal.label}
				</option>
			{/each}
		</select>

		<label class="text-sm font-medium text-neutral-700" for="intention">
			Your commitment for the week
		</label>
		<textarea
			id="intention"
			name="intention"
			rows="6"
			class="w-full rounded border border-neutral-300 px-3 py-2"
			>{data.existing?.intention ?? ''}</textarea
		>
		<p class="text-xs text-neutral-500">Minimum 25 characters.</p>

		<div class="flex justify-end">
			<button type="submit" class="rounded bg-black px-4 py-2 text-sm font-medium text-white">
				Save intention
			</button>
		</div>
	</form>
</section>
