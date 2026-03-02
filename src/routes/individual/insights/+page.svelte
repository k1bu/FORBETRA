<script lang="ts">
	import type { PageData } from './$types';
	import CorrelationView from '$lib/components/CorrelationView.svelte';
	import GapLensView from '$lib/components/GapLensView.svelte';
	import { FileText, TrendingUp, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';

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

	const getScoreColor = (
		score: number | null | undefined,
		type: 'effort' | 'performance' = 'effort'
	) => getScoreColorNullable(score, type);

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

	function getSectionColor(title: string): string {
		const t = title.toLowerCase();
		if (t.includes('strengths') || t.includes('recommendations')) return 'border-l-emerald-500';
		return 'border-l-accent';
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

<svelte:head>
	<title>Insights | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header>
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<nav aria-label="Breadcrumb" class="mb-2">
			<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
				<li>
					<a
						href="/individual"
						class="rounded transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
						>Hub</a
					>
				</li>
				<li aria-hidden="true" class="text-text-muted">
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/></svg
					>
				</li>
				<li><span class="font-medium text-text-primary">Insights</span></li>
			</ol>
		</nav>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
		<h1 class="text-3xl font-bold text-text-primary">Insights</h1>
		<p class="mt-1 text-text-secondary">Track your progress and stability over time</p>
	</header>

	<!-- AI Performance Report -->
	<div class="rounded-lg border border-border-default bg-surface-raised p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<FileText class="h-4 w-4 text-text-muted" />
				<h2 class="text-lg font-bold text-text-primary">AI Performance Report</h2>
			</div>
			{#if reportDate}
				<span class="text-xs text-text-tertiary">
					{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(reportDate)}
				</span>
			{/if}
		</div>

		{#if generating}
			{#if reportSections.length > 0}
				<!-- Streaming: show sections as they arrive -->
				<div class="space-y-3">
					{#each reportSections as section (section.title)}
						<div
							class="rounded-lg border-l-4 bg-surface-subtle p-4 {getSectionColor(
								section.title
							)} animate-in fade-in"
						>
							<h3 class="mb-2 text-sm font-bold text-text-primary">{section.title}</h3>
							<div class="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
								{section.body}
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-3 flex items-center gap-2 text-xs text-accent">
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
					<span class="font-medium">Generating...</span>
				</div>
			{:else}
				<div class="animate-pulse space-y-3">
					<div class="h-4 w-3/4 rounded bg-surface-subtle"></div>
					<div class="h-4 w-full rounded bg-surface-subtle"></div>
					<div class="h-4 w-5/6 rounded bg-surface-subtle"></div>
					<div class="h-4 w-2/3 rounded bg-surface-subtle"></div>
				</div>
				<p class="mt-4 text-center text-sm font-medium text-accent">Generating insights...</p>
				<p class="mt-1 text-center text-xs text-text-tertiary">
					Sections will appear as they're generated
				</p>
			{/if}
		{:else if reportSections.length > 0}
			<div class="space-y-3">
				{#each reportSections as section (section.title)}
					<div class="rounded-lg border-l-4 bg-surface-subtle p-4 {getSectionColor(section.title)}">
						<h3 class="mb-2 text-sm font-bold text-text-primary">{section.title}</h3>
						<div class="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
							{section.body}
						</div>
					</div>
				{/each}
			</div>

			<!-- Feedback + Regenerate -->
			<div class="mt-4 flex items-center justify-between">
				<div class="flex gap-1">
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors {reportThumbs ===
						1
							? 'bg-success-muted text-success'
							: 'text-text-muted hover:bg-surface-subtle'}"
						onclick={() => submitReportFeedback(1)}
					>
						<ThumbsUp class="h-3.5 w-3.5" /> Helpful
					</button>
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors {reportThumbs ===
						-1
							? 'bg-error-muted text-error'
							: 'text-text-muted hover:bg-surface-subtle'}"
						onclick={() => submitReportFeedback(-1)}
					>
						<ThumbsDown class="h-3.5 w-3.5" /> Not helpful
					</button>
				</div>
				<button
					onclick={generateReport}
					class="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent-muted"
				>
					Regenerate Report
				</button>
			</div>
		{:else}
			<!-- Empty state -->
			<div class="py-8 text-center">
				<p class="mb-2 text-sm text-text-secondary">
					Get a comprehensive AI analysis of your full journey — progress trajectory, perception
					gaps, strengths, and actionable recommendations.
				</p>
				{#if generateError}
					<p class="mb-3 text-xs text-error">{generateError}</p>
				{/if}
				<button
					onclick={generateReport}
					class="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
				>
					Generate AI Report
				</button>
			</div>
		{/if}
	</div>

	<!-- Reflection Trend -->
	{#if data.reflectionTrend.weeks.length}
		<div class="rounded-lg border border-border-default bg-surface-raised p-6">
			<div class="mb-4 flex items-center gap-2">
				<TrendingUp class="h-4 w-4 text-text-muted" />
				<h2 class="text-lg font-bold text-text-primary">Check-in Trend (Last 4 Weeks)</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="border-b-2 border-border-default">
							<th
								class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-tertiary uppercase"
								>Week</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-tertiary uppercase"
								>Effort</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-tertiary uppercase"
								>Progress</th
							>
						</tr>
					</thead>
					<tbody>
						{#each data.reflectionTrend.weeks as week (week.weekNumber)}
							<tr class="border-b border-border-default transition-colors hover:bg-surface-subtle">
								<td class="px-4 py-3 font-bold text-text-primary">Week {week.weekNumber}</td>
								<td class="px-4 py-3">
									<span class="font-semibold {getScoreColor(week.effortScore, 'effort')}"
										>{formatAverage(week.effortScore)}</span
									>
								</td>
								<td class="px-4 py-3">
									<span class="font-semibold {getScoreColor(week.performanceScore, 'performance')}"
										>{formatAverage(week.performanceScore)}</span
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex gap-6 rounded-lg bg-surface-subtle px-4 py-3 text-sm">
				<div>
					<span class="text-text-tertiary">Effort avg:</span>
					<span class="ml-2 font-bold {getScoreColor(data.reflectionTrend.avgEffort, 'effort')}"
						>{formatAverage(data.reflectionTrend.avgEffort)}</span
					>
				</div>
				<div>
					<span class="text-text-tertiary">Progress avg:</span>
					<span
						class="ml-2 font-bold {getScoreColor(data.reflectionTrend.avgProgress, 'performance')}"
						>{formatAverage(data.reflectionTrend.avgProgress)}</span
					>
				</div>
			</div>
		</div>
	{/if}

	<!-- Weekly Insights -->
	{#if data.insights}
		<div class="rounded-lg border border-border-default bg-surface-raised p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Sparkles class="h-4 w-4 text-text-muted" />
					<h2 class="text-lg font-bold text-text-primary">Weekly Insights</h2>
				</div>
				<span class="text-[10px] text-text-muted">
					Based on {data.reflectionTrend.weeks.length} week{data.reflectionTrend.weeks.length !== 1
						? 's'
						: ''} of data
				</span>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-lg border border-border-default bg-surface-subtle p-4">
					<p class="mb-1 text-xs font-semibold tracking-wide text-text-tertiary uppercase">
						Avg. Effort (4-week)
					</p>
					<p class="text-2xl font-bold {getScoreColor(data.insights.avgEffort, 'effort')}">
						{formatAverage(data.insights.avgEffort)}
					</p>
					{#if data.insights.avgEffort !== null && data.insights.avgEffort !== undefined}
						<p class="mt-1 text-[10px] text-text-muted">
							{#if data.insights.avgEffort >= 8}Strong commitment level{:else if data.insights.avgEffort >= 6}Moderate
								effort — room to push{:else}Below average — worth exploring{/if}
						</p>
					{/if}
				</div>
				<div class="rounded-lg border border-border-default bg-surface-subtle p-4">
					<p class="mb-1 text-xs font-semibold tracking-wide text-text-tertiary uppercase">
						Avg. Progress (4-week)
					</p>
					<p class="text-2xl font-bold {getScoreColor(data.insights.avgProgress, 'performance')}">
						{formatAverage(data.insights.avgProgress)}
					</p>
					{#if data.insights.avgProgress !== null && data.insights.avgProgress !== undefined}
						<p class="mt-1 text-[10px] text-text-muted">
							{#if data.insights.avgProgress >= 8}High-performing trajectory{:else if data.insights.avgProgress >= 6}Solid
								— keep building{:else}Growing — each week counts{/if}
						</p>
					{/if}
				</div>
				<div class="rounded-lg border border-border-default bg-surface-subtle p-4">
					<p
						class="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-text-tertiary uppercase"
					>
						Stability <InfoTip
							text="Measures how consistent your scores are. Higher = more predictable patterns. 70+ is strong."
						/>
					</p>
					<p class="text-2xl font-bold {getStabilityColor(data.insights.stabilityScore)}">
						{formatScore(data.insights.stabilityScore)}
					</p>
					<p class="mt-1 text-[10px] text-text-muted">
						How consistent your scores are week to week
					</p>
				</div>
				<div class="rounded-lg border border-border-default bg-surface-subtle p-4">
					<p
						class="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-text-tertiary uppercase"
					>
						Trajectory <InfoTip
							text="Shows your score trend over the last 4 weeks. Positive = improving, negative = declining."
						/>
					</p>
					<p
						class="text-2xl font-bold {data.insights.trajectoryScore !== null &&
						data.insights.trajectoryScore !== undefined
							? data.insights.trajectoryScore > 10
								? 'text-success'
								: data.insights.trajectoryScore < -10
									? 'text-error'
									: 'text-accent'
							: 'text-text-muted'}"
					>
						{#if data.insights.trajectoryScore !== null && data.insights.trajectoryScore !== undefined}
							{#if data.insights.trajectoryScore > 10}↑{:else if data.insights.trajectoryScore < -10}↓{:else}→{/if}
							{data.insights.trajectoryScore > 0 ? '+' : ''}{data.insights.trajectoryScore}
						{:else}
							—
						{/if}
					</p>
					<p class="mt-1 text-[10px] text-text-muted">
						Direction of your scores over the last 4 weeks
					</p>
				</div>
				<div class="rounded-lg border border-border-default bg-surface-subtle p-4">
					<p class="mb-1 text-xs font-semibold tracking-wide text-text-tertiary uppercase">
						Rater Alignment
					</p>
					<p class="text-2xl font-bold text-success">
						{formatPercent(data.insights.alignmentRatio)}
					</p>
					<p class="mt-1 text-[10px] text-text-muted">% of stakeholders who responded this week</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Correlation View -->
	{#if data.correlationData && (data.correlationData.individual.length > 0 || data.correlationData.stakeholders.length > 0)}
		<div class="rounded-lg border border-border-default bg-surface-raised p-6">
			<CorrelationView
				individualData={data.correlationData.individual}
				stakeholderData={data.correlationData.stakeholders}
			/>
		</div>
	{:else}
		<div class="rounded-lg border border-dashed border-border-strong bg-surface-raised p-6">
			<h2 class="mb-2 text-lg font-bold text-text-primary">Correlation View</h2>
			<p class="text-sm text-text-secondary">
				Shows how your effort and performance relate over time. Complete 3+ check-ins to unlock this
				view.
			</p>
		</div>
	{/if}

	<!-- Gap Lens View -->
	{#if data.gapLensData && (data.gapLensData.effort.length > 0 || data.gapLensData.performance.length > 0)}
		<div class="rounded-lg border border-border-default bg-surface-raised p-6">
			<GapLensView
				effortGaps={data.gapLensData.effort}
				performanceGaps={data.gapLensData.performance}
				stakeholders={data.gapLensData.stakeholders ?? []}
			/>
		</div>
	{:else}
		<div class="rounded-lg border border-dashed border-border-strong bg-surface-raised p-6">
			<h2 class="mb-2 text-lg font-bold text-text-primary">Gap Lens</h2>
			<p class="text-sm text-text-secondary">
				Reveals differences between how you see yourself and how others see you. Add stakeholders
				and complete check-ins to unlock this view.
			</p>
		</div>
	{/if}
</section>
