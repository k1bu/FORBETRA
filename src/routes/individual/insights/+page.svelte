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

	import { getScoreColorNullable, getStabilityColor } from '$lib/utils/scoreColors';
	import { addToast } from '$lib/stores/toasts.svelte';

	const getScoreColor = (score: number | null | undefined, type: 'effort' | 'performance' = 'effort') =>
		getScoreColorNullable(score, type);

	// AI Performance Report state
	let generating = $state(false);
	let freshReport = $state<{ id: string; content: string; createdAt: string } | null>(null);
	let generateError = $state<string | null>(null);
	let reportThumbs = $state<number | null>(data.cycleReport?.thumbs ?? null);

	const reportContent = $derived(freshReport?.content ?? data.cycleReport?.content ?? null);
	const reportId = $derived(freshReport?.id ?? data.cycleReport?.id ?? null);
	const reportDate = $derived(
		freshReport?.createdAt
			? new Date(freshReport.createdAt)
			: data.cycleReport?.createdAt
				? new Date(data.cycleReport.createdAt)
				: null
	);

	async function generateReport() {
		generating = true;
		generateError = null;
		freshReport = { id: '', content: '', createdAt: new Date().toISOString() };
		try {
			const res = await fetch('/api/insights/cycle-report', {
				method: 'POST',
				headers: { Accept: 'text/event-stream' }
			});

			if (!res.ok) {
				const err = await res.json();
				generateError = err.error ?? 'Something went wrong';
				freshReport = null;
				return;
			}

			const reader = res.body?.getReader();
			if (!reader) {
				generateError = 'Streaming not supported';
				freshReport = null;
				return;
			}

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					if (line.startsWith('event: meta')) {
						// Next data line contains the insight ID
						continue;
					}
					if (line.startsWith('event: done')) {
						continue;
					}
					if (line.startsWith('event: error')) {
						continue;
					}
					if (line.startsWith('data: ')) {
						const payload = line.slice(6);
						try {
							const parsed = JSON.parse(payload);
							if (typeof parsed === 'string') {
								// Text chunk
								freshReport = {
									id: freshReport?.id ?? '',
									content: (freshReport?.content ?? '') + parsed,
									createdAt: freshReport?.createdAt ?? new Date().toISOString()
								};
							} else if (parsed.id && typeof parsed.id === 'string') {
								// Meta event with insight ID
								freshReport = {
									id: parsed.id,
									content: freshReport?.content ?? '',
									createdAt: freshReport?.createdAt ?? new Date().toISOString()
								};
							}
						} catch {
							// Ignore malformed JSON
						}
					}
				}
			}

			reportThumbs = null;
			addToast('Report generated', 'success');
		} catch {
			generateError = 'Network error. Please try again.';
			if (!freshReport?.content) {
				freshReport = null;
			}
		} finally {
			generating = false;
		}
	}

	function parseReportSections(content: string): Array<{ title: string; body: string }> {
		const sections: Array<{ title: string; body: string }> = [];
		const parts = content.split(/^## /m);
		for (const part of parts) {
			const trimmed = part.trim();
			if (!trimmed) continue;
			const newlineIndex = trimmed.indexOf('\n');
			if (newlineIndex === -1) {
				sections.push({ title: trimmed, body: '' });
			} else {
				sections.push({
					title: trimmed.slice(0, newlineIndex).trim(),
					body: trimmed.slice(newlineIndex + 1).trim()
				});
			}
		}
		return sections;
	}

	const reportSections = $derived(reportContent ? parseReportSections(reportContent) : []);

	const sectionColors: Record<string, string> = {
		'Executive Summary': 'border-l-purple-500',
		'Progress Trajectory': 'border-l-blue-500',
		'Perception Analysis': 'border-l-teal-500',
		'Key Strengths': 'border-l-emerald-500',
		'Growth Opportunities': 'border-l-amber-500',
		'Recommendations': 'border-l-indigo-500'
	};

	function getSectionColor(title: string): string {
		for (const [key, color] of Object.entries(sectionColors)) {
			if (title.toLowerCase().includes(key.toLowerCase())) return color;
		}
		return 'border-l-neutral-300';
	}

	async function submitReportFeedback(thumbs: number) {
		if (!reportId) return;
		reportThumbs = thumbs;
		await fetch(`/api/insights/${reportId}/feedback`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ thumbs })
		});
	}
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Insights</h1>
			<p class="mt-1 text-neutral-600">Track your progress and stability over time</p>
		</div>
		<a
			href="/individual"
			class="rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
		>
			← Back to Hub
		</a>
	</header>

	<!-- AI Performance Report -->
	<div class="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-xl" role="img" aria-label="clipboard">&#128203;</span>
				<h2 class="text-lg font-bold text-neutral-900">AI Performance Report</h2>
			</div>
			{#if reportDate}
				<span class="text-xs text-neutral-500">
					{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(reportDate)}
				</span>
			{/if}
		</div>

		{#if generating}
			{#if reportSections.length > 0}
				<!-- Streaming: show sections as they arrive -->
				<div class="space-y-3">
					{#each reportSections as section}
						<div class="rounded-lg border-l-4 bg-white/80 p-4 {getSectionColor(section.title)} animate-in fade-in">
							<h3 class="mb-2 text-sm font-bold text-neutral-900">{section.title}</h3>
							<div class="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{section.body}</div>
						</div>
					{/each}
				</div>
				<div class="mt-3 flex items-center gap-2 text-xs text-purple-600">
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					<span class="font-medium">Generating...</span>
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-12">
					<svg class="mb-3 h-8 w-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					<p class="text-sm font-medium text-purple-700">Analyzing your full cycle data...</p>
					<p class="mt-1 text-xs text-neutral-500">Sections will appear as they're generated</p>
				</div>
			{/if}
		{:else if reportSections.length > 0}
			<div class="space-y-3">
				{#each reportSections as section}
					<div class="rounded-lg border-l-4 bg-white/80 p-4 {getSectionColor(section.title)}">
						<h3 class="mb-2 text-sm font-bold text-neutral-900">{section.title}</h3>
						<div class="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{section.body}</div>
					</div>
				{/each}
			</div>

			<!-- Feedback + Regenerate -->
			<div class="mt-4 flex items-center justify-between">
				<div class="flex gap-1">
					<button
						class="rounded px-2 py-1 text-xs transition-colors {reportThumbs === 1 ? 'bg-emerald-100 text-emerald-700' : 'text-neutral-400 hover:bg-neutral-100'}"
						onclick={() => submitReportFeedback(1)}
					>
						&#128077; Helpful
					</button>
					<button
						class="rounded px-2 py-1 text-xs transition-colors {reportThumbs === -1 ? 'bg-red-100 text-red-700' : 'text-neutral-400 hover:bg-neutral-100'}"
						onclick={() => submitReportFeedback(-1)}
					>
						&#128078; Not helpful
					</button>
				</div>
				<button
					onclick={generateReport}
					class="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 transition-all hover:bg-purple-50"
				>
					Regenerate Report
				</button>
			</div>
		{:else}
			<!-- Empty state -->
			<div class="py-8 text-center">
				<p class="mb-2 text-sm text-neutral-600">
					Get a comprehensive AI analysis of your full cycle — progress trajectory, perception gaps, strengths, and actionable recommendations.
				</p>
				{#if generateError}
					<p class="mb-3 text-xs text-red-600">{generateError}</p>
				{/if}
				<button
					onclick={generateReport}
					class="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
				>
					Generate AI Report
				</button>
			</div>
		{/if}
	</div>

	<!-- Reflection Trend -->
	{#if data.reflectionTrend.weeks.length}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center gap-2">
				<span class="text-xl" role="img" aria-label="chart trending up">📈</span>
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
									<span class="font-semibold {getScoreColor(week.effortScore, 'effort')}">{formatAverage(week.effortScore)}</span>
								</td>
								<td class="px-4 py-3">
									<span class="font-semibold {getScoreColor(week.performanceScore, 'performance')}">{formatAverage(week.performanceScore)}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex gap-6 rounded-lg bg-neutral-50 px-4 py-3 text-sm">
				<div>
					<span class="text-neutral-500">Effort avg:</span>
					<span class="ml-2 font-bold {getScoreColor(data.reflectionTrend.avgEffort, 'effort')}">{formatAverage(data.reflectionTrend.avgEffort)}</span>
				</div>
				<div>
					<span class="text-neutral-500">Progress avg:</span>
					<span class="ml-2 font-bold {getScoreColor(data.reflectionTrend.avgProgress, 'performance')}">{formatAverage(data.reflectionTrend.avgProgress)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Weekly Insights -->
	{#if data.insights}
		<div class="rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm">
			<div class="mb-4 flex items-center gap-2">
				<span class="text-xl" role="img" aria-label="sparkles">✨</span>
				<h2 class="text-lg font-bold text-neutral-900">Weekly Insights</h2>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Effort (4-week)</p>
					<p class="text-2xl font-bold {getScoreColor(data.insights.avgEffort, 'effort')}">{formatAverage(data.insights.avgEffort)}</p>
				</div>
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Progress (4-week)</p>
					<p class="text-2xl font-bold {getScoreColor(data.insights.avgProgress, 'performance')}">{formatAverage(data.insights.avgProgress)}</p>
				</div>
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Stability</p>
					<p class="text-2xl font-bold {getStabilityColor(data.insights.stabilityScore)}">{formatScore(data.insights.stabilityScore)}</p>
				</div>
				<div class="rounded-xl border border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Trajectory</p>
					<p class="text-2xl font-bold {data.insights.trajectoryScore !== null && data.insights.trajectoryScore !== undefined ? (data.insights.trajectoryScore > 10 ? 'text-emerald-600' : data.insights.trajectoryScore < -10 ? 'text-red-600' : 'text-blue-600') : 'text-neutral-400'}">
						{#if data.insights.trajectoryScore !== null && data.insights.trajectoryScore !== undefined}
							{#if data.insights.trajectoryScore > 10}↑{:else if data.insights.trajectoryScore < -10}↓{:else}→{/if}
							{data.insights.trajectoryScore > 0 ? '+' : ''}{data.insights.trajectoryScore}
						{:else}
							—
						{/if}
					</p>
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

