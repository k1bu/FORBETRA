<script lang="ts">
	import type { PageData } from './$types';
	import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const { data }: { data: PageData } = $props();

	function goToWeek(week: number) {
		const url = new URL($page.url);
		if (week === data.currentWeek) {
			url.searchParams.delete('week');
		} else {
			url.searchParams.set('week', String(week));
		}
		goto(url.toString(), { replaceState: true });
	}

	// Color helpers
	function effortBg(score: number): string {
		if (score >= 8) return 'bg-cyan-700/40 text-cyan-200';
		if (score >= 6) return 'bg-cyan-800/30 text-cyan-300';
		if (score >= 4) return 'bg-cyan-800/25 text-cyan-300';
		if (score >= 1) return 'bg-cyan-900/20 text-cyan-400';
		return 'bg-surface-raised text-text-muted';
	}

	function perfBg(score: number): string {
		if (score >= 8) return 'bg-amber-700/40 text-amber-200';
		if (score >= 6) return 'bg-amber-800/30 text-amber-300';
		if (score >= 4) return 'bg-amber-800/25 text-amber-300';
		if (score >= 1) return 'bg-amber-900/20 text-amber-400';
		return 'bg-surface-raised text-text-muted';
	}
</script>

<svelte:head>
	<title>Scorecard | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-12">
	<!-- Header + week navigator -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-lg font-bold text-text-primary">Scorecard</h1>
			<p class="text-xs text-text-muted">{data.objectiveTitle}</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={() => goToWeek(data.viewWeek - 1)}
				disabled={data.viewWeek <= 1}
				class="rounded-lg p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<span class="min-w-[5rem] text-center text-sm font-semibold {data.viewWeek === data.currentWeek ? 'text-accent' : 'text-text-secondary'}">
				Week {data.viewWeek}{#if data.viewWeek === data.currentWeek} <span class="text-xs font-normal text-text-muted">(now)</span>{/if}
			</span>
			<button
				onclick={() => goToWeek(data.viewWeek + 1)}
				disabled={data.viewWeek >= data.totalWeeks}
				class="rounded-lg p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
			>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- Self summary row -->
	<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-surface-raised px-4 py-3 border border-border-default">
		<span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Your Scores</span>
		{#if data.myEffort !== null}
			<div class="flex items-center gap-1.5">
				<span class="text-[10px] text-text-muted">Effort</span>
				<div class="flex h-7 w-7 items-center justify-center rounded text-xs font-bold {effortBg(data.myEffort)}">{data.myEffort}</div>
			</div>
		{/if}
		{#if data.myPerformance !== null}
			<div class="flex items-center gap-1.5">
				<span class="text-[10px] text-text-muted">Performance</span>
				<div class="flex h-7 w-7 items-center justify-center rounded text-xs font-bold {perfBg(data.myPerformance)}">{data.myPerformance}</div>
			</div>
		{/if}
		{#if data.myEffort === null && data.myPerformance === null}
			<span class="text-xs text-text-muted">No self-ratings for this week</span>
		{/if}
	</div>

	<!-- Stakeholder gap cards -->
	{#if data.scorecard.length > 0}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each data.scorecard as row}
				<div class="rounded-lg border p-4 {row.maxAbsGap > 2 ? 'border-error/30' : row.maxAbsGap > 1 ? 'border-warning/30' : 'border-border-default'} bg-surface-raised">
					<!-- Stakeholder name + trend -->
					<div class="mb-3 flex items-center justify-between">
						<p class="text-sm font-semibold text-text-primary">{row.stakeholderName}</p>
						{#if row.effortGapTrend || row.performanceGapTrend}
							{#if row.effortGapTrend === 'closing' || row.performanceGapTrend === 'closing'}
								<span class="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Gap closing</span>
							{:else if row.effortGapTrend === 'widening' || row.performanceGapTrend === 'widening'}
								<span class="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-semibold text-error">Gap widening</span>
							{:else}
								<span class="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold text-text-muted">Gap stable</span>
							{/if}
						{/if}
					</div>

					<!-- Gap visualization: Effort -->
					<div class="mb-2">
						<p class="mb-1 text-[10px] font-medium text-text-tertiary">Effort</p>
						<div class="flex items-center gap-1">
							{#if data.myEffort !== null}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold {effortBg(data.myEffort)}">{data.myEffort}</div>
							{:else}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
							{/if}
							{#if row.effortGap !== null}
								<div class="flex flex-1 items-center gap-1">
									<div class="h-px flex-1 {Math.abs(row.effortGap) <= 1 ? 'bg-success/40' : Math.abs(row.effortGap) <= 2 ? 'bg-warning/40' : 'bg-error/40'}"></div>
									<span class="text-[10px] font-bold {Math.abs(row.effortGap) <= 1 ? 'text-success' : Math.abs(row.effortGap) <= 2 ? 'text-warning' : 'text-error'}">
										{row.effortGap > 0 ? '+' : ''}{row.effortGap}
									</span>
									<div class="h-px flex-1 {Math.abs(row.effortGap) <= 1 ? 'bg-success/40' : Math.abs(row.effortGap) <= 2 ? 'bg-warning/40' : 'bg-error/40'}"></div>
								</div>
							{:else}
								<div class="flex flex-1 items-center"><div class="h-px flex-1 bg-border-default"></div></div>
							{/if}
							{#if row.stakeholderEffort !== null}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold {effortBg(row.stakeholderEffort)}">{row.stakeholderEffort}</div>
							{:else}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
							{/if}
						</div>
					</div>

					<!-- Gap visualization: Performance -->
					<div>
						<p class="mb-1 text-[10px] font-medium text-text-tertiary">Performance</p>
						<div class="flex items-center gap-1">
							{#if data.myPerformance !== null}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold {perfBg(data.myPerformance)}">{data.myPerformance}</div>
							{:else}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
							{/if}
							{#if row.performanceGap !== null}
								<div class="flex flex-1 items-center gap-1">
									<div class="h-px flex-1 {Math.abs(row.performanceGap) <= 1 ? 'bg-success/40' : Math.abs(row.performanceGap) <= 2 ? 'bg-warning/40' : 'bg-error/40'}"></div>
									<span class="text-[10px] font-bold {Math.abs(row.performanceGap) <= 1 ? 'text-success' : Math.abs(row.performanceGap) <= 2 ? 'text-warning' : 'text-error'}">
										{row.performanceGap > 0 ? '+' : ''}{row.performanceGap}
									</span>
									<div class="h-px flex-1 {Math.abs(row.performanceGap) <= 1 ? 'bg-success/40' : Math.abs(row.performanceGap) <= 2 ? 'bg-warning/40' : 'bg-error/40'}"></div>
								</div>
							{:else}
								<div class="flex flex-1 items-center"><div class="h-px flex-1 bg-border-default"></div></div>
							{/if}
							{#if row.stakeholderPerformance !== null}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold {perfBg(row.stakeholderPerformance)}">{row.stakeholderPerformance}</div>
							{:else}
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-subtle text-[10px] text-text-muted">--</div>
							{/if}
						</div>
					</div>

					<!-- Stakeholder comment -->
					{#if row.comment}
						<div class="mt-3 border-t border-border-default pt-3">
							<div class="flex items-start gap-2">
								<MessageSquare class="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
								<p class="text-xs text-text-secondary italic">"{row.comment}"</p>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-border-default bg-surface-raised p-8 text-center">
			<p class="text-sm text-text-muted">No stakeholder data yet for this week.</p>
			<p class="mt-1 text-xs text-text-tertiary">Once your stakeholders submit feedback, their scores will appear here.</p>
		</div>
	{/if}

	<!-- Self notes -->
	{#if data.selfNotes.length > 0}
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Your Notes This Week</p>
			<div class="flex flex-col gap-2">
				{#each data.selfNotes as note}
					<p class="text-sm text-text-secondary">{note}</p>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Legend -->
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-muted">
		<span>You <span class="font-bold">[ score ]</span>——gap——<span class="font-bold">[ score ]</span> Stakeholder</span>
		<span class="text-success">Green = aligned (&le;1)</span>
		<span class="text-warning">Amber = moderate (1-2)</span>
		<span class="text-error">Red = large (&gt;2)</span>
	</div>
</section>
