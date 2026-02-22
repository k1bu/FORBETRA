<script lang="ts">
	import { AlertTriangle, BarChart3, Target, TrendingUp } from 'lucide-svelte';
	import type { ClientSummary } from '$lib/server/buildClientSummary';

	export let data: {
		coach: { name: string };
		clients: ClientSummary[];
		analytics: {
			totalAlerts: number;
			highPriorityAlerts: number;
			mediumPriorityAlerts: number;
			lowPriorityAlerts: number;
			avgStability: number | null;
			avgAlignment: number | null;
			overallAvgEffort: number | null;
			overallAvgProgress: number | null;
		};
		clientComparison: Array<{
			name: string;
			objective: string;
			avgEffort: number | null;
			avgProgress: number | null;
			stability: number | null;
			trajectory: number | null;
			alignment: number | null;
			completionRate: number | null;
			alertCount: number;
			currentWeek: number | null;
		}>;
		portfolioTimeSeries: Array<{
			weekNumber: number;
			avgEffort: number | null;
			avgPerformance: number | null;
			clientCount: number;
		}>;
	};

	type SortKey = 'name' | 'avgEffort' | 'avgProgress' | 'stability' | 'trajectory' | 'completionRate' | 'alertCount';
	let sortKey: SortKey = 'name';
	let sortAsc = true;

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	};

	$: sortedComparison = [...data.clientComparison].sort((a, b) => {
		const aVal = a[sortKey];
		const bVal = b[sortKey];
		if (aVal === null && bVal === null) return 0;
		if (aVal === null) return 1;
		if (bVal === null) return -1;
		const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
		return sortAsc ? cmp : -cmp;
	});

	const formatPercent = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return `${Math.round(value * 100)}%`;
	};

	const formatScore = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return `${value}/100`;
	};

	const formatAverage = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return value.toFixed(1);
	};

	const sortIndicator = (key: SortKey) => {
		if (sortKey !== key) return '';
		return sortAsc ? ' ↑' : ' ↓';
	};
</script>

<section class="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<nav aria-label="Breadcrumb" class="mb-2">
				<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
					<li><a href="/coach" class="rounded transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Coach Hub</a></li>
					<li aria-hidden="true" class="text-text-muted"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></li>
					<li><span class="font-medium text-text-primary">Analytics</span></li>
				</ol>
			</nav>
			<h1 class="text-3xl font-bold text-text-primary">Analytics Dashboard</h1>
			<p class="mt-2 text-text-secondary">Comprehensive metrics and insights across all clients</p>
		</div>
	</header>

	<!-- Overall Analytics Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<AlertTriangle class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Total Alerts</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">{data.analytics.totalAlerts}</p>
			<div class="mt-1 flex gap-2 text-xs">
				<span class="font-semibold text-error">High: {data.analytics.highPriorityAlerts}</span>
				<span class="text-warning">Med: {data.analytics.mediumPriorityAlerts}</span>
				<span class="text-text-secondary">Low: {data.analytics.lowPriorityAlerts}</span>
			</div>
		</div>
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<BarChart3 class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Stability</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">
				{formatScore(data.analytics.avgStability)}
			</p>
		</div>
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<Target class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Alignment</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">
				{formatPercent(data.analytics.avgAlignment)}
			</p>
		</div>
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<TrendingUp class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Progress</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">
				{formatAverage(data.analytics.overallAvgProgress)}/5
			</p>
			{#if data.analytics.overallAvgEffort !== null}
				<p class="mt-1 text-xs text-text-muted">Effort: {formatAverage(data.analytics.overallAvgEffort)}/5</p>
			{/if}
		</div>
	</div>

	<!-- Client Comparison Table -->
	{#if data.clientComparison.length > 0}
		<section class="rounded-lg border border-border-default bg-surface-raised p-6">
			<h2 class="mb-4 text-2xl font-bold text-text-primary">Client Comparison</h2>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-sm">
					<thead>
						<tr class="border-b border-border-default">
							<th class="cursor-pointer px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('name')}>
								Name{sortIndicator('name')}
							</th>
							<th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
								Objective
							</th>
							<th class="cursor-pointer px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('avgEffort')}>
								Effort{sortIndicator('avgEffort')}
							</th>
							<th class="cursor-pointer px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('avgProgress')}>
								Performance{sortIndicator('avgProgress')}
							</th>
							<th class="cursor-pointer px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('stability')}>
								Stability{sortIndicator('stability')}
							</th>
							<th class="cursor-pointer px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('trajectory')}>
								Trajectory{sortIndicator('trajectory')}
							</th>
							<th class="cursor-pointer px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('completionRate')}>
								Completion{sortIndicator('completionRate')}
							</th>
							<th class="cursor-pointer px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-primary" on:click={() => toggleSort('alertCount')}>
								Alerts{sortIndicator('alertCount')}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedComparison as row}
							<tr class="border-b border-border-default hover:bg-surface-subtle transition-colors">
								<td class="px-3 py-2.5 font-semibold text-text-primary">{row.name}</td>
								<td class="px-3 py-2.5 text-text-secondary max-w-[200px] truncate">{row.objective}</td>
								<td class="px-3 py-2.5 text-center font-semibold {row.avgEffort !== null && row.avgEffort >= 7 ? 'text-success' : row.avgEffort !== null && row.avgEffort < 4 ? 'text-error' : 'text-text-secondary'}">
									{formatAverage(row.avgEffort)}
								</td>
								<td class="px-3 py-2.5 text-center font-semibold {row.avgProgress !== null && row.avgProgress >= 7 ? 'text-success' : row.avgProgress !== null && row.avgProgress < 4 ? 'text-error' : 'text-text-secondary'}">
									{formatAverage(row.avgProgress)}
								</td>
								<td class="px-3 py-2.5 text-center">
									{#if row.stability !== null}
										<span class="text-xs font-semibold {row.stability >= 70 ? 'text-success' : row.stability >= 40 ? 'text-warning' : 'text-error'}">
											{row.stability}
										</span>
									{:else}
										<span class="text-text-muted">—</span>
									{/if}
								</td>
								<td class="px-3 py-2.5 text-center font-semibold {row.trajectory !== null && row.trajectory > 0 ? 'text-success' : row.trajectory !== null && row.trajectory < 0 ? 'text-error' : 'text-text-tertiary'}">
									{#if row.trajectory !== null}
										{row.trajectory > 0 ? '+' : ''}{row.trajectory}
									{:else}
										—
									{/if}
								</td>
								<td class="px-3 py-2.5 text-center text-text-secondary">
									{row.completionRate !== null ? `${row.completionRate}%` : '—'}
								</td>
								<td class="px-3 py-2.5 text-center">
									{#if row.alertCount > 0}
										<span class="text-xs font-bold text-error">{row.alertCount}</span>
									{:else}
										<span class="text-text-muted">0</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<!-- Portfolio Trends -->
	{#if data.portfolioTimeSeries.length > 0}
		<section class="rounded-lg border border-border-default bg-surface-raised p-6">
			<h2 class="mb-1 text-2xl font-bold text-text-primary">Portfolio Trends</h2>
			<p class="mb-4 text-xs text-text-tertiary">Weekly averages across all active clients</p>
			<div class="overflow-x-auto">
				<div class="flex items-end gap-1" style="min-width: {data.portfolioTimeSeries.length * 60}px; height: 200px;">
					{#each data.portfolioTimeSeries as week}
						{@const maxScore = 10}
						{@const effortHeight = week.avgEffort !== null ? (week.avgEffort / maxScore) * 160 : 0}
						{@const perfHeight = week.avgPerformance !== null ? (week.avgPerformance / maxScore) * 160 : 0}
						<div class="flex flex-col items-center gap-1 flex-1 min-w-[50px]">
							<div class="flex items-end gap-0.5" style="height: 160px;">
								<div
									class="w-5 rounded-t bg-amber-400 transition-all"
									style="height: {effortHeight}px;"
									title="Effort: {week.avgEffort ?? '—'}"
								></div>
								<div
									class="w-5 rounded-t bg-indigo-500 transition-all"
									style="height: {perfHeight}px;"
									title="Performance: {week.avgPerformance ?? '—'}"
								></div>
							</div>
							<span class="text-[10px] text-text-tertiary">Wk {week.weekNumber}</span>
							<span class="text-[9px] text-text-muted">{week.clientCount}c</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-sm bg-amber-400"></div>
					<span>Avg Effort</span>
				</div>
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-sm bg-indigo-500"></div>
					<span>Avg Performance</span>
				</div>
			</div>
		</section>
	{/if}

	<!-- Client Analytics Breakdown -->
	<section class="space-y-6 rounded-lg border border-border-default bg-surface-raised p-6">
		<h2 class="text-2xl font-bold text-text-primary">Client Performance Overview</h2>

		{#if data.clients.length === 0}
			<div class="rounded-xl border border-dashed border-border-strong bg-surface-raised p-8 text-center">
				<p class="text-sm text-text-tertiary">No clients yet. Invite clients to see analytics.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.clients as client (client.id)}
					<div
						class="rounded-xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30"
					>
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h3 class="text-lg font-bold text-text-primary">{client.name}</h3>
								<p class="text-sm text-text-secondary">{client.email}</p>
							</div>
							{#if client.alerts.length > 0}
								<div class="flex items-center gap-1.5">
									<span class="h-2 w-2 rounded-full {client.alerts.some((a) => a.severity === 'high') ? 'bg-error' : client.alerts.some((a) => a.severity === 'medium') ? 'bg-warning' : 'bg-accent'}"></span>
									<span class="text-xs font-semibold {client.alerts.some((a) => a.severity === 'high') ? 'text-error' : client.alerts.some((a) => a.severity === 'medium') ? 'text-warning' : 'text-accent'}">
										{client.alerts.length} alert{client.alerts.length === 1 ? '' : 's'}
									</span>
								</div>
							{/if}
						</div>

						{#if client.objective?.insights}
							<div class="grid gap-4 md:grid-cols-4">
								<div class="rounded-lg border border-border-default bg-surface-raised p-4">
									<p class="mb-1 text-xs text-text-tertiary">Stability</p>
									<p class="text-2xl font-bold text-accent">
										{formatScore(client.objective.insights.stabilityScore)}
									</p>
								</div>
								<div class="rounded-lg border border-border-default bg-surface-raised p-4">
									<p class="mb-1 text-xs text-text-tertiary">Alignment</p>
									<p class="text-2xl font-bold text-accent">
										{formatPercent(client.objective.insights.alignmentRatio)}
									</p>
								</div>
								<div class="rounded-lg border border-border-default bg-surface-raised p-4">
									<p class="mb-1 text-xs text-text-tertiary">Avg Effort</p>
									<p class="text-2xl font-bold text-success">
										{formatAverage(client.objective.insights.avgEffort)}/5
									</p>
								</div>
								<div class="rounded-lg border border-border-default bg-surface-raised p-4">
									<p class="mb-1 text-xs text-text-tertiary">Avg Progress</p>
									<p class="text-2xl font-bold text-teal-600">
										{formatAverage(client.objective.insights.avgProgress)}/5
									</p>
								</div>
							</div>
						{:else}
							<p class="text-sm text-text-tertiary">No active objective or cycle data available.</p>
						{/if}

						{#if client.alerts.length > 0}
							<div class="mt-4 rounded-lg border border-border-default bg-surface-raised p-4">
								<p class="mb-2 text-xs font-bold uppercase text-text-tertiary">Alerts</p>
								<ul class="space-y-1 text-xs text-text-secondary">
									{#each client.alerts as alert (alert.type)}
										<li class="flex items-start gap-2">
											<span
												class="mt-0.5 h-2 w-2 rounded-full {alert.severity === 'high'
													? 'bg-red-600'
													: alert.severity === 'medium'
													? 'bg-amber-500'
													: 'bg-blue-500'}"
											></span>
											<span>{alert.message}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>
</section>
