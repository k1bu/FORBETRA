<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let searchTerm = $state('');

	const filtered = $derived(
		data.objectives.filter((obj) => {
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				obj.title.toLowerCase().includes(q) ||
				(obj.user?.name ?? '').toLowerCase().includes(q) ||
				obj.user.email.toLowerCase().includes(q)
			);
		})
	);
</script>

<svelte:head>
	<title>Objectives & Cycles | Forbetra Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">Objectives & Cycles ({data.objectives.length})</h1>
		<p class="text-sm text-text-secondary">All objectives across all users</p>
	</header>

	<div class="flex items-center gap-3">
		<input
			type="search"
			placeholder="Search by title, user name, or email..."
			class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
			bind:value={searchTerm}
		/>
		<span class="text-xs text-text-tertiary">{filtered.length} shown</span>
	</div>

	<div class="space-y-3">
		{#each filtered as obj (obj.id)}
			<div class="rounded-xl border border-border-default bg-surface-raised p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="flex-1">
						<a href="/admin/objectives/{obj.id}" class="text-base font-semibold text-text-primary hover:text-accent hover:underline">
							{obj.title}
						</a>
						{#if obj.description}
							<p class="mt-1 text-sm text-text-secondary line-clamp-2">{obj.description}</p>
						{/if}
						<div class="mt-2 flex flex-wrap gap-3 text-xs text-text-tertiary">
							<a href="/admin/users/{obj.user.id}" class="hover:text-accent">
								{obj.user.name ?? obj.user.email}
							</a>
							<span>{obj._count.subgoals} sub-objectives</span>
							<span>{obj._count.cycles} cycles</span>
							<span>{obj._count.stakeholders} stakeholders</span>
						</div>
					</div>
					<span class="shrink-0 rounded px-2 py-1 text-xs font-semibold {obj.active ? 'bg-success-muted text-success' : 'bg-surface-subtle text-text-tertiary'}">
						{obj.active ? 'Active' : 'Inactive'}
					</span>
				</div>
			</div>
		{/each}

		{#if filtered.length === 0}
			<div class="rounded-xl border border-dashed border-border-strong bg-surface-raised p-8 text-center text-sm text-text-tertiary">
				No objectives found.
			</div>
		{/if}
	</div>
</section>
