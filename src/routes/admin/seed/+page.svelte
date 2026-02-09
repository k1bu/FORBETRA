<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();
</script>

<section class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-neutral-900">Seed Data</h1>
		<p class="text-sm text-neutral-600">Manage test data for the platform</p>
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}
	{#if form?.cleanSuccess}
		<div class="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{form.message}</div>
	{/if}

	<!-- Current Seed Status -->
	<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Current Seed Data</h2>
		{#if data.seedCount.users > 0}
			<div class="mb-3 grid grid-cols-3 gap-3">
				<div class="rounded-lg bg-blue-50 p-3 text-center">
					<p class="text-2xl font-bold text-blue-700">{data.seedCount.users}</p>
					<p class="text-xs text-blue-600">Total Seed Users</p>
				</div>
				<div class="rounded-lg bg-purple-50 p-3 text-center">
					<p class="text-2xl font-bold text-purple-700">{data.seedCount.coaches}</p>
					<p class="text-xs text-purple-600">Coaches</p>
				</div>
				<div class="rounded-lg bg-emerald-50 p-3 text-center">
					<p class="text-2xl font-bold text-emerald-700">{data.seedCount.individuals}</p>
					<p class="text-xs text-emerald-600">Individuals</p>
				</div>
			</div>
			<details class="mt-3">
				<summary class="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700">
					View seed users ({data.seedUsers.length})
				</summary>
				<ul class="mt-2 space-y-1 text-xs">
					{#each data.seedUsers as user (user.id)}
						<li class="flex items-center justify-between rounded bg-neutral-50 px-3 py-1.5">
							<span>{user.name ?? 'Unnamed'} ({user.email})</span>
							<span class="rounded bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold uppercase">{user.role}</span>
						</li>
					{/each}
				</ul>
			</details>
		{:else}
			<p class="text-sm text-neutral-500">No seed data in the database.</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Actions</h2>

		<div class="space-y-4">
			<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h3 class="font-semibold text-blue-900">Seed Comprehensive Data</h3>
				<p class="mt-1 text-xs text-blue-800">
					Creates 8 individuals with diverse patterns, 3 coaches, ~24 stakeholders, 200+ reflections, 500+ feedback entries, and 20+ coach notes.
				</p>
				<p class="mt-2 text-xs text-blue-700">
					Run from terminal: <code class="rounded bg-blue-100 px-1.5 py-0.5 font-mono">npm run seed:comprehensive</code>
				</p>
			</div>

			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
				<h3 class="font-semibold text-amber-900">Seed Basic Test Data</h3>
				<p class="mt-1 text-xs text-amber-800">
					Creates 1 individual with 12 weeks of data and 3 stakeholders (the original seed).
				</p>
				<p class="mt-2 text-xs text-amber-700">
					Run from terminal: <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono">npm run seed:test-data</code>
				</p>
			</div>

			{#if data.seedCount.users > 0}
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<h3 class="font-semibold text-red-900">Clean Seed Data</h3>
					<p class="mt-1 text-xs text-red-800">
						Removes all {data.seedCount.users} seed users and their related data. This cannot be undone.
					</p>
					<form method="post" action="?/clean" class="mt-3">
						<button
							type="submit"
							class="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
							onclick={(e) => {
								if (!confirm('Delete all seed data? This cannot be undone.')) {
									e.preventDefault();
								}
							}}
						>
							Clean All Seed Data
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</section>
