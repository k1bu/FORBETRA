<script lang="ts">
	import type { PageData } from './$types';

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
		<h1 class="text-2xl font-bold text-neutral-900">AI Insights</h1>
		<p class="text-sm text-neutral-600">All AI-generated insights across the platform</p>
	</header>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
		<div class="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
			<p class="text-xs font-semibold text-indigo-600">Total</p>
			<p class="text-xl font-bold text-indigo-700">{data.stats.totalInsights}</p>
		</div>
		<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
			<p class="text-xs font-semibold text-emerald-600">Success Rate</p>
			<p class="text-xl font-bold text-emerald-700">{data.stats.successRate}%</p>
		</div>
		<div class="rounded-xl border border-green-200 bg-green-50 p-3">
			<p class="text-xs font-semibold text-green-600">Thumbs Up</p>
			<p class="text-xl font-bold text-green-700">{data.stats.thumbsUp}</p>
		</div>
		<div class="rounded-xl border border-red-200 bg-red-50 p-3">
			<p class="text-xs font-semibold text-red-600">Thumbs Down</p>
			<p class="text-xl font-bold text-red-700">{data.stats.thumbsDown}</p>
		</div>
		{#each Object.entries(data.stats.typeBreakdown) as [type, count] (type)}
			<div class="rounded-xl border border-neutral-200 bg-white p-3">
				<p class="text-xs font-semibold text-neutral-500">{type}</p>
				<p class="text-xl font-bold text-neutral-700">{count}</p>
			</div>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<select class="rounded-lg border border-neutral-300 px-3 py-2 text-sm" bind:value={typeFilter}>
			<option value="ALL">All Types</option>
			<option value="CHECK_IN">CHECK_IN</option>
			<option value="WEEKLY_SYNTHESIS">WEEKLY_SYNTHESIS</option>
			<option value="COACH_PREP">COACH_PREP</option>
			<option value="COACH_ALERT">COACH_ALERT</option>
		</select>
		<select class="rounded-lg border border-neutral-300 px-3 py-2 text-sm" bind:value={statusFilter}>
			<option value="ALL">All Statuses</option>
			<option value="PENDING">PENDING</option>
			<option value="GENERATING">GENERATING</option>
			<option value="COMPLETED">COMPLETED</option>
			<option value="FAILED">FAILED</option>
		</select>
		<span class="text-xs text-neutral-500">{filtered.length} shown</span>
	</div>

	<!-- Insights Table -->
	<div class="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
		<table class="min-w-full divide-y divide-neutral-200 text-sm">
			<thead class="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
			<tbody class="divide-y divide-neutral-200">
				{#each filtered as insight (insight.id)}
					<tr class="hover:bg-neutral-50">
						<td class="px-4 py-3">
							<a href="/admin/users/{insight.user.id}" class="font-medium text-blue-600 hover:underline">
								{insight.user.name ?? insight.user.email}
							</a>
						</td>
						<td class="px-4 py-3">
							<span class="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{insight.type}</span>
						</td>
						<td class="px-4 py-3">
							<span class="rounded px-2 py-0.5 text-xs font-semibold {
								insight.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
								insight.status === 'FAILED' ? 'bg-red-100 text-red-700' :
								insight.status === 'GENERATING' ? 'bg-amber-100 text-amber-700' :
								'bg-neutral-100 text-neutral-600'
							}">
								{insight.status}
							</span>
						</td>
						<td class="px-4 py-3">{insight.weekNumber ?? '--'}</td>
						<td class="px-4 py-3">
							{#if insight.thumbs === 1}
								<span class="text-emerald-600">&#128077;</span>
							{:else if insight.thumbs === -1}
								<span class="text-red-600">&#128078;</span>
							{:else}
								<span class="text-neutral-300">--</span>
							{/if}
						</td>
						<td class="max-w-xs px-4 py-3 text-neutral-600">
							<span title={insight.content ?? ''}>{truncate(insight.content, 80)}</span>
						</td>
						<td class="px-4 py-3 text-neutral-500">{formatDate(insight.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if filtered.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
			No insights found. Run <code class="rounded bg-neutral-200 px-1.5 py-0.5">npm run insights:backfill</code> to generate insights for existing data.
		</div>
	{/if}
</section>
