<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		registerables,
		type ChartConfiguration,
		type ChartDataset,
		type TooltipItem
	} from 'chart.js';
	import { CHART_COLORS } from '$lib/utils/scoreColors';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';

	Chart.register(...registerables);

	const THEME = {
		textMuted: '#a1a1aa',
		textPrimary: '#f4f5f8',
		surfaceOverlay: '#1c1c20',
		borderSubtle: 'rgba(255,255,255,0.08)',
		gridLine: 'rgba(255, 255, 255, 0.06)'
	} as const;

	type Props = {
		individualData?: Array<{
			weekNumber: number;
			effortScore: number | null;
			performanceScore: number | null;
		}>;
		stakeholderData?: Array<{
			weekNumber: number;
			stakeholderId: string;
			stakeholderName: string;
			effortScore: number | null;
			performanceScore: number | null;
		}>;
		stakeholders?: Array<{ id: string; name: string }>;
		selfLabel?: string;
	};

	const props: Props = $props();
	const individualData = props.individualData ?? [];
	const stakeholderData = props.stakeholderData ?? [];
	const stakeholders = props.stakeholders ?? [];
	const selfLabel = props.selfLabel ?? 'My';

	let selectedStakeholderIds = new SvelteSet<string>();
	let chartCanvas = $state<HTMLCanvasElement | null>(null);
	let chartInstance = $state<Chart | null>(null);

	// Stakeholder colors for individual lines
	const STAKEHOLDER_COLORS = [
		{ border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.05)' },
		{ border: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.05)' },
		{ border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.05)' },
		{ border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.05)' },
		{ border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.05)' },
		{ border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.05)' }
	];

	const stakeholdersWithData = $derived(
		stakeholders.filter((s) => stakeholderData.some((d) => d.stakeholderId === s.id))
	);

	// Filtered stakeholder data based on pill selection
	const filteredStakeholderData = $derived(
		stakeholderData.filter((d) =>
			selectedStakeholderIds.size === 0 ? true : selectedStakeholderIds.has(d.stakeholderId)
		)
	);

	// Average stakeholder scores per week
	const stakeholderAveragesByWeek = $derived(
		(() => {
			const weekMap = new SvelteMap<number, { effort: number[]; performance: number[] }>();
			filteredStakeholderData.forEach((d) => {
				if (!weekMap.has(d.weekNumber)) weekMap.set(d.weekNumber, { effort: [], performance: [] });
				const w = weekMap.get(d.weekNumber)!;
				if (d.effortScore != null) w.effort.push(d.effortScore);
				if (d.performanceScore != null) w.performance.push(d.performanceScore);
			});
			const avg = (arr: number[]) =>
				arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;
			return Array.from(weekMap.entries())
				.map(([weekNumber, d]) => ({
					weekNumber,
					avgEffort: avg(d.effort),
					avgPerformance: avg(d.performance)
				}))
				.sort((a, b) => a.weekNumber - b.weekNumber);
		})()
	);

	// All unique weeks, padded to min 4
	const allWeeks = $derived(
		(() => {
			const weeks = new SvelteSet<number>();
			individualData.forEach((d) => weeks.add(d.weekNumber));
			stakeholderData.forEach((d) => weeks.add(d.weekNumber));
			const sorted = Array.from(weeks).sort((a, b) => a - b);
			if (sorted.length > 0 && sorted.length < 4) {
				const max = sorted[sorted.length - 1];
				for (let w = max + 1; sorted.length < 4; w++) sorted.push(w);
			}
			return sorted;
		})()
	);

	const hasLimitedData = $derived(
		(() => {
			const weeks = new SvelteSet<number>();
			individualData.forEach((d) => weeks.add(d.weekNumber));
			stakeholderData.forEach((d) => weeks.add(d.weekNumber));
			return weeks.size > 0 && weeks.size < 4;
		})()
	);

	// Baseline = Week 0 if exists, else first week
	const baseline = $derived(
		(() => {
			const baseWeek = allWeeks.find((w) => w === 0) ?? allWeeks[0];
			if (baseWeek == null)
				return { selfEffort: null, selfPerf: null, revEffort: null, revPerf: null };
			const ind = individualData.find((d) => d.weekNumber === baseWeek);
			const rev = stakeholderAveragesByWeek.find((d) => d.weekNumber === baseWeek);
			return {
				selfEffort: ind?.effortScore ?? null,
				selfPerf: ind?.performanceScore ?? null,
				revEffort: rev?.avgEffort ?? null,
				revPerf: rev?.avgPerformance ?? null
			};
		})()
	);

	// Current = latest week with data per metric
	const current = $derived(
		(() => {
			const latestWith = <T,>(arr: T[], pred: (d: T) => boolean, getWeek: (d: T) => number) => {
				const sorted = arr.filter(pred).sort((a, b) => getWeek(b) - getWeek(a));
				return sorted[0] ?? null;
			};
			const ie = latestWith(
				individualData,
				(d) => d.effortScore != null,
				(d) => d.weekNumber
			);
			const ip = latestWith(
				individualData,
				(d) => d.performanceScore != null,
				(d) => d.weekNumber
			);
			const se = latestWith(
				stakeholderAveragesByWeek,
				(d) => d.avgEffort != null,
				(d) => d.weekNumber
			);
			const sp = latestWith(
				stakeholderAveragesByWeek,
				(d) => d.avgPerformance != null,
				(d) => d.weekNumber
			);
			return {
				selfEffort: ie?.effortScore ?? null,
				selfPerf: ip?.performanceScore ?? null,
				revEffort: se?.avgEffort ?? null,
				revPerf: sp?.avgPerformance ?? null
			};
		})()
	);

	function delta(val: number | null, base: number | null): number | null {
		return val != null && base != null ? Number((val - base).toFixed(1)) : null;
	}

	const summaryCards = $derived([
		{
			label: `${selfLabel} Effort`,
			value: current.selfEffort,
			delta: delta(current.selfEffort, baseline.selfEffort),
			colorClass: 'text-cyan-400'
		},
		{
			label: `${selfLabel} Performance`,
			value: current.selfPerf,
			delta: delta(current.selfPerf, baseline.selfPerf),
			colorClass: 'text-amber-400'
		},
		{
			label: 'Reviewer Effort',
			value: current.revEffort,
			delta: delta(current.revEffort, baseline.revEffort),
			colorClass: 'text-cyan-300'
		},
		{
			label: 'Reviewer Performance',
			value: current.revPerf,
			delta: delta(current.revPerf, baseline.revPerf),
			colorClass: 'text-amber-300'
		}
	]);

	// Helper to build a dataset with shared defaults
	function ds(
		label: string,
		data: (number | null)[],
		color: string,
		bg: string,
		width: number,
		dash?: number[]
	): ChartDataset<'line'> {
		return {
			label,
			data,
			borderColor: color,
			backgroundColor: bg,
			borderWidth: width,
			tension: 0.3,
			pointRadius: 3,
			pointHoverRadius: 6,
			spanGaps: true,
			...(dash ? { borderDash: dash } : {})
		};
	}

	// Unified chart config
	const chartConfig = $derived(
		(() => {
			const labels = allWeeks.map((w) => (w === 0 ? 'Initial' : `Wk ${w}`));
			const weekData = (
				arr: Array<{
					weekNumber: number;
					effortScore: number | null;
					performanceScore: number | null;
				}>,
				key: 'effortScore' | 'performanceScore'
			) => allWeeks.map((w) => arr.find((d) => d.weekNumber === w)?.[key] ?? null);
			const avgData = (key: 'avgEffort' | 'avgPerformance') =>
				allWeeks.map(
					(w) => stakeholderAveragesByWeek.find((d) => d.weekNumber === w)?.[key] ?? null
				);

			const datasets: ChartDataset<'line'>[] = [
				ds(
					`${selfLabel} Effort`,
					weekData(individualData, 'effortScore'),
					CHART_COLORS.effort.individual.border,
					CHART_COLORS.effort.individual.bg,
					2.5
				),
				ds(
					`${selfLabel} Performance`,
					weekData(individualData, 'performanceScore'),
					CHART_COLORS.performance.individual.border,
					CHART_COLORS.performance.individual.bg,
					2.5
				)
			];

			if (stakeholderAveragesByWeek.length > 0) {
				datasets.push(
					ds(
						'Reviewer Effort (Avg)',
						avgData('avgEffort'),
						CHART_COLORS.effort.stakeholder.border,
						CHART_COLORS.effort.stakeholder.bg,
						2,
						[5, 5]
					),
					ds(
						'Reviewer Performance (Avg)',
						avgData('avgPerformance'),
						CHART_COLORS.performance.stakeholder.border,
						CHART_COLORS.performance.stakeholder.bg,
						2,
						[5, 5]
					)
				);
			}

			// Individual stakeholder lines when pills are selected
			if (selectedStakeholderIds.size > 0) {
				const selected = stakeholdersWithData.filter((s) => selectedStakeholderIds.has(s.id));
				selected.forEach((s, i) => {
					const c = STAKEHOLDER_COLORS[i % STAKEHOLDER_COLORS.length];
					const sd = stakeholderData.filter((d) => d.stakeholderId === s.id);
					datasets.push(
						{
							...ds(`${s.name} (Effort)`, weekData(sd, 'effortScore'), c.border, c.bg, 1.5),
							pointRadius: 2,
							pointHoverRadius: 4
						},
						{
							...ds(
								`${s.name} (Perf)`,
								weekData(sd, 'performanceScore'),
								c.border,
								c.bg,
								1.5,
								[3, 3]
							),
							pointRadius: 2,
							pointHoverRadius: 4
						}
					);
				});
			}

			return {
				type: 'line' as const,
				data: { labels, datasets },
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: { mode: 'index', intersect: false },
					plugins: {
						legend: { display: false },
						tooltip: {
							backgroundColor: THEME.surfaceOverlay,
							titleColor: THEME.textPrimary,
							bodyColor: THEME.textMuted,
							borderColor: THEME.borderSubtle,
							borderWidth: 1,
							padding: 12,
							titleFont: { size: 13, weight: 600 as const },
							bodyFont: { size: 12 },
							callbacks: {
								label: (ctx: TooltipItem<'line'>) => {
									const lbl = ctx.dataset.label || '';
									return ctx.parsed.y != null
										? `${lbl}: ${ctx.parsed.y.toFixed(1)}`
										: `${lbl}: No data`;
								}
							}
						}
					},
					scales: {
						y: {
							min: 0,
							max: 10,
							ticks: { color: THEME.textMuted, stepSize: 2, font: { size: 11 } },
							grid: { color: THEME.gridLine },
							title: {
								display: true,
								text: 'Score',
								color: THEME.textMuted,
								font: { size: 12, weight: 600 as const }
							}
						},
						x: {
							ticks: { color: THEME.textMuted, font: { size: 11 } },
							grid: { color: THEME.gridLine }
						}
					}
				}
			};
		})()
	);

	// Update chart reactively
	$effect(() => {
		const config = chartConfig;
		if (chartInstance && config) {
			chartInstance.data.labels = config.data.labels;
			chartInstance.data.datasets = config.data.datasets;
			chartInstance.update('none');
		}
	});

	onMount(() => {
		if (chartCanvas && chartConfig) {
			const ctx = chartCanvas.getContext('2d');
			if (ctx) chartInstance = new Chart(ctx, chartConfig as ChartConfiguration<'line'>);
		}
	});

	onDestroy(() => {
		chartInstance?.destroy();
	});

	function toggleStakeholder(id: string) {
		if (selectedStakeholderIds.has(id)) {
			selectedStakeholderIds.delete(id);
		} else {
			selectedStakeholderIds.add(id);
		}
		selectedStakeholderIds = new SvelteSet(selectedStakeholderIds);
	}
</script>

<div class="space-y-4">
	<!-- Title -->
	<div>
		<h3 class="text-lg font-bold text-text-primary">Effort & Performance Over Time</h3>
		<p class="text-sm text-text-secondary">Self-assessments vs. reviewer observations</p>
	</div>

	<!-- Chart Card -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4 sm:p-6">
		<!-- Custom Legend -->
		<div class="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
			<span class="flex items-center gap-1.5">
				<span
					class="inline-block h-0.5 w-4 rounded"
					style="background:{CHART_COLORS.effort.individual.border}"
				></span>
				{selfLabel} Effort
			</span>
			<span class="flex items-center gap-1.5">
				<span
					class="inline-block h-0.5 w-4 rounded"
					style="background:{CHART_COLORS.performance.individual.border}"
				></span>
				{selfLabel} Performance
			</span>
			<span class="flex items-center gap-1.5">
				<span
					class="inline-block h-0.5 w-4 rounded border-t-2 border-dashed"
					style="border-color:{CHART_COLORS.effort.stakeholder.border}"
				></span>
				Reviewer Effort
			</span>
			<span class="flex items-center gap-1.5">
				<span
					class="inline-block h-0.5 w-4 rounded border-t-2 border-dashed"
					style="border-color:{CHART_COLORS.performance.stakeholder.border}"
				></span>
				Reviewer Performance
			</span>
		</div>

		<!-- Canvas -->
		<div class="h-[320px] w-full sm:h-[400px]">
			{#if chartConfig.data.labels && chartConfig.data.labels.length > 0}
				<canvas bind:this={chartCanvas}></canvas>
			{:else}
				<div class="flex h-full items-center justify-center text-text-tertiary">
					<p class="text-sm">No data available yet</p>
				</div>
			{/if}
		</div>

		{#if hasLimitedData}
			<p class="mt-3 text-center text-sm text-text-tertiary">
				Trends become clearer after week 4. Keep going!
			</p>
		{/if}
	</div>

	<!-- Stakeholder Pill Filter -->
	{#if stakeholdersWithData.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs font-semibold tracking-wide text-text-tertiary uppercase"
				>Reviewers:</span
			>
			{#each stakeholdersWithData as s, i (s.id)}
				{@const active = selectedStakeholderIds.has(s.id)}
				<button
					type="button"
					onclick={() => toggleStakeholder(s.id)}
					class="rounded-full border px-3 py-1 text-xs font-medium transition-colors
						{active
						? 'border-accent bg-accent-muted text-accent'
						: 'border-border-default bg-surface-raised text-text-secondary hover:border-accent/40'}"
				>
					{#if active}
						<span
							class="mr-1 inline-block h-2 w-2 rounded-full"
							style="background:{STAKEHOLDER_COLORS[i % STAKEHOLDER_COLORS.length].border}"
						></span>
					{/if}
					{s.name}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Summary Cards (2x2) -->
	{#if current.selfEffort != null || current.selfPerf != null || current.revEffort != null || current.revPerf != null}
		<div class="grid grid-cols-2 gap-3 sm:gap-4">
			{#each summaryCards as card (card.label)}
				<div class="rounded-xl border border-border-default bg-surface-raised p-3 sm:p-4">
					<p class="text-xs font-medium text-text-tertiary">{card.label}</p>
					<div class="mt-1 flex items-baseline gap-2">
						<span class="text-2xl font-bold {card.colorClass}">
							{card.value != null ? card.value.toFixed(1) : '--'}
						</span>
						{#if card.delta != null}
							<span class="text-xs font-semibold {card.delta >= 0 ? 'text-success' : 'text-error'}">
								{card.delta > 0 ? '+' : ''}{card.delta.toFixed(1)}
								{#if card.delta > 0}
									<span class="inline-block translate-y-[-1px]">&#9650;</span>
								{:else if card.delta < 0}
									<span class="inline-block translate-y-[-1px]">&#9660;</span>
								{/if}
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
