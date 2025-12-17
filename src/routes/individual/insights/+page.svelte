<script lang="ts">
	import type { PageData } from './$types';
	import CorrelationView from '$lib/components/CorrelationView.svelte';
	import GapLensView from '$lib/components/GapLensView.svelte';

	const { data }: { data: PageData } = $props();

	const formatAverage = (value: number | null | undefined) => {
		if (value === null || value === undefined) {
			return '—';
		}
		return value.toFixed(1);
	};

	const formatPercent = (value: number | null | undefined) => {
		if (value === null || value === undefined) {
			return '—';
		}
		return `${Math.round(value * 100)}%`;
	};

	const formatScore = (value: number | null | undefined) => {
		if (value === null || value === undefined) {
			return '—';
		}
		return `${value}/100`;
	};

	const getScoreColor = (score: number | null | undefined) => {
		if (score === null || score === undefined) return 'text-neutral-400';
		if (score < 3) return 'text-amber-600';
		if (score < 6) return 'text-blue-600';
		if (score < 8) return 'text-emerald-600';
		return 'text-purple-600';
	};

	const getConsistencyColor = (score: number | null | undefined) => {
		if (score === null || score === undefined) return 'text-neutral-400';
		if (score < 50) return 'text-amber-600';
		if (score < 75) return 'text-blue-600';
		return 'text-emerald-600';
	};
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Insights</h1>
			<p class="mt-1 text-neutral-600">Track your progress and consistency over time</p>
		</div>
		<a
			href="/individual"
			class="rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
		>
			← Back to Hub
		</a>
	</header>

	<!-- Reflection Trend -->
	{#if data.reflectionTrend.weeks.length}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center gap-2">
				<span class="text-xl">📈</span>
				<h2 class="text-lg font-bold text-neutral-900">Reflection Trend (Last 4 Weeks)</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="border-b-2 border-neutral-200">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Week</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Intention</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Effort</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Progress</th>
						</tr>
					</thead>
					<tbody>
						{#each data.reflectionTrend.weeks as week (week.weekNumber)}
							<tr class="border-b border-neutral-100 transition-colors hover:bg-neutral-50">
								<td class="px-4 py-3 font-bold text-neutral-900">Week {week.weekNumber}</td>
								<td class="px-4 py-3">
									{#if week.intentionSubmitted}
										<span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
											<span>✓</span>
											Submitted
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
											Missing
										</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span class="font-semibold {getScoreColor(week.effortScore)}">{formatAverage(week.effortScore)}</span>
								</td>
								<td class="px-4 py-3">
									<span class="font-semibold {getScoreColor(week.performanceScore)}">{formatAverage(week.performanceScore)}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex gap-6 rounded-lg bg-neutral-50 px-4 py-3 text-sm">
				<div>
					<span class="text-neutral-500">Effort avg:</span>
					<span class="ml-2 font-bold {getScoreColor(data.reflectionTrend.avgEffort)}">{formatAverage(data.reflectionTrend.avgEffort)}</span>
				</div>
				<div>
					<span class="text-neutral-500">Progress avg:</span>
					<span class="ml-2 font-bold {getScoreColor(data.reflectionTrend.avgProgress)}">{formatAverage(data.reflectionTrend.avgProgress)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Weekly Insights -->
	{#if data.insights}
		<div class="rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm">
			<div class="mb-4 flex items-center gap-2">
				<span class="text-xl">✨</span>
				<h2 class="text-lg font-bold text-neutral-900">Weekly Insights</h2>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Effort (4-week)</p>
					<p class="text-2xl font-bold {getScoreColor(data.insights.avgEffort)}">{formatAverage(data.insights.avgEffort)}</p>
				</div>
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Progress (4-week)</p>
					<p class="text-2xl font-bold {getScoreColor(data.insights.avgProgress)}">{formatAverage(data.insights.avgProgress)}</p>
				</div>
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Consistency</p>
					<p class="text-2xl font-bold {getConsistencyColor(data.insights.consistencyScore)}">{formatScore(data.insights.consistencyScore)}</p>
				</div>
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Stakeholder Alignment</p>
					<p class="text-2xl font-bold text-emerald-600">{formatPercent(data.insights.alignmentRatio)}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Correlation View -->
	{#if data.correlationData && (data.correlationData.individual.length > 0 || data.correlationData.stakeholders.length > 0)}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<CorrelationView
				individualData={data.correlationData.individual}
				stakeholderData={data.correlationData.stakeholders}
			/>
		</div>
	{/if}

	<!-- Gap Lens View -->
	{#if data.gapLensData && (data.gapLensData.effort.length > 0 || data.gapLensData.performance.length > 0)}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<GapLensView
				effortGaps={data.gapLensData.effort}
				performanceGaps={data.gapLensData.performance}
				stakeholders={data.gapLensData.stakeholders ?? []}
			/>
		</div>
	{/if}
</section>

