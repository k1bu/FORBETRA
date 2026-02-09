<script lang="ts">
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
	};

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
</script>

<section class="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<a
				href="/coach"
				class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
			>
				← Back to Hub
			</a>
			<h1 class="text-3xl font-bold text-neutral-900">Analytics Dashboard</h1>
			<p class="mt-2 text-neutral-600">Comprehensive metrics and insights across all clients</p>
		</div>
	</header>

	<!-- Overall Analytics Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="warning">⚠️</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Alerts</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">{data.analytics.totalAlerts}</p>
			<div class="mt-2 flex gap-2 text-xs">
				<span class="text-red-700 font-semibold">High: {data.analytics.highPriorityAlerts}</span>
				<span class="text-amber-700">Med: {data.analytics.mediumPriorityAlerts}</span>
				<span class="text-blue-700">Low: {data.analytics.lowPriorityAlerts}</span>
			</div>
		</div>
		<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="bar chart">📊</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Stability</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">
				{formatScore(data.analytics.avgStability)}
			</p>
			{#if data.analytics.avgStability !== null && data.analytics.avgStability >= 75}
				<p class="mt-2 text-xs text-emerald-600">Excellent! ✨</p>
			{/if}
		</div>
		<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="target">🎯</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Alignment</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">
				{formatPercent(data.analytics.avgAlignment)}
			</p>
			{#if data.analytics.avgAlignment !== null && data.analytics.avgAlignment >= 80}
				<p class="mt-2 text-xs text-emerald-600">Strong alignment! 🎉</p>
			{/if}
		</div>
		<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="chart trending up">📈</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Progress</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">
				{formatAverage(data.analytics.overallAvgProgress)}/5
			</p>
			{#if data.analytics.overallAvgEffort !== null}
				<p class="mt-2 text-xs text-neutral-600">Effort: {formatAverage(data.analytics.overallAvgEffort)}/5</p>
			{/if}
		</div>
	</div>

	<!-- Client Analytics Breakdown -->
	<section class="space-y-6 rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-bold text-neutral-900">Client Performance Overview</h2>

		{#if data.clients.length === 0}
			<div class="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
				<p class="text-sm text-neutral-500">No clients yet. Invite clients to see analytics.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.clients as client (client.id)}
					<div
						class="rounded-xl border-2 border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6 transition-all hover:border-blue-300 hover:shadow-md"
					>
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h3 class="text-lg font-bold text-neutral-900">{client.name}</h3>
								<p class="text-sm text-neutral-600">{client.email}</p>
							</div>
							{#if client.alerts.length > 0}
								<span
									class="rounded-full px-3 py-1 text-xs font-bold uppercase {client.alerts.some(
										(a) => a.severity === 'high'
									)
										? 'bg-red-100 text-red-700'
										: client.alerts.some((a) => a.severity === 'medium')
										? 'bg-amber-100 text-amber-700'
										: 'bg-blue-100 text-blue-700'}"
								>
									{client.alerts.length} alert{client.alerts.length === 1 ? '' : 's'}
								</span>
							{/if}
						</div>

						{#if client.objective?.insights}
							<div class="grid gap-4 md:grid-cols-4">
								<div class="rounded-lg border border-neutral-200 bg-white p-4">
									<p class="mb-1 text-xs text-neutral-500">Stability</p>
									<p class="text-2xl font-bold text-blue-600">
										{formatScore(client.objective.insights.stabilityScore)}
									</p>
								</div>
								<div class="rounded-lg border border-neutral-200 bg-white p-4">
									<p class="mb-1 text-xs text-neutral-500">Alignment</p>
									<p class="text-2xl font-bold text-purple-600">
										{formatPercent(client.objective.insights.alignmentRatio)}
									</p>
								</div>
								<div class="rounded-lg border border-neutral-200 bg-white p-4">
									<p class="mb-1 text-xs text-neutral-500">Avg Effort</p>
									<p class="text-2xl font-bold text-emerald-600">
										{formatAverage(client.objective.insights.avgEffort)}/5
									</p>
								</div>
								<div class="rounded-lg border border-neutral-200 bg-white p-4">
									<p class="mb-1 text-xs text-neutral-500">Avg Progress</p>
									<p class="text-2xl font-bold text-teal-600">
										{formatAverage(client.objective.insights.avgProgress)}/5
									</p>
								</div>
							</div>
						{:else}
							<p class="text-sm text-neutral-500">No active objective or cycle data available.</p>
						{/if}

						{#if client.alerts.length > 0}
							<div class="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-4">
								<p class="mb-2 text-xs font-bold uppercase text-red-900">Alerts</p>
								<ul class="space-y-1 text-xs text-red-800">
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

