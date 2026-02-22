<script lang="ts">
	import type { PageData } from './$types';
	import { ThumbsUp, ThumbsDown } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	let typeFilter = $state('ALL');
	let statusFilter = $state('ALL');

	const filtered = $derived(
		data.insights.filter((i) => {
			if (typeFilter !== 'ALL' && i.type !== typeFilter) return false;
			if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
			return true;
		})
	);

	const formatDate = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
	};

	const truncate = (text: string | null, len: number) => {
		if (!text) return '--';
		return text.length > len ? text.slice(0, len) + '...' : text;
	};
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">AI Insights</h1>
		<p class="text-sm text-text-secondary">All AI-generated insights across the platform</p>
	</header>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
		<div class="rounded-xl border border-border-default bg-accent-muted p-3">
			<p class="text-xs font-semibold text-accent">Total</p>
			<p class="text-xl font-bold text-accent">{data.stats.totalInsights}</p>
		</div>
		<div class="rounded-xl border border-border-default bg-success-muted p-3">
			<p class="text-xs font-semibold text-success">Success Rate</p>
			<p class="text-xl font-bold text-success">{data.stats.successRate}%</p>
		</div>
		<div class="rounded-xl border border-border-default bg-success-muted p-3">
			<p class="text-xs font-semibold text-success">Thumbs Up</p>
			<p class="text-xl font-bold text-success">{data.stats.thumbsUp}</p>
		</div>
		<div class="rounded-xl border border-border-default bg-error-muted p-3">
			<p class="text-xs font-semibold text-error">Thumbs Down</p>
			<p class="text-xl font-bold text-error">{data.stats.thumbsDown}</p>
		</div>
		{#each Object.entries(data.stats.typeBreakdown) as [type, count] (type)}
			<div class="rounded-xl border border-border-default bg-surface-raised p-3">
				<p class="text-xs font-semibold text-text-tertiary">{type}</p>
				<p class="text-xl font-bold text-text-secondary">{count}</p>
			</div>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<select class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary" bind:value={typeFilter}>
			<option value="ALL">All Types</option>
			<option value="CHECK_IN">CHECK_IN</option>
			<option value="WEEKLY_SYNTHESIS">WEEKLY_SYNTHESIS</option>
			<option value="COACH_PREP">COACH_PREP</option>
			<option value="COACH_ALERT">COACH_ALERT</option>
		</select>
		<select class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary" bind:value={statusFilter}>
			<option value="ALL">All Statuses</option>
			<option value="PENDING">PENDING</option>
			<option value="GENERATING">GENERATING</option>
			<option value="COMPLETED">COMPLETED</option>
			<option value="FAILED">FAILED</option>
		</select>
		<span class="text-xs text-text-tertiary">{filtered.length} shown</span>
	</div>

	<!-- Insights Table -->
	<div class="overflow-hidden rounded-lg border border-border-default bg-surface-raised">
		<table class="min-w-full divide-y divide-border-default text-sm">
			<thead class="bg-surface-subtle text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
				<tr>
					<th class="px-4 py-3">User</th>
					<th class="px-4 py-3">Type</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3">Week</th>
					<th class="px-4 py-3">Thumbs</th>
					<th class="px-4 py-3">Content Preview</th>
					<th class="px-4 py-3">Date</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border-default">
				{#each filtered as insight (insight.id)}
					<tr class="hover:bg-surface-subtle">
						<td class="px-4 py-3">
							<a href="/admin/users/{insight.user.id}" class="font-medium text-accent hover:underline">
								{insight.user.name ?? insight.user.email}
							</a>
						</td>
						<td class="px-4 py-3">
							<span class="rounded bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent">{insight.type}</span>
						</td>
						<td class="px-4 py-3">
							<span class="rounded px-2 py-0.5 text-xs font-semibold {
								insight.status === 'COMPLETED' ? 'bg-success-muted text-success' :
								insight.status === 'FAILED' ? 'bg-error-muted text-error' :
								insight.status === 'GENERATING' ? 'bg-warning-muted text-warning' :
								'bg-surface-subtle text-text-secondary'
							}">
								{insight.status}
							</span>
						</td>
						<td class="px-4 py-3">{insight.weekNumber ?? '--'}</td>
						<td class="px-4 py-3">
							{#if insight.thumbs === 1}
								<ThumbsUp class="h-4 w-4 text-success" />
							{:else if insight.thumbs === -1}
								<ThumbsDown class="h-4 w-4 text-error" />
							{:else}
								<span class="text-text-muted">--</span>
							{/if}
						</td>
						<td class="max-w-xs px-4 py-3 text-text-secondary">
							<span title={insight.content ?? ''}>{truncate(insight.content, 80)}</span>
						</td>
						<td class="px-4 py-3 text-text-tertiary">{formatDate(insight.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if filtered.length === 0}
		<div class="rounded-xl border border-dashed border-border-strong bg-surface-raised p-8 text-center text-sm text-text-tertiary">
			No insights found. Run <code class="rounded bg-surface-subtle px-1.5 py-0.5">npm run insights:backfill</code> to generate insights for existing data.
		</div>
	{/if}
</section>
