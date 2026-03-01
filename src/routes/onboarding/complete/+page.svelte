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

<section
	class="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-8 p-4 pb-12"
>
	<!-- Success Card -->
	<div
		class="w-full rounded-2xl border border-success/30 bg-gradient-to-b from-success-muted to-surface-raised p-8 text-center"
	>
		<div
			class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-4 ring-success/20"
		>
			<CircleCheck class="h-8 w-8 text-success" />
		</div>
		<h1 class="text-3xl font-bold text-text-primary">You're ready to grow</h1>
		<p class="mt-2 text-base text-text-secondary">
			You've defined your objective, set your cadence, and built your feedback team. That clarity is
			rare — and it matters.
		</p>
		<p class="mt-3 text-sm font-medium text-accent">Your first check-in is how it all begins.</p>
	</div>

	<!-- Summary Cards -->
	<div class="w-full space-y-4">
		<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
			<h2 class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Objective</h2>
			<h3 class="mt-2 text-lg font-semibold text-text-primary">{data.objective.title}</h3>
			{#if data.objective.description}
				<p class="mt-1 text-sm text-text-secondary">{data.objective.description}</p>
			{/if}
		</div>

		<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
			<h2 class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Journey</h2>
			{#if data.cycle}
				<p class="mt-2 text-lg font-semibold text-text-primary">
					{data.cycle.label ?? 'Journey 1'}
				</p>
				<p class="text-sm text-text-secondary">
					{formatDate(data.cycle.startDate)} &rarr; {formatDate(data.cycle.endDate)}
				</p>
			{:else}
				<p class="mt-2 text-sm text-text-secondary">We'll generate your first journey shortly.</p>
			{/if}
		</div>

		{#if data.subgoals.length > 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
				<h2 class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
					{#if data.subgoals.length === 1}
						Focus Area
					{:else}
						Focus Areas ({data.subgoals.length})
					{/if}
				</h2>
				<div class="mt-2 space-y-3">
					{#each data.subgoals as subgoal (subgoal.label)}
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
				<h2 class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
					{#if data.stakeholders.length === 1}
						Rater
					{:else}
						Raters ({data.stakeholders.length})
					{/if}
				</h2>
				<div class="mt-2 space-y-3">
					{#each data.stakeholders as stakeholder (stakeholder.email)}
						<div class="border-t border-border-default pt-3 first:border-t-0 first:pt-0">
							<p class="font-semibold text-text-primary">{stakeholder.name}</p>
							<p class="text-sm text-text-secondary">{stakeholder.email}</p>
							{#if stakeholder.relationship}
								<p class="mt-1 text-xs tracking-wide text-text-tertiary uppercase">
									{stakeholder.relationship}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- What's Next -->
	<div class="w-full rounded-2xl border border-border-default bg-surface-raised p-5">
		<h2 class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
			What happens next
		</h2>
		<ul class="mt-3 space-y-2 text-sm text-text-secondary">
			<li class="flex items-start gap-2">
				<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
				Complete your first check-in to set your baseline scores
			</li>
			{#if data.stakeholders.length > 0}
				<li class="flex items-start gap-2">
					<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
					Your {data.stakeholders.length} rater{data.stakeholders.length > 1 ? 's' : ''} will receive
					feedback invitations
				</li>
			{/if}
			<li class="flex items-start gap-2">
				<span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
				AI insights start building after your second week of data
			</li>
		</ul>
	</div>

	<!-- Actions -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<div class="flex w-full flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
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
			Start Your First Check-in
		</a>
	</div>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</section>
