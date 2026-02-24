<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const obj = data.objective;

	const formatDate = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};
</script>

<svelte:head>
	<title>Objective Detail | Forbetra Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header>
		<a href="/admin/objectives" class="text-sm font-medium text-text-tertiary hover:text-text-secondary">&larr; Back to Objectives</a>
		<h1 class="mt-1 text-2xl font-bold text-text-primary">{obj.title}</h1>
		{#if obj.description}
			<p class="mt-1 text-text-secondary">{obj.description}</p>
		{/if}
		<div class="mt-2 flex gap-4 text-sm text-text-tertiary">
			<a href="/admin/users/{obj.user.id}" class="hover:text-accent">{obj.user.name ?? obj.user.email}</a>
			<span class="font-semibold {obj.active ? 'text-success' : 'text-text-tertiary'}">{obj.active ? 'Active' : 'Inactive'}</span>
		</div>
	</header>

	<!-- Subgoals -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Sub-objectives ({obj.subgoals.length})</h2>
		{#if obj.subgoals.length > 0}
			<ul class="space-y-2">
				{#each obj.subgoals as sg, idx (sg.id)}
					<li class="flex items-start gap-3 rounded-lg bg-surface-subtle px-3 py-2">
						<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-xs font-bold">{idx + 1}</span>
						<div>
							<p class="font-medium text-text-primary">{sg.label}</p>
							{#if sg.description}
								<p class="text-xs text-text-secondary">{sg.description}</p>
							{/if}
							<p class="mt-1 text-xs text-text-tertiary">Metric: {sg.metricType} &middot; {sg.active ? 'Active' : 'Inactive'}</p>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-text-tertiary">No sub-objectives defined.</p>
		{/if}
	</div>

	<!-- Cycles -->
	{#each obj.cycles as cycle (cycle.id)}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold uppercase tracking-wide text-text-tertiary">{cycle.label ?? 'Cycle'}</h2>
				<span class="rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold uppercase">{cycle.status}</span>
			</div>
			<p class="mt-1 text-xs text-text-tertiary">
				{formatDate(cycle.startDate)} &mdash; {formatDate(cycle.endDate)} &middot;
				{cycle._count.reflections} reflections &middot; {cycle._count.coachNotes} notes
			</p>

			{#if cycle.reflections.length > 0}
				<div class="mt-3 overflow-x-auto">
					<table class="min-w-full text-xs">
						<thead>
							<tr class="border-b border-border-default text-left text-text-tertiary">
								<th class="px-2 py-1">Week</th>
								<th class="px-2 py-1">Type</th>
								<th class="px-2 py-1">Effort</th>
								<th class="px-2 py-1">Performance</th>
								<th class="px-2 py-1">Date</th>
							</tr>
						</thead>
						<tbody>
							{#each cycle.reflections as refl (refl.id)}
								<tr class="border-b border-border-default">
									<td class="px-2 py-1 font-medium">{refl.weekNumber}</td>
									<td class="px-2 py-1">{refl.reflectionType}</td>
									<td class="px-2 py-1">{refl.effortScore ?? '--'}</td>
									<td class="px-2 py-1">{refl.performanceScore ?? '--'}</td>
									<td class="px-2 py-1 text-text-tertiary">{formatDate(refl.submittedAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Stakeholders -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Stakeholders ({obj.stakeholders.length})</h2>
		{#if obj.stakeholders.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="border-b border-border-default text-left text-xs text-text-tertiary">
							<th class="px-3 py-2">Name</th>
							<th class="px-3 py-2">Email</th>
							<th class="px-3 py-2">Relationship</th>
							<th class="px-3 py-2">Feedback Count</th>
							<th class="px-3 py-2">Last Feedback</th>
						</tr>
					</thead>
					<tbody>
						{#each obj.stakeholders as sh (sh.id)}
							<tr class="border-b border-border-default">
								<td class="px-3 py-2 font-medium">{sh.name}</td>
								<td class="px-3 py-2 text-text-secondary">{sh.email}</td>
								<td class="px-3 py-2">{sh.relationship ?? '--'}</td>
								<td class="px-3 py-2">{sh._count.feedbacks}</td>
								<td class="px-3 py-2 text-text-tertiary">{sh.feedbacks[0]?.submittedAt ? formatDate(sh.feedbacks[0].submittedAt) : 'Never'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-text-tertiary">No stakeholders linked.</p>
		{/if}
	</div>
</section>
