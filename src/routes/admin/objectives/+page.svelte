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

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-neutral-900">Objectives & Cycles ({data.objectives.length})</h1>
		<p class="text-sm text-neutral-600">All objectives across all users</p>
	</header>

	<div class="flex items-center gap-3">
		<input
			type="search"
			placeholder="Search by title, user name, or email..."
			class="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
			bind:value={searchTerm}
		/>
		<span class="text-xs text-neutral-500">{filtered.length} shown</span>
	</div>

	<div class="space-y-3">
		{#each filtered as obj (obj.id)}
			<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
				<div class="flex items-start justify-between gap-3">
					<div class="flex-1">
						<a href="/admin/objectives/{obj.id}" class="text-base font-semibold text-neutral-900 hover:text-blue-700 hover:underline">
							{obj.title}
						</a>
						{#if obj.description}
							<p class="mt-1 text-sm text-neutral-600 line-clamp-2">{obj.description}</p>
						{/if}
						<div class="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
							<a href="/admin/users/{obj.user.id}" class="hover:text-blue-600">
								{obj.user.name ?? obj.user.email}
							</a>
							<span>{obj._count.subgoals} subgoals</span>
							<span>{obj._count.cycles} cycles</span>
							<span>{obj._count.stakeholders} stakeholders</span>
						</div>
					</div>
					<span class="shrink-0 rounded px-2 py-1 text-xs font-semibold {obj.active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}">
						{obj.active ? 'Active' : 'Inactive'}
					</span>
				</div>
			</div>
		{/each}

		{#if filtered.length === 0}
			<div class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
				No objectives found.
			</div>
		{/if}
	</div>
</section>
