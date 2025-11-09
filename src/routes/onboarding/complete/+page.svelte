<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const formatDate = (iso: string | null) => {
		if (!iso) return 'TBD';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
	};
</script>

<section class="mx-auto max-w-3xl space-y-8">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">You're ready to begin</h1>
		<p class="text-neutral-600">
			Here’s a snapshot of your first growth cycle. You can refine anytime from your dashboard.
		</p>
	</header>

	<div class="grid gap-4 md:grid-cols-2">
		<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="text-sm font-semibold text-neutral-500 uppercase">Objective</h2>
			<h3 class="mt-2 text-lg font-semibold">{data.objective.title}</h3>
			{#if data.objective.description}
				<p class="mt-1 text-sm text-neutral-600">{data.objective.description}</p>
			{/if}
		</article>

		<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="text-sm font-semibold text-neutral-500 uppercase">Cycle</h2>
			{#if data.cycle}
				<p class="text-lg font-semibold">{data.cycle.label ?? 'Cycle 1'}</p>
				<p class="text-sm text-neutral-600">
					{formatDate(data.cycle.startDate)} → {formatDate(data.cycle.endDate)}
				</p>
			{:else}
				<p class="text-sm text-neutral-600">We'll generate your first cycle shortly.</p>
			{/if}
		</article>

		<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:col-span-2">
			<h2 class="text-sm font-semibold text-neutral-500 uppercase">First subgoal</h2>
			{#if data.subgoal}
				<p class="text-lg font-semibold">{data.subgoal.label}</p>
				{#if data.subgoal.description}
					<p class="mt-1 text-sm text-neutral-600">{data.subgoal.description}</p>
				{/if}
			{:else}
				<p class="text-sm text-neutral-600">No subgoal captured yet.</p>
			{/if}
		</article>

		<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:col-span-2">
			<h2 class="text-sm font-semibold text-neutral-500 uppercase">Stakeholder</h2>
			{#if data.stakeholder}
				<p class="text-lg font-semibold">{data.stakeholder.name}</p>
				<p class="text-sm text-neutral-600">{data.stakeholder.email}</p>
				{#if data.stakeholder.relationship}
					<p class="mt-1 text-xs tracking-wide text-neutral-500 uppercase">
						{data.stakeholder.relationship}
					</p>
				{/if}
			{:else}
				<p class="text-sm text-neutral-600">
					You can invite stakeholders later from your dashboard.
				</p>
			{/if}
		</article>
	</div>

	<div
		class="flex flex-col items-start gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="text-sm text-neutral-500">Next up: track your weekly prompts to stay accountable.</p>
		<div class="flex gap-2">
			<form method="get" action="/onboarding">
				<button
					type="submit"
					class="rounded border border-neutral-300 px-4 py-2 text-sm font-medium"
				>
					Make changes
				</button>
			</form>
			<form method="get" action="/dashboard">
				<button type="submit" class="rounded bg-black px-4 py-2 text-sm font-medium text-white">
					Go to dashboard
				</button>
			</form>
		</div>
	</div>
</section>
