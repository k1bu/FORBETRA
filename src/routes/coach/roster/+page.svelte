<script lang="ts">
	import type { PageData } from './$types';
	import { Search, AlertTriangle, ChevronRight } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	const formatRelativeDays = (value: string | null | undefined) => {
		if (!value) return '—';
		const created = new Date(value);
		const diff = Date.now() - created.getTime();
		const days = Math.floor(diff / (24 * 60 * 60 * 1000));
		if (days <= 0) return 'Today';
		if (days === 1) return '1 day ago';
		if (days < 14) return `${days} days ago`;
		const weeks = Math.floor(days / 7);
		if (weeks < 8) return `${weeks} wk${weeks === 1 ? '' : 's'} ago`;
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(created);
	};

	const activeCount = $derived(data.clients.filter((c) => !c.archived).length);
	const archivedCount = $derived(data.clients.filter((c) => c.archived).length);

	let searchTerm = $state('');
	let showArchived = $state(false);
	type SortOption = 'name' | 'alerts' | 'recent';
	let sortBy = $state<SortOption>('alerts');

	const filteredClients = $derived(
		(() => {
			let clients = data.clients.filter((client) => {
				if (!showArchived && client.archived) return false;
				if (!searchTerm) return true;
				const query = searchTerm.toLowerCase();
				return (
					(client.name ?? '').toLowerCase().includes(query) ||
					client.email.toLowerCase().includes(query)
				);
			});
			clients = [...clients].sort((a, b) => {
				if (sortBy === 'alerts') {
					return (b.alerts?.length ?? 0) - (a.alerts?.length ?? 0);
				} else if (sortBy === 'recent') {
					return new Date(b.joinedAt ?? 0).getTime() - new Date(a.joinedAt ?? 0).getTime();
				}
				return (a.name ?? '').localeCompare(b.name ?? '');
			});
			return clients;
		})()
	);
</script>

<svelte:head>
	<title>Clients | Forbetra</title>
</svelte:head>

<section class="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-text-primary">Clients</h1>
		<p class="mt-1 text-sm text-text-muted">
			{activeCount} active{#if archivedCount > 0}, {archivedCount} archived{/if}
		</p>
	</div>

	<!-- Search and controls -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative flex-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
			<input
				type="text"
				placeholder="Search clients..."
				class="w-full rounded-lg border border-border-default bg-surface-raised py-2 pr-4 pl-10 text-sm text-text-primary transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
				bind:value={searchTerm}
			/>
		</div>
		<select
			class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
			bind:value={sortBy}
		>
			<option value="alerts">Sort by alerts</option>
			<option value="name">Sort by name</option>
			<option value="recent">Sort by recent</option>
		</select>
		{#if archivedCount > 0}
			<label class="flex items-center gap-2 text-sm text-text-secondary">
				<input
					type="checkbox"
					bind:checked={showArchived}
					class="rounded border-border-default text-accent focus:ring-accent"
				/>
				Show archived
			</label>
		{/if}
	</div>

	<!-- Client list -->
	{#if filteredClients.length === 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-8 text-center">
			<p class="text-text-secondary">
				{searchTerm ? 'No clients match your search.' : 'No clients yet.'}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			{#each filteredClients as client (client.id)}
				<a
					href="/coach/session/{client.id}"
					class="group flex items-center justify-between rounded-xl border border-border-default bg-surface-raised p-4 transition-all hover:border-accent/30 {client.archived
						? 'opacity-60'
						: ''}"
				>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<p class="font-medium text-text-primary">{client.name ?? client.email}</p>
							{#if client.alerts && client.alerts.length > 0}
								<span
									class="flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
								>
									<AlertTriangle class="h-3 w-3" />
									{client.alerts.length}
								</span>
							{/if}
							{#if client.archived}
								<span class="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-text-muted"
									>Archived</span
								>
							{/if}
						</div>
						{#if client.objective?.title}
							<p class="mt-0.5 text-sm text-text-muted">{client.objective.title}</p>
						{/if}
						<div class="mt-1 flex items-center gap-2">
							{#if client.objective?.cycle?.currentWeek}
								<span class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
									Week {client.objective.cycle.currentWeek}
								</span>
							{/if}
							{#if client.objective?.insights?.avgEffort !== null && client.objective?.insights?.avgEffort !== undefined}
								<span class="text-xs text-text-muted tabular-nums"
									>Effort: {client.objective.insights.avgEffort}</span
								>
							{/if}
							{#if client.objective?.insights?.avgProgress !== null && client.objective?.insights?.avgProgress !== undefined}
								<span class="text-xs text-text-muted tabular-nums"
									>Perf: {client.objective.insights.avgProgress}</span
								>
							{/if}
							{#if !client.objective?.cycle?.currentWeek && !client.objective?.insights}
								<span class="text-xs text-text-tertiary"
									>Joined {formatRelativeDays(client.joinedAt)}</span
								>
							{/if}
						</div>
					</div>
					<ChevronRight
						class="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
					/>
				</a>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{/if}
</section>
