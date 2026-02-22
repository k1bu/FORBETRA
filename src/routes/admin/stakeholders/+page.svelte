<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let searchTerm = $state('');

	const filtered = $derived(
		data.stakeholders.filter((sh) => {
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				sh.name.toLowerCase().includes(q) ||
				sh.email.toLowerCase().includes(q) ||
				(sh.individual?.name ?? '').toLowerCase().includes(q)
			);
		})
	);

	const formatDate = (value: string | Date | null) => {
		if (!value) return 'Never';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">Stakeholders ({data.stakeholders.length})</h1>
		<p class="text-sm text-text-secondary">All stakeholders across all individuals</p>
	</header>

	<div class="flex items-center gap-3">
		<input
			type="search"
			placeholder="Search by stakeholder or individual name..."
			class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
			bind:value={searchTerm}
		/>
		<span class="text-xs text-text-tertiary">{filtered.length} shown</span>
	</div>

	<div class="overflow-hidden rounded-lg border border-border-default bg-surface-raised">
		<table class="min-w-full divide-y divide-border-default text-sm">
			<thead class="bg-surface-subtle text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
				<tr>
					<th class="px-4 py-3">Name</th>
					<th class="px-4 py-3">Email</th>
					<th class="px-4 py-3">Phone</th>
					<th class="px-4 py-3">Relationship</th>
					<th class="px-4 py-3">Individual</th>
					<th class="px-4 py-3">Objective</th>
					<th class="px-4 py-3">Feedback</th>
					<th class="px-4 py-3">Last Feedback</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border-default">
				{#each filtered as sh (sh.id)}
					<tr class="hover:bg-surface-subtle">
						<td class="px-4 py-3 font-medium text-text-primary">{sh.name}</td>
						<td class="px-4 py-3 text-text-secondary">{sh.email}</td>
						<td class="px-4 py-3 text-text-secondary">{sh.phone ?? '--'}</td>
						<td class="px-4 py-3">{sh.relationship ?? '--'}</td>
						<td class="px-4 py-3">
							<a href="/admin/users/{sh.individual.id}" class="text-accent hover:underline">
								{sh.individual.name ?? sh.individual.email}
							</a>
						</td>
						<td class="px-4 py-3">
							{#if sh.objective}
								<a href="/admin/objectives/{sh.objective.id}" class="text-accent hover:underline">
									{sh.objective.title}
								</a>
							{:else}
								--
							{/if}
						</td>
						<td class="px-4 py-3 font-medium">{sh._count.feedbacks}</td>
						<td class="px-4 py-3 text-text-tertiary">{formatDate(sh.feedbacks[0]?.submittedAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
