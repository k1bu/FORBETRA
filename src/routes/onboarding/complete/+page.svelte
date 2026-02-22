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
		<p class="text-text-secondary">
			Here's a snapshot of your first growth cycle. You can refine anytime from your dashboard.
		</p>
	</header>

	<div class="grid gap-4 md:grid-cols-2">
		<article class="rounded-lg border border-border-default bg-surface-raised p-4">
			<h2 class="text-sm font-semibold text-text-tertiary uppercase">Objective</h2>
			<h3 class="mt-2 text-lg font-semibold">{data.objective.title}</h3>
			{#if data.objective.description}
				<p class="mt-1 text-sm text-text-secondary">{data.objective.description}</p>
			{/if}
		</article>

		<article class="rounded-lg border border-border-default bg-surface-raised p-4">
			<h2 class="text-sm font-semibold text-text-tertiary uppercase">Cycle</h2>
			{#if data.cycle}
				<p class="text-lg font-semibold">{data.cycle.label ?? 'Cycle 1'}</p>
				<p class="text-sm text-text-secondary">
					{formatDate(data.cycle.startDate)} → {formatDate(data.cycle.endDate)}
				</p>
			{:else}
				<p class="text-sm text-text-secondary">We'll generate your first cycle shortly.</p>
			{/if}
		</article>

		{#if data.subgoals.length > 0}
			<article class="rounded-lg border border-border-default bg-surface-raised p-4 md:col-span-2">
				<h2 class="text-sm font-semibold text-text-tertiary uppercase">
					{#if data.subgoals.length === 1}
						Subgoal
					{:else}
						Subgoals ({data.subgoals.length})
					{/if}
				</h2>
				<div class="mt-2 space-y-4">
					{#each data.subgoals as subgoal}
						<div class="border-t border-border-default pt-3 first:border-t-0 first:pt-0">
							<p class="text-lg font-semibold">{subgoal.label}</p>
							{#if subgoal.description}
								<p class="mt-1 text-sm text-text-secondary">{subgoal.description}</p>
							{/if}
						</div>
					{/each}
				</div>
			</article>
		{:else}
			<article class="rounded-lg border border-border-default bg-surface-raised p-4 md:col-span-2">
				<h2 class="text-sm font-semibold text-text-tertiary uppercase">Subgoals</h2>
				<p class="text-sm text-text-secondary">No subgoals captured yet.</p>
			</article>
		{/if}

		<article class="rounded-lg border border-border-default bg-surface-raised p-4 md:col-span-2">
			<h2 class="text-sm font-semibold text-text-tertiary uppercase">
				{#if data.stakeholders.length === 1}
					Stakeholder
				{:else if data.stakeholders.length > 1}
					Stakeholders ({data.stakeholders.length})
				{:else}
					Stakeholders
				{/if}
			</h2>
			{#if data.stakeholders.length > 0}
				<div class="mt-2 space-y-4">
					{#each data.stakeholders as stakeholder}
						<div class="border-t border-border-default pt-3 first:border-t-0 first:pt-0">
							<p class="text-lg font-semibold">{stakeholder.name}</p>
							<p class="text-sm text-text-secondary">{stakeholder.email}</p>
							{#if stakeholder.relationship}
								<p class="mt-1 text-xs tracking-wide text-text-tertiary uppercase">
									{stakeholder.relationship}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text-secondary">
					You can invite stakeholders later from your dashboard.
				</p>
			{/if}
		</article>
	</div>

	<div
		class="flex flex-col items-start gap-3 border-t border-border-default pt-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="text-sm text-text-tertiary">Next up: track your weekly prompts to stay accountable.</p>
		<div class="flex gap-2">
			<form method="get" action="/onboarding">
				<button
					type="submit"
					class="rounded border border-border-default px-4 py-2 text-sm font-medium"
				>
					Make changes
				</button>
			</form>
			<form method="get" action="/individual">
				<button type="submit" class="rounded bg-accent px-4 py-2 text-sm font-medium text-white">
					Go to dashboard
				</button>
			</form>
		</div>
	</div>
</section>
