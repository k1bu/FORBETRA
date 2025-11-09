<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const reflectionLabel = (() => {
		switch (data.reflection.type) {
			case 'INTENTION':
				return 'Intention prompt';
			case 'EFFORT':
				return 'Effort check-in';
			case 'PROGRESS':
				return 'Progress reflection';
			default:
				return 'Reflection';
		}
	})();

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
</script>

<section class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-4">
	<header class="space-y-2">
		<p class="text-sm text-neutral-400 uppercase">{reflectionLabel}</p>
		<h1 class="text-2xl font-semibold">Share feedback for {data.reflection.participantName}</h1>
		<p class="text-neutral-600">
			Cycle: {data.reflection.cycleLabel}. Week {data.reflection.weekNumber} check-in on
			{formatDate(data.reflection.checkInDate)}.
		</p>
		<p class="text-xs tracking-wide text-neutral-500 uppercase">
			Hi {data.stakeholder.name}, your perspective helps keep progress aligned.
		</p>
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
			Thanks! Your feedback has been recorded.
		</div>
	{/if}

	<form method="post" class="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
		<input type="hidden" name="token" value={data.token} />

		<div class="grid gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<label class="block text-sm font-medium text-neutral-700" for="effortScore">
					Effort (0-10)
				</label>
				<input
					name="effortScore"
					id="effortScore"
					type="number"
					min="0"
					max="10"
					step="1"
					class="w-full rounded border border-neutral-300 px-3 py-2"
				/>
				<p class="text-xs text-neutral-500">How much effort did you observe this week?</p>
			</div>
			<div class="space-y-2">
				<label class="block text-sm font-medium text-neutral-700" for="progressScore">
					Progress (0-10)
				</label>
				<input
					name="progressScore"
					id="progressScore"
					type="number"
					min="0"
					max="10"
					step="1"
					class="w-full rounded border border-neutral-300 px-3 py-2"
				/>
				<p class="text-xs text-neutral-500">How would you rate the visible progress?</p>
			</div>
		</div>

		<div class="space-y-2">
			<label class="block text-sm font-medium text-neutral-700" for="comment">
				Share any context or encouragement
			</label>
			<textarea
				name="comment"
				id="comment"
				rows="5"
				class="w-full rounded border border-neutral-300 px-3 py-2"
			></textarea>
			<p class="text-xs text-neutral-500">Optional. Maximum 2000 characters.</p>
		</div>

		<div class="flex justify-end">
			<button type="submit" class="rounded bg-black px-4 py-2 text-sm font-medium text-white">
				Submit feedback
			</button>
		</div>
	</form>
</section>
