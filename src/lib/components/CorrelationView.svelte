<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	interface Props {
		individualData: Array<{ effort: number; progress: number; weekNumber: number }>;
		stakeholderData: Array<{ effort: number; progress: number; weekNumber: number; stakeholderName: string }>;
	}

	const { individualData, stakeholderData }: Props = $props();

	let chartCanvas = $state<HTMLCanvasElement | null>(null);
	let chartInstance = $state<Chart | null>(null);
	let showStakeholders = $state(true);
	let showIndividualStakeholders = $state(false);
	let isMounted = $state(false);

	// Calculate Pearson correlation coefficient
	function calculateCorrelation(
		effortValues: number[],
		performanceValues: number[]
	): number | null {
		if (effortValues.length !== performanceValues.length || effortValues.length < 2) {
			return null;
		}

		const n = effortValues.length;
		const sumX = effortValues.reduce((sum, val) => sum + val, 0);
		const sumY = performanceValues.reduce((sum, val) => sum + val, 0);
		const sumXY = effortValues.reduce((sum, val, i) => sum + val * performanceValues[i], 0);
		const sumX2 = effortValues.reduce((sum, val) => sum + val * val, 0);
		const sumY2 = performanceValues.reduce((sum, val) => sum + val * val, 0);

		const numerator = n * sumXY - sumX * sumY;
		const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

		if (denominator === 0) return null;

		return numerator / denominator;
	}

	// Calculate linear regression line for correlation visualization
	function calculateRegressionLine(
		effortValues: number[],
		performanceValues: number[]
	): Array<{ x: number; y: number }> | null {
		if (effortValues.length !== performanceValues.length || effortValues.length < 2) {
			return null;
		}

		const n = effortValues.length;
		const sumX = effortValues.reduce((sum, val) => sum + val, 0);
		const sumY = performanceValues.reduce((sum, val) => sum + val, 0);
		const sumXY = effortValues.reduce((sum, val, i) => sum + val * performanceValues[i], 0);
		const sumX2 = effortValues.reduce((sum, val) => sum + val * val, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
		const intercept = (sumY - slope * sumX) / n;

		const minX = Math.min(...effortValues);
		const maxX = Math.max(...effortValues);

		return [
			{ x: minX, y: slope * minX + intercept },
			{ x: maxX, y: slope * maxX + intercept }
		];
	}

	// Prepare data organized by week
	const weeklyData = $derived((() => {
		const weeksMap = new Map<number, {
			weekNumber: number;
			individualEffort: number | null;
			individualPerformance: number | null;
			stakeholderEfforts: number[];
			stakeholderPerformances: number[];
		}>();

		// Add individual data
		individualData.forEach((d) => {
			if (!weeksMap.has(d.weekNumber)) {
				weeksMap.set(d.weekNumber, {
					weekNumber: d.weekNumber,
					individualEffort: null,
					individualPerformance: null,
					stakeholderEfforts: [],
					stakeholderPerformances: []
				});
			}
			const week = weeksMap.get(d.weekNumber)!;
			week.individualEffort = d.effort;
			week.individualPerformance = d.progress;
		});

		// Add stakeholder data
		stakeholderData.forEach((d) => {
			if (!weeksMap.has(d.weekNumber)) {
				weeksMap.set(d.weekNumber, {
					weekNumber: d.weekNumber,
					individualEffort: null,
					individualPerformance: null,
					stakeholderEfforts: [],
					stakeholderPerformances: []
				});
			}
			const week = weeksMap.get(d.weekNumber)!;
			week.stakeholderEfforts.push(d.effort);
			week.stakeholderPerformances.push(d.progress);
		});

		return Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
	})());

	// Calculate correlation coefficients
	const individualCorrelation = $derived((() => {
		const effortValues: number[] = [];
		const performanceValues: number[] = [];

		individualData
			.sort((a, b) => a.weekNumber - b.weekNumber)
			.forEach((d) => {
				effortValues.push(d.effort);
				performanceValues.push(d.progress);
			});

		return calculateCorrelation(effortValues, performanceValues);
	})());

	const stakeholderCorrelation = $derived((() => {
		if (!showStakeholders || stakeholderData.length === 0) return null;

		const effortValues: number[] = [];
		const performanceValues: number[] = [];

		// Calculate average for each week
		const weekAverages = new Map<number, { effort: number[]; performance: number[] }>();
		stakeholderData.forEach((d) => {
			if (!weekAverages.has(d.weekNumber)) {
				weekAverages.set(d.weekNumber, { effort: [], performance: [] });
			}
			const week = weekAverages.get(d.weekNumber)!;
			week.effort.push(d.effort);
			week.performance.push(d.progress);
		});

		Array.from(weekAverages.entries())
			.sort((a, b) => a[0] - b[0])
			.forEach(([_, data]) => {
				const avgEffort = data.effort.reduce((sum, val) => sum + val, 0) / data.effort.length;
				const avgPerformance = data.performance.reduce((sum, val) => sum + val, 0) / data.performance.length;
				effortValues.push(avgEffort);
				performanceValues.push(avgPerformance);
			});

		return calculateCorrelation(effortValues, performanceValues);
	})());

	// Calculate correlation lines (must be before chartConfig)
	const individualCorrelationLine = $derived((() => {
		const effortValues: number[] = [];
		const performanceValues: number[] = [];

		individualData
			.sort((a, b) => a.weekNumber - b.weekNumber)
			.forEach((d) => {
				effortValues.push(d.effort);
				performanceValues.push(d.progress);
			});

		return calculateRegressionLine(effortValues, performanceValues);
	})());

	const stakeholderCorrelationLine = $derived((() => {
		if (!showStakeholders || stakeholderData.length === 0) return null;

		const effortValues: number[] = [];
		const performanceValues: number[] = [];

		// Calculate average for each week
		const weekAverages = new Map<number, { effort: number[]; performance: number[] }>();
		stakeholderData.forEach((d) => {
			if (!weekAverages.has(d.weekNumber)) {
				weekAverages.set(d.weekNumber, { effort: [], performance: [] });
			}
			const week = weekAverages.get(d.weekNumber)!;
			week.effort.push(d.effort);
			week.performance.push(d.progress);
		});

		Array.from(weekAverages.entries())
			.sort((a, b) => a[0] - b[0])
			.forEach(([_, data]) => {
				const avgEffort = data.effort.reduce((sum, val) => sum + val, 0) / data.effort.length;
				const avgPerformance = data.performance.reduce((sum, val) => sum + val, 0) / data.performance.length;
				effortValues.push(avgEffort);
				performanceValues.push(avgPerformance);
			});

		return calculateRegressionLine(effortValues, performanceValues);
	})());

	const chartConfig = $derived((() => {
		const allWeeks = weeklyData.map((w) => w.weekNumber);
		const labels = allWeeks.map((w) => `Week ${w}`);
		const datasets: any[] = [];

		// Individual effort line (more transparent/dotted)
		datasets.push({
			label: 'My Effort',
			data: allWeeks.map((week) => {
				const weekData = weeklyData.find((w) => w.weekNumber === week);
				return weekData?.individualEffort ?? null;
			}),
			borderColor: 'rgba(59, 130, 246, 0.5)',
			backgroundColor: 'rgba(59, 130, 246, 0.05)',
			borderWidth: 2,
			borderDash: [5, 5],
			tension: 0.3,
			pointRadius: 4,
			pointHoverRadius: 6,
			spanGaps: true,
			yAxisID: 'y'
		});

		// Individual performance line (more transparent/dotted)
		datasets.push({
			label: 'My Performance',
			data: allWeeks.map((week) => {
				const weekData = weeklyData.find((w) => w.weekNumber === week);
				return weekData?.individualPerformance ?? null;
			}),
			borderColor: 'rgba(168, 85, 247, 0.5)',
			backgroundColor: 'rgba(168, 85, 247, 0.05)',
			borderWidth: 2,
			borderDash: [5, 5],
			tension: 0.3,
			pointRadius: 4,
			pointHoverRadius: 6,
			spanGaps: true,
			yAxisID: 'y'
		});

		// Individual correlation line (solid and prominent)
		if (individualCorrelation !== null && individualCorrelationLine && individualCorrelationLine.length === 2) {
			// Calculate slope and intercept from correlation line
			const dx = individualCorrelationLine[1].x - individualCorrelationLine[0].x;
			const dy = individualCorrelationLine[1].y - individualCorrelationLine[0].y;
			
			if (Math.abs(dx) > 0.0001) {
				const slope = dy / dx;
				const intercept = individualCorrelationLine[0].y - slope * individualCorrelationLine[0].x;

				// Show predicted performance based on effort for each week
				datasets.push({
					label: 'My Correlation',
					data: allWeeks.map((week) => {
						const weekData = weeklyData.find((w) => w.weekNumber === week);
						if (weekData?.individualEffort !== null && weekData.individualEffort !== undefined) {
							// Predicted performance = slope * effort + intercept
							return slope * weekData.individualEffort + intercept;
						}
						return null;
					}),
					borderColor: 'rgb(59, 130, 246)',
					backgroundColor: 'transparent',
					borderWidth: 3,
					borderDash: [],
					tension: 0.3,
					pointRadius: 0,
					spanGaps: true,
					yAxisID: 'y',
					order: -1
				});
			}
		}

		// Stakeholder average lines
		if (showStakeholders && stakeholderData.length > 0) {
			// Calculate averages per week
			const stakeholderAveragesByWeek = weeklyData.map((week) => {
				const avgEffort =
					week.stakeholderEfforts.length > 0
						? week.stakeholderEfforts.reduce((sum, val) => sum + val, 0) / week.stakeholderEfforts.length
						: null;
				const avgPerformance =
					week.stakeholderPerformances.length > 0
						? week.stakeholderPerformances.reduce((sum, val) => sum + val, 0) / week.stakeholderPerformances.length
						: null;
				return { weekNumber: week.weekNumber, avgEffort, avgPerformance };
			});

			datasets.push({
				label: 'Stakeholders Effort (Avg)',
				data: allWeeks.map((week) => {
					const weekData = stakeholderAveragesByWeek.find((w) => w.weekNumber === week);
					return weekData?.avgEffort ?? null;
				}),
				borderColor: 'rgba(16, 185, 129, 0.5)',
				backgroundColor: 'rgba(16, 185, 129, 0.05)',
				borderWidth: 2,
				tension: 0.3,
				pointRadius: 3,
				pointHoverRadius: 5,
				borderDash: [5, 5],
				spanGaps: true,
				yAxisID: 'y'
			});

			datasets.push({
				label: 'Stakeholders Performance (Avg)',
				data: allWeeks.map((week) => {
					const weekData = stakeholderAveragesByWeek.find((w) => w.weekNumber === week);
					return weekData?.avgPerformance ?? null;
				}),
				borderColor: 'rgba(245, 101, 101, 0.5)',
				backgroundColor: 'rgba(245, 101, 101, 0.05)',
				borderWidth: 2,
				tension: 0.3,
				pointRadius: 3,
				pointHoverRadius: 5,
				borderDash: [5, 5],
				spanGaps: true,
				yAxisID: 'y'
			});

			// Stakeholder correlation line (solid and prominent)
			if (stakeholderCorrelation !== null && stakeholderCorrelationLine && stakeholderCorrelationLine.length === 2) {
				const dx = stakeholderCorrelationLine[1].x - stakeholderCorrelationLine[0].x;
				const dy = stakeholderCorrelationLine[1].y - stakeholderCorrelationLine[0].y;
				
				if (Math.abs(dx) > 0.0001) {
					const slope = dy / dx;
					const intercept = stakeholderCorrelationLine[0].y - slope * stakeholderCorrelationLine[0].x;

					datasets.push({
						label: 'Stakeholders Correlation',
						data: allWeeks.map((week) => {
							const weekData = stakeholderAveragesByWeek.find((w) => w.weekNumber === week);
							if (weekData?.avgEffort !== null && weekData.avgEffort !== undefined) {
								// Predicted performance = slope * effort + intercept
								return slope * weekData.avgEffort + intercept;
							}
							return null;
						}),
						borderColor: 'rgb(16, 185, 129)',
						backgroundColor: 'transparent',
						borderWidth: 3,
						borderDash: [],
						tension: 0.3,
						pointRadius: 0,
						spanGaps: true,
						yAxisID: 'y',
						order: -1
					});
				}
			}

			// Individual stakeholder lines (optional)
			if (showIndividualStakeholders) {
				const stakeholderGroups = new Map<string, Array<{ weekNumber: number; effort: number; performance: number }>>();
				stakeholderData.forEach((d) => {
					if (!stakeholderGroups.has(d.stakeholderName)) {
						stakeholderGroups.set(d.stakeholderName, []);
					}
					stakeholderGroups.get(d.stakeholderName)!.push({
						weekNumber: d.weekNumber,
						effort: d.effort,
						performance: d.progress
					});
				});

				const colors = [
					{ effort: 'rgb(34, 197, 94)', performance: 'rgba(34, 197, 94, 0.6)' },
					{ effort: 'rgb(251, 146, 60)', performance: 'rgba(251, 146, 60, 0.6)' },
					{ effort: 'rgb(168, 85, 247)', performance: 'rgba(168, 85, 247, 0.6)' },
					{ effort: 'rgb(236, 72, 153)', performance: 'rgba(236, 72, 153, 0.6)' }
				];

				let colorIndex = 0;
				stakeholderGroups.forEach((points, stakeholderName) => {
					const color = colors[colorIndex % colors.length];
					
					// Effort line for this stakeholder
					datasets.push({
						label: `${stakeholderName} (Effort)`,
						data: allWeeks.map((week) => {
							const point = points.find((p) => p.weekNumber === week);
							return point?.effort ?? null;
						}),
						borderColor: color.effort,
						backgroundColor: color.performance,
						borderWidth: 1.5,
						tension: 0.3,
						pointRadius: 3,
						pointHoverRadius: 5,
						spanGaps: true,
						yAxisID: 'y'
					});

					// Performance line for this stakeholder
					datasets.push({
						label: `${stakeholderName} (Performance)`,
						data: allWeeks.map((week) => {
							const point = points.find((p) => p.weekNumber === week);
							return point?.performance ?? null;
						}),
						borderColor: color.performance,
						backgroundColor: color.performance,
						borderWidth: 1.5,
						tension: 0.3,
						pointRadius: 3,
						pointHoverRadius: 5,
						spanGaps: true,
						yAxisID: 'y'
					});

					colorIndex++;
				});
			}
		}

		return {
			type: 'line' as const,
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
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
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += context.parsed.y.toFixed(1);
								} else {
									label += 'No data';
								}
								return label;
							}
						}
					}
				},
				scales: {
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
					},
					y: {
						type: 'linear' as const,
						position: 'left' as const,
						title: {
							display: true,
							text: 'Score',
							font: {
								size: 12,
								weight: 600
							}
						},
						min: 0,
						max: 10,
						ticks: {
							stepSize: 2,
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
		// Initialize chart on mount
		if (chartCanvas && chartConfig) {
			const ctx = chartCanvas.getContext('2d');
			if (ctx) {
				chartInstance = new Chart(ctx, chartConfig);
			}
		}
	});

	// Update chart when data or toggle changes - only after mount
	$effect(() => {
		if (!isMounted || !chartCanvas) return;

		// Access reactive dependencies to track them
		const indData = individualData;
		const stkData = stakeholderData;
		const showStk = showStakeholders;
		const showIndStk = showIndividualStakeholders;

		// Get current config
		const config = chartConfig;
		const instance = chartInstance;

		// Only update if chart exists and config is available
		if (instance && config) {
			// Rebuild datasets from config
			instance.data.datasets = config.data.datasets;
			instance.data.labels = config.data.labels;
			instance.update('none');
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});

	// Get correlation interpretation
	function getCorrelationInterpretation(corr: number | null): string {
		if (corr === null) return 'Insufficient data';
		const absCorr = Math.abs(corr);
		if (absCorr < 0.3) return 'Weak';
		if (absCorr < 0.7) return 'Moderate';
		return 'Strong';
	}

	function getCorrelationDirection(corr: number | null): string {
		if (corr === null) return '';
		if (corr > 0) return 'positive';
		return 'negative';
	}

</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-xl font-bold text-neutral-900">Correlation View</h2>
			<p class="mt-1 text-sm text-neutral-600">
				See if increases in effort actually drive observable progress over time. When lines move together, there's correlation.
			</p>
		</div>
		{#if stakeholderData.length > 0}
			<div class="flex items-center gap-4">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						bind:checked={showStakeholders}
						class="h-4 w-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
					/>
					<span class="text-sm font-semibold text-neutral-700">Show Stakeholders</span>
				</label>
				{#if showStakeholders}
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={showIndividualStakeholders}
							class="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<span class="text-xs font-semibold text-neutral-600">Show Individual Lines</span>
					</label>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Correlation indicators -->
	{#if individualCorrelation !== null}
		<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
			<div class="flex gap-6">
				<div class="flex-1">
					<div class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">My Correlation</div>
					<div class="mt-1 flex items-baseline gap-2">
						<span class="text-2xl font-bold text-neutral-900">
							{individualCorrelation.toFixed(2)}
						</span>
						<span class="text-sm font-medium text-neutral-600">
							({getCorrelationInterpretation(individualCorrelation)} {getCorrelationDirection(individualCorrelation)})
						</span>
					</div>
				</div>
				{#if stakeholderCorrelation !== null}
					<div class="flex-1 border-l border-neutral-300 pl-6">
						<div class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Stakeholders Correlation</div>
						<div class="mt-1 flex items-baseline gap-2">
							<span class="text-2xl font-bold text-neutral-900">
								{stakeholderCorrelation.toFixed(2)}
							</span>
							<span class="text-sm font-medium text-neutral-600">
								({getCorrelationInterpretation(stakeholderCorrelation)} {getCorrelationDirection(stakeholderCorrelation)})
							</span>
						</div>
					</div>
				{/if}
			</div>
			<div class="mt-3 border-t border-neutral-200 pt-3">
				<p class="text-xs text-neutral-600">
					<strong>What this means:</strong> Correlation measures how effort and performance move together.
					Values range from -1 to +1. Close to +1 means they move in sync (when effort rises, performance rises).
					Close to -1 means they move opposite. Near 0 means little relationship. The solid lines on the chart show the correlation trend.
				</p>
			</div>
		</div>
	{/if}

	<!-- Custom Legend/Key -->
	<div class="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
		<div>
			<div class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Correlation Lines</div>
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<div class="h-1 w-8 rounded-full bg-blue-600"></div>
					<span class="text-sm font-medium text-neutral-700">My Correlation</span>
					{#if individualCorrelation !== null}
						<span class="text-xs text-neutral-500">(r={individualCorrelation.toFixed(2)})</span>
					{/if}
				</div>
				{#if showStakeholders && stakeholderCorrelation !== null}
					<div class="flex items-center gap-2">
						<div class="h-1 w-8 rounded-full bg-emerald-600"></div>
						<span class="text-sm font-medium text-neutral-700">Stakeholders Correlation</span>
						<span class="text-xs text-neutral-500">(r={stakeholderCorrelation.toFixed(2)})</span>
					</div>
				{/if}
			</div>
		</div>
		<div>
			<div class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Individual Lines</div>
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<div class="h-0.5 w-8 border-t-2 border-dashed border-blue-600/50"></div>
					<span class="text-sm text-neutral-600">My Effort</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-0.5 w-8 border-t-2 border-dashed border-purple-600/50"></div>
					<span class="text-sm text-neutral-600">My Performance</span>
				</div>
				{#if showStakeholders}
					<div class="flex items-center gap-2">
						<div class="h-0.5 w-8 border-t-2 border-dashed border-emerald-600/50"></div>
						<span class="text-sm text-neutral-600">Stakeholders Effort (Avg)</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-0.5 w-8 border-t-2 border-dashed border-red-600/50"></div>
						<span class="text-sm text-neutral-600">Stakeholders Performance (Avg)</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="h-[400px] w-full rounded-xl border-2 border-neutral-200 bg-white p-6">
		{#if individualData.length > 0 || stakeholderData.length > 0}
			<canvas bind:this={chartCanvas}></canvas>
		{:else}
			<div class="flex h-full items-center justify-center text-neutral-500">
				<p>Not enough data to display correlation view. Complete more check-ins to see the relationship between effort and performance over time.</p>
			</div>
		{/if}
	</div>
</div>