<script lang="ts">
	import type { PageData } from './$types';
	import { CircleCheck } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	const formatDate = (iso: string | null) => {
		if (!iso) return 'TBD';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
	};
</script>

<svelte:head>
	<title>Onboarding Complete | Forbetra</title>
</svelte:head>

<section class="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-8 p-4 pb-12">
	<!-- Success Card -->
	<div class="w-full rounded-2xl border border-border-default bg-surface-raised p-8 text-center">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-muted">
			<CircleCheck class="h-8 w-8 text-success" />
		</div>
		<h1 class="text-3xl font-bold text-text-primary">You're all set!</h1>
		<p class="mt-2 text-base text-text-secondary">
			Your growth journey starts now. Everything is in place for your first cycle.
		</p>
		<p class="mt-1 text-sm text-text-tertiary">
			Small, consistent steps lead to real transformation.
		</p>
	</div>

	<!-- Summary Cards -->
	<div class="w-full space-y-4">
		<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
			<h2 class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Objective</h2>
			<h3 class="mt-2 text-lg font-semibold text-text-primary">{data.objective.title}</h3>
			{#if data.objective.description}
				<p class="mt-1 text-sm text-text-secondary">{data.objective.description}</p>
			{/if}
		</div>

		<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
			<h2 class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Cycle</h2>
			{#if data.cycle}
				<p class="mt-2 text-lg font-semibold text-text-primary">{data.cycle.label ?? 'Cycle 1'}</p>
				<p class="text-sm text-text-secondary">
					{formatDate(data.cycle.startDate)} &rarr; {formatDate(data.cycle.endDate)}
				</p>
			{:else}
				<p class="mt-2 text-sm text-text-secondary">We'll generate your first cycle shortly.</p>
			{/if}
		</div>

		{#if data.subgoals.length > 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
				<h2 class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
					{#if data.subgoals.length === 1}
						Sub-objective
					{:else}
						Sub-objectives ({data.subgoals.length})
					{/if}
				</h2>
				<div class="mt-2 space-y-3">
					{#each data.subgoals as subgoal}
						<div class="border-t border-border-default pt-3 first:border-t-0 first:pt-0">
							<p class="font-semibold text-text-primary">{subgoal.label}</p>
							{#if subgoal.description}
								<p class="mt-1 text-sm text-text-secondary">{subgoal.description}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if data.stakeholders.length > 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
				<h2 class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
					{#if data.stakeholders.length === 1}
						Stakeholder
					{:else}
						Stakeholders ({data.stakeholders.length})
					{/if}
				</h2>
				<div class="mt-2 space-y-3">
					{#each data.stakeholders as stakeholder}
						<div class="border-t border-border-default pt-3 first:border-t-0 first:pt-0">
							<p class="font-semibold text-text-primary">{stakeholder.name}</p>
							<p class="text-sm text-text-secondary">{stakeholder.email}</p>
							{#if stakeholder.relationship}
								<p class="mt-1 text-xs uppercase tracking-wide text-text-tertiary">
									{stakeholder.relationship}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex w-full flex-col items-center gap-3 border-t border-border-default pt-6 sm:flex-row sm:justify-between">
		<p class="text-sm text-text-tertiary">Next: complete your first check-in to set your baseline. Then you're fully live!</p>
		<div class="flex gap-3">
			<a
				href="/onboarding"
				class="rounded-xl border border-border-default bg-surface-raised px-5 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:bg-surface-subtle"
			>
				Make changes
			</a>
			<a
				href="/individual"
				class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
			>
				Go to Today
			</a>
		</div>
	</div>
</section>
