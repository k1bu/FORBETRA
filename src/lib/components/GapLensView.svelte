<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { CHART_COLORS } from '$lib/utils/scoreColors';

	Chart.register(...registerables);

	interface Props {
		effortGaps: Array<{ weekNumber: number; difference: number }>;
		performanceGaps: Array<{ weekNumber: number; difference: number }>;
		stakeholders?: Array<{
			id: string;
			name: string;
			effortGaps: Array<{ weekNumber: number; difference: number }>;
			performanceGaps: Array<{ weekNumber: number; difference: number }>;
		}>;
	}

	const { effortGaps, performanceGaps, stakeholders = [] }: Props = $props();

	let effortChartCanvas = $state<HTMLCanvasElement | null>(null);
	let performanceChartCanvas = $state<HTMLCanvasElement | null>(null);
	let effortChartInstance = $state<Chart | null>(null);
	let performanceChartInstance = $state<Chart | null>(null);
	let showEffort = $state(true);
	let showPerformance = $state(true);
	let selectedStakeholderId = $state<string | null>(null); // null = "All Stakeholders"
	let isMounted = $state(false);

	// Get active gaps based on selected stakeholder
	const activeEffortGaps = $derived((() => {
		if (selectedStakeholderId === null) {
			return effortGaps;
		}
		const stakeholder = stakeholders.find((s) => s.id === selectedStakeholderId);
		return stakeholder?.effortGaps ?? [];
	})());

	const activePerformanceGaps = $derived((() => {
		if (selectedStakeholderId === null) {
			return performanceGaps;
		}
		const stakeholder = stakeholders.find((s) => s.id === selectedStakeholderId);
		return stakeholder?.performanceGaps ?? [];
	})());

	// Get all unique week numbers
	const allWeeks = $derived((() => {
		const weeks = new Set<number>();
		activeEffortGaps.forEach((g) => weeks.add(g.weekNumber));
		activePerformanceGaps.forEach((g) => weeks.add(g.weekNumber));
		return Array.from(weeks).sort((a, b) => a - b);
	})());

	// Get selected stakeholder name
	const selectedStakeholderName = $derived((() => {
		if (selectedStakeholderId === null) return 'All Stakeholders';
		return stakeholders.find((s) => s.id === selectedStakeholderId)?.name ?? 'Unknown';
	})());

	const effortChartConfig = $derived((() => {
		if (!showEffort) return null;

		const labels = allWeeks.map((w) => `Week ${w}`);
		const data = allWeeks.map((week) => {
			const gap = activeEffortGaps.find((g) => g.weekNumber === week);
			return gap?.difference ?? null;
		});

		return {
			type: 'line' as const,
			data: {
				labels,
				datasets: [
					{
						label:
							selectedStakeholderId === null
								? 'Effort Gap (Self - Stakeholders)'
								: `Effort Gap (Self - ${selectedStakeholderName})`,
						data,
						borderColor: CHART_COLORS.effort.individual.border,
						backgroundColor: CHART_COLORS.effort.individual.bg,
						borderWidth: 3,
						borderDash: [],
						tension: 0.3,
						pointRadius: 5,
						pointHoverRadius: 7,
						spanGaps: true,
						fill: 'zero' as const
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index' as const,
					intersect: false
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						padding: 12,
						titleFont: {
							size: 14,
							weight: 600
						},
						bodyFont: {
							size: 13
						},
						callbacks: {
							label: function (context: any) {
								const value = context.parsed.y;
								if (value === null) return 'No data';
								const sign = value > 0 ? '+' : '';
								const interpretation =
									value > 0
										? ' (You see higher)'
										: value < 0
											? ' (Stakeholders see higher)'
											: ' (Aligned)';
								return `Gap: ${sign}${value.toFixed(1)}${interpretation}`;
							}
						}
					}
				},
				scales: {
					y: {
						type: 'linear' as const,
						position: 'left' as const,
						title: {
							display: true,
							text: 'Difference (Self - Stakeholders)',
							font: {
								size: 12,
								weight: 600
							}
						},
						min: -5,
						max: 5,
						ticks: {
							stepSize: 1,
							font: {
								size: 11
							},
							callback: function (value: any) {
								const num = Number(value);
								if (num === 0) return '0 (Aligned)';
								const sign = num > 0 ? '+' : '';
								return `${sign}${num}`;
							}
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						}
					},
					x: {
						title: {
							display: true,
							text: 'Week',
							font: {
								size: 12,
								weight: 600
							}
						},
						ticks: {
							font: {
								size: 11
							}
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						}
					}
				}
			}
		};
	})());

	const performanceChartConfig = $derived((() => {
		if (!showPerformance) return null;

		const labels = allWeeks.map((w) => `Week ${w}`);
		const data = allWeeks.map((week) => {
			const gap = activePerformanceGaps.find((g) => g.weekNumber === week);
			return gap?.difference ?? null;
		});

		return {
			type: 'line' as const,
			data: {
				labels,
				datasets: [
					{
						label:
							selectedStakeholderId === null
								? 'Performance Gap (Self - Stakeholders)'
								: `Performance Gap (Self - ${selectedStakeholderName})`,
						data,
						borderColor: CHART_COLORS.performance.individual.border,
						backgroundColor: CHART_COLORS.performance.individual.bg,
						borderWidth: 3,
						borderDash: [],
						tension: 0.3,
						pointRadius: 5,
						pointHoverRadius: 7,
						spanGaps: true,
						fill: 'zero' as const
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index' as const,
					intersect: false
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						padding: 12,
						titleFont: {
							size: 14,
							weight: 600
						},
						bodyFont: {
							size: 13
						},
						callbacks: {
							label: function (context: any) {
								const value = context.parsed.y;
								if (value === null) return 'No data';
								const sign = value > 0 ? '+' : '';
								const interpretation =
									value > 0
										? ' (You see higher)'
										: value < 0
											? ' (Stakeholders see higher)'
											: ' (Aligned)';
								return `Gap: ${sign}${value.toFixed(1)}${interpretation}`;
							}
						}
					}
				},
				scales: {
					y: {
						type: 'linear' as const,
						position: 'left' as const,
						title: {
							display: true,
							text: 'Difference (Self - Stakeholders)',
							font: {
								size: 12,
								weight: 600
							}
						},
						min: -5,
						max: 5,
						ticks: {
							stepSize: 1,
							font: {
								size: 11
							},
							callback: function (value: any) {
								const num = Number(value);
								if (num === 0) return '0 (Aligned)';
								const sign = num > 0 ? '+' : '';
								return `${sign}${num}`;
							}
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						}
					},
					x: {
						title: {
							display: true,
							text: 'Week',
							font: {
								size: 12,
								weight: 600
							}
						},
						ticks: {
							font: {
								size: 11
							}
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						}
					}
				}
			}
		};
	})());

	onMount(() => {
		isMounted = true;
	});

	// Initialize charts when canvas elements are ready
	$effect(() => {
		if (!isMounted) return;
		
		// Initialize effort chart
		if (showEffort && !effortChartInstance && effortChartCanvas && effortChartConfig) {
			const ctx = effortChartCanvas.getContext('2d');
			if (ctx) {
				effortChartInstance = new Chart(ctx, effortChartConfig);
			}
		}

		// Initialize performance chart
		if (showPerformance && !performanceChartInstance && performanceChartCanvas && performanceChartConfig) {
			const ctx = performanceChartCanvas.getContext('2d');
			if (ctx) {
				performanceChartInstance = new Chart(ctx, performanceChartConfig);
			}
		}
	});

	// Update effort chart when data changes - only after mount
	$effect(() => {
		if (!isMounted) return;
		
		// Access reactive dependencies to track them
		const effortGapsData = activeEffortGaps;
		const showEff = showEffort;
		const selectedStk = selectedStakeholderId;
		
		const config = effortChartConfig;
		const instance = effortChartInstance;
		
		if (instance && config && showEff) {
			instance.data.labels = config.data.labels;
			instance.data.datasets = config.data.datasets;
			instance.update('none');
		}
	});

	// Update performance chart when data changes - only after mount
	$effect(() => {
		if (!isMounted) return;
		
		// Access reactive dependencies to track them
		const perfGapsData = activePerformanceGaps;
		const showPerf = showPerformance;
		const selectedStk = selectedStakeholderId;
		
		const config = performanceChartConfig;
		const instance = performanceChartInstance;
		
		if (instance && config && showPerf) {
			instance.data.labels = config.data.labels;
			instance.data.datasets = config.data.datasets;
			instance.update('none');
		}
	});

	// Handle showing/hiding charts
	$effect(() => {
		if (!showEffort && effortChartInstance) {
			effortChartInstance.destroy();
			effortChartInstance = null;
		} else if (showEffort && !effortChartInstance && effortChartCanvas && effortChartConfig) {
			const ctx = effortChartCanvas.getContext('2d');
			if (ctx) {
				effortChartInstance = new Chart(ctx, effortChartConfig);
			}
		}

		if (!showPerformance && performanceChartInstance) {
			performanceChartInstance.destroy();
			performanceChartInstance = null;
		} else if (showPerformance && !performanceChartInstance && performanceChartCanvas && performanceChartConfig) {
			const ctx = performanceChartCanvas.getContext('2d');
			if (ctx) {
				performanceChartInstance = new Chart(ctx, performanceChartConfig);
			}
		}
	});

	onDestroy(() => {
		if (effortChartInstance) {
			effortChartInstance.destroy();
		}
		if (performanceChartInstance) {
			performanceChartInstance.destroy();
		}
	});

	// Calculate current gap values (latest week with data)
	const currentEffortGap = $derived((() => {
		if (activeEffortGaps.length === 0) return null;
		const sorted = [...activeEffortGaps].sort((a, b) => b.weekNumber - a.weekNumber);
		return sorted[0]?.difference ?? null;
	})());

	const currentPerformanceGap = $derived((() => {
		if (activePerformanceGaps.length === 0) return null;
		const sorted = [...activePerformanceGaps].sort((a, b) => b.weekNumber - a.weekNumber);
		return sorted[0]?.difference ?? null;
	})());
</script>

<div class="space-y-4">
	<div>
		<h2 class="text-xl font-bold text-neutral-900">Gap Lens</h2>
		<p class="mt-1 text-sm text-neutral-600">
			See the difference between your self-assessment and stakeholder observations. Positive values mean you see yourself higher; negative means stakeholders see you higher. Reveals blind spots.
		</p>
	</div>

	<!-- Controls -->
	<div class="space-y-4">
		<div class="flex flex-wrap items-center gap-4 rounded-xl border-2 border-neutral-200 bg-white p-4">
			<span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Show:</span>
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						bind:checked={showEffort}
						class="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm font-semibold text-neutral-700">Effort Gap</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						bind:checked={showPerformance}
						class="h-4 w-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
					/>
					<span class="text-sm font-semibold text-neutral-700">Performance Gap</span>
				</label>
			</div>
		</div>

		{#if stakeholders.length > 0}
			<div class="flex flex-wrap items-center gap-4 rounded-xl border-2 border-neutral-200 bg-white p-4">
				<span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Filter Stakeholder:</span>
				<div class="flex flex-wrap items-center gap-2">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="radio"
							name="stakeholder-filter"
							checked={selectedStakeholderId === null}
							onchange={() => (selectedStakeholderId = null)}
							class="h-4 w-4 border-neutral-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm font-medium text-neutral-700">All Stakeholders</span>
					</label>
					{#each stakeholders as stakeholder (stakeholder.id)}
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="stakeholder-filter"
								checked={selectedStakeholderId === stakeholder.id}
								onchange={() => (selectedStakeholderId = stakeholder.id)}
								class="h-4 w-4 border-neutral-300 text-blue-600 focus:ring-blue-500"
							/>
							<span class="text-sm font-medium text-neutral-700">{stakeholder.name}</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Current Gap Indicators -->
	{#if currentEffortGap !== null || currentPerformanceGap !== null}
		<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
			<div class="flex gap-6">
				{#if currentEffortGap !== null}
					<div class="flex-1">
						<div class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Current Effort Gap</div>
						<div class="mt-1 flex items-baseline gap-2">
							<span class="text-2xl font-bold text-neutral-900">
								{currentEffortGap > 0 ? '+' : ''}{currentEffortGap.toFixed(1)}
							</span>
							<span class="text-sm font-medium text-neutral-600">
								{currentEffortGap > 0
									? '(You see higher)'
									: currentEffortGap < 0
										? '(Stakeholders see higher)'
										: '(Aligned)'}
							</span>
						</div>
					</div>
				{/if}
				{#if currentPerformanceGap !== null}
					<div class="flex-1 {currentEffortGap !== null ? 'border-l border-neutral-300 pl-6' : ''}">
						<div class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Current Performance Gap</div>
						<div class="mt-1 flex items-baseline gap-2">
							<span class="text-2xl font-bold text-neutral-900">
								{currentPerformanceGap > 0 ? '+' : ''}{currentPerformanceGap.toFixed(1)}
							</span>
							<span class="text-sm font-medium text-neutral-600">
								{currentPerformanceGap > 0
									? '(You see higher)'
									: currentPerformanceGap < 0
										? '(Stakeholders see higher)'
										: '(Aligned)'}
							</span>
						</div>
					</div>
				{/if}
			</div>
			<div class="mt-3 border-t border-neutral-200 pt-3">
				<p class="text-xs text-neutral-600">
					<strong>What this means:</strong> Gap shows the difference between your self-assessment and stakeholder observations.
					Positive values mean you rate yourself higher than stakeholders see you. Negative values mean stakeholders see you higher than you see yourself.
					Values closer to zero indicate better alignment. Large gaps reveal potential blind spots in self-awareness.
				</p>
			</div>
		</div>
	{/if}

	<!-- Custom Legend/Key -->
	<div class="rounded-lg border border-neutral-200 bg-white p-4">
		<div class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Gap Lines</div>
		<div class="flex flex-wrap gap-6">
			{#if showEffort}
				<div class="flex items-center gap-2">
					<div class="h-1 w-8 rounded-full bg-amber-600"></div>
					<span class="text-sm font-medium text-neutral-700">
						Effort Gap {selectedStakeholderId === null ? '(Self - Stakeholders)' : `(Self - ${selectedStakeholderName})`}
					</span>
				</div>
			{/if}
			{#if showPerformance}
				<div class="flex items-center gap-2">
					<div class="h-1 w-8 rounded-full bg-indigo-600"></div>
					<span class="text-sm font-medium text-neutral-700">
						Performance Gap {selectedStakeholderId === null ? '(Self - Stakeholders)' : `(Self - ${selectedStakeholderName})`}
					</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Charts -->
	<div class="grid gap-6 md:grid-cols-2">
		{#if showEffort}
			<div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-neutral-900">Effort Gap</h3>
				<div class="h-[350px] w-full">
					{#if activeEffortGaps.length >= 2}
						<canvas bind:this={effortChartCanvas}></canvas>
					{:else if activeEffortGaps.length === 1}
						<div class="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
							<p class="text-sm font-medium">Gap analysis requires stakeholder feedback from at least 2 weeks.</p>
							<p class="text-xs">You have 1 week so far. Keep going!</p>
						</div>
					{:else}
						<div class="flex h-full items-center justify-center text-neutral-500">
							<p class="text-sm">Not enough data to display effort gap.</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if showPerformance}
			<div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-neutral-900">Performance Gap</h3>
				<div class="h-[350px] w-full">
					{#if activePerformanceGaps.length >= 2}
						<canvas bind:this={performanceChartCanvas}></canvas>
					{:else if activePerformanceGaps.length === 1}
						<div class="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
							<p class="text-sm font-medium">Gap analysis requires stakeholder feedback from at least 2 weeks.</p>
							<p class="text-xs">You have 1 week so far. Keep going!</p>
						</div>
					{:else}
						<div class="flex h-full items-center justify-center text-neutral-500">
							<p class="text-sm">Not enough data to display performance gap.</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if (!showEffort && !showPerformance) || (activeEffortGaps.length === 0 && activePerformanceGaps.length === 0)}
		<div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
			<div class="flex h-[200px] items-center justify-center text-neutral-500">
				<p>Select at least one metric to view the gap analysis, or complete more check-ins and stakeholder feedback to see data.</p>
			</div>
		</div>
	{/if}
</div>

