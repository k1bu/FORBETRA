<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables, type ChartConfiguration } from 'chart.js';
	import { CHART_COLORS } from '$lib/utils/scoreColors';

	Chart.register(...registerables);

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
	};

	const props: Props = $props();
	const individualData = props.individualData ?? [];
	const stakeholderData = props.stakeholderData ?? [];
	const stakeholders = props.stakeholders ?? [];

	let selectedStakeholderIds = $state(new Set<string>());
	let showEffort = $state(true);
	let showPerformance = $state(true);
	let showIndividualStakeholdersInTable = $state(false);

	// Smart defaults: show individual lines for 1-2 stakeholders, average only for 3+
	const stakeholdersWithData = $derived(
		stakeholders.filter((s) => stakeholderData.some((d) => d.stakeholderId === s.id))
	);

	// Initialize with smart default based on number of stakeholders (1-2 = show, 3+ = hide)
	// User can toggle this preference via the checkbox
	let showIndividualLines = $state(false);
	let hasInitializedDefault = $state(false);

	// Set smart default once on mount based on stakeholder count
	$effect(() => {
		if (!hasInitializedDefault && stakeholdersWithData.length > 0) {
			showIndividualLines = stakeholdersWithData.length <= 2;
			hasInitializedDefault = true;
		}
	});

	let effortChartCanvas = $state<HTMLCanvasElement | null>(null);
	let performanceChartCanvas = $state<HTMLCanvasElement | null>(null);
	let effortChartInstance = $state<Chart | null>(null);
	let performanceChartInstance = $state<Chart | null>(null);

	const filteredStakeholderData = $derived(
		stakeholderData.filter((d) =>
			selectedStakeholderIds.size === 0 ? true : selectedStakeholderIds.has(d.stakeholderId)
		)
	);

	// Get stakeholders to show individually (filtered if selection active)
	const stakeholdersToShowIndividually = $derived(
		selectedStakeholderIds.size === 0
			? stakeholdersWithData
			: stakeholdersWithData.filter((s) => selectedStakeholderIds.has(s.id))
	);

	// Color palette for individual stakeholder lines (colorblind-friendly, distinct)
	const stakeholderColors = [
		{ border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.05)' }, // emerald
		{ border: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.05)' }, // orange
		{ border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.05)' }, // purple
		{ border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.05)' }, // pink
		{ border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.05)' }, // blue
		{ border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.05)' } // amber
	];

	function getStakeholderColor(index: number) {
		return stakeholderColors[index % stakeholderColors.length];
	}

	// Calculate average stakeholder scores per week
	// Note: Missing data handling - averages are calculated using only stakeholders who provided data for that week
	// If a stakeholder doesn't provide feedback for a week, they're excluded from that week's average calculation
	const stakeholderAveragesByWeek = $derived((() => {
		const weekMap = new Map<
			number,
			{
				effortScores: number[];
				performanceScores: number[];
			}
		>();

		filteredStakeholderData.forEach((d) => {
			if (!weekMap.has(d.weekNumber)) {
				weekMap.set(d.weekNumber, { effortScores: [], performanceScores: [] });
			}
			const weekData = weekMap.get(d.weekNumber)!;
			// Only include non-null scores in the average calculation
			if (d.effortScore !== null && d.effortScore !== undefined) {
				weekData.effortScores.push(d.effortScore);
			}
			if (d.performanceScore !== null && d.performanceScore !== undefined) {
				weekData.performanceScores.push(d.performanceScore);
			}
		});

		const averages: Array<{ weekNumber: number; avgEffort: number | null; avgProgress: number | null }> = [];
		weekMap.forEach((data, weekNumber) => {
			averages.push({
				weekNumber,
				// Average is calculated from available data only - missing stakeholders are excluded
				avgEffort:
					data.effortScores.length > 0
						? Number((data.effortScores.reduce((sum, s) => sum + s, 0) / data.effortScores.length).toFixed(1))
						: null,
				avgProgress:
					data.performanceScores.length > 0
						? Number(
								(data.performanceScores.reduce((sum, s) => sum + s, 0) / data.performanceScores.length).toFixed(1)
							)
						: null
			});
		});

		return averages.sort((a, b) => a.weekNumber - b.weekNumber);
	})());

	// Get all unique week numbers and sort them, excluding Week 13
	// Pad to minimum 4 weeks so early-cycle charts look intentional
	const allWeeks = $derived((() => {
		const weeks = new Set<number>();
		individualData.forEach((d) => weeks.add(d.weekNumber));
		stakeholderData.forEach((d) => weeks.add(d.weekNumber));
		const sorted = Array.from(weeks)
			.filter((week) => week !== 13) // Exclude Week 13
			.sort((a, b) => a - b);
		// Pad to at least 4 weeks
		if (sorted.length > 0 && sorted.length < 4) {
			const maxWeek = sorted[sorted.length - 1];
			for (let w = maxWeek + 1; sorted.length < 4; w++) {
				if (w !== 13) sorted.push(w);
			}
		}
		return sorted;
	})());

	const hasLimitedData = $derived((() => {
		const dataWeeks = new Set<number>();
		individualData.forEach((d) => dataWeeks.add(d.weekNumber));
		stakeholderData.forEach((d) => dataWeeks.add(d.weekNumber));
		return dataWeeks.size > 0 && dataWeeks.size < 4;
	})());

	// Calculate baseline values - prefer Week 0 (initial rating) if available, otherwise use first week
	const baseline = $derived((() => {
		// Check for Week 0 first (initial rating)
		const week0 = allWeeks.find((w) => w === 0);
		const baselineWeek = week0 ?? allWeeks[0];

		if (!baselineWeek) return { individualEffort: null, individualProgress: null, stakeholderEffort: null, stakeholderProgress: null };

		const baselineIndividual = individualData.find((d) => d.weekNumber === baselineWeek);
		const baselineStakeholder = stakeholderAveragesByWeek.find((d) => d.weekNumber === baselineWeek);

		return {
			individualEffort: baselineIndividual?.effortScore ?? null,
			individualProgress: baselineIndividual?.performanceScore ?? null,
			stakeholderEffort: baselineStakeholder?.avgEffort ?? null,
			stakeholderProgress: baselineStakeholder?.avgProgress ?? null
		};
	})());

	// Calculate current (latest) values - find the latest week with data for each metric separately
	const currentValues = $derived((() => {
		if (allWeeks.length === 0) {
			return { individualEffort: null, individualProgress: null, stakeholderEffort: null, stakeholderProgress: null };
		}

		// For individual effort, find the latest week with effort data
		const individualEffortWeeks = individualData
			.filter((d) => d.effortScore !== null)
			.map((d) => d.weekNumber)
			.sort((a, b) => b - a);
		const latestIndividualEffort = individualEffortWeeks[0] ? individualData.find((d) => d.weekNumber === individualEffortWeeks[0]) : null;

		// For individual performance, find the latest week with performance data
		const individualProgressWeeks = individualData
			.filter((d) => d.performanceScore !== null)
			.map((d) => d.weekNumber)
			.sort((a, b) => b - a);
		const latestIndividualProgress = individualProgressWeeks[0] ? individualData.find((d) => d.weekNumber === individualProgressWeeks[0]) : null;

		// For stakeholder effort, find the latest week with effort data
		const stakeholderEffortWeeks = stakeholderAveragesByWeek
			.filter((d) => d.avgEffort !== null)
			.map((d) => d.weekNumber)
			.sort((a, b) => b - a);
		const latestStakeholderEffort = stakeholderEffortWeeks[0] ? stakeholderAveragesByWeek.find((d) => d.weekNumber === stakeholderEffortWeeks[0]) : null;

		// For stakeholder performance, find the latest week with performance data
		const stakeholderProgressWeeks = stakeholderAveragesByWeek
			.filter((d) => d.avgProgress !== null)
			.map((d) => d.weekNumber)
			.sort((a, b) => b - a);
		const latestStakeholderProgress = stakeholderProgressWeeks[0] ? stakeholderAveragesByWeek.find((d) => d.weekNumber === stakeholderProgressWeeks[0]) : null;

		return {
			individualEffort: latestIndividualEffort?.effortScore ?? null,
			individualProgress: latestIndividualProgress?.performanceScore ?? null,
			stakeholderEffort: latestStakeholderEffort?.avgEffort ?? null,
			stakeholderProgress: latestStakeholderProgress?.avgProgress ?? null
		};
	})());

	// Helper function to calculate delta from baseline
	function calculateDelta(value: number | null, baseline: number | null): number | null {
		if (value === null || baseline === null) return null;
		return value - baseline;
	}

	// Helper function to calculate percentage change
	function calculatePercentChange(value: number | null, baseline: number | null): number | null {
		if (value === null || baseline === null || baseline === 0) return null;
		return ((value - baseline) / baseline) * 100;
	}

	// Pre-calculate summary table values for efficiency
	const summaryData = $derived((() => {
		return {
			individualEffort: {
				delta: calculateDelta(currentValues.individualEffort, baseline.individualEffort),
				percentChange: calculatePercentChange(currentValues.individualEffort, baseline.individualEffort)
			},
			stakeholderEffort: {
				delta: calculateDelta(currentValues.stakeholderEffort, baseline.stakeholderEffort),
				percentChange: calculatePercentChange(currentValues.stakeholderEffort, baseline.stakeholderEffort)
			},
			individualProgress: {
				delta: calculateDelta(currentValues.individualProgress, baseline.individualProgress),
				percentChange: calculatePercentChange(currentValues.individualProgress, baseline.individualProgress)
			},
			stakeholderProgress: {
				delta: calculateDelta(currentValues.stakeholderProgress, baseline.stakeholderProgress),
				percentChange: calculatePercentChange(currentValues.stakeholderProgress, baseline.stakeholderProgress)
			}
		};
	})());

	// Calculate individual stakeholder values for summary table
	const stakeholderSummaryData = $derived((() => {
		if (allWeeks.length === 0) return [];

		// Prefer Week 0 (initial rating) if available, otherwise use first week
		const week0 = allWeeks.find((w) => w === 0);
		const baselineWeek = week0 ?? allWeeks[0];
		if (!baselineWeek) return [];

		// Find the latest week with actual stakeholder data
		const stakeholderDataWeeks = new Set<number>();
		stakeholderData.forEach((d) => {
			if (d.effortScore !== null || d.performanceScore !== null) {
				stakeholderDataWeeks.add(d.weekNumber);
			}
		});
		const sortedStakeholderWeeks = Array.from(stakeholderDataWeeks).sort((a, b) => b - a);
		const latestWeekWithStakeholderData = sortedStakeholderWeeks[0];

		const stakeholderSummaries: Array<{
			stakeholderId: string;
			stakeholderName: string;
			effort: {
				week1: number | null;
				current: number | null;
				delta: number | null;
				percentChange: number | null;
			};
			performance: {
				week1: number | null;
				current: number | null;
				delta: number | null;
				percentChange: number | null;
			};
		}> = [];

		// Get all unique stakeholders from the data
		const uniqueStakeholders = new Map<string, string>();
		stakeholderData.forEach((d) => {
			if (!uniqueStakeholders.has(d.stakeholderId)) {
				uniqueStakeholders.set(d.stakeholderId, d.stakeholderName);
			}
		});

		uniqueStakeholders.forEach((name, id) => {
			const stakeholderWeekData = stakeholderData.filter((d) => d.stakeholderId === id);

			const week1Data = stakeholderWeekData.find((d) => d.weekNumber === baselineWeek);

			// Find latest week with effort data for this stakeholder
			const effortWeeks = stakeholderWeekData
				.filter((d) => d.effortScore !== null)
				.map((d) => d.weekNumber)
				.sort((a, b) => b - a);
			const latestEffortData = effortWeeks[0]
				? stakeholderWeekData.find((d) => d.weekNumber === effortWeeks[0])
				: null;

			// Find latest week with performance data for this stakeholder
			const performanceWeeks = stakeholderWeekData
				.filter((d) => d.performanceScore !== null)
				.map((d) => d.weekNumber)
				.sort((a, b) => b - a);
			const latestPerformanceData = performanceWeeks[0]
				? stakeholderWeekData.find((d) => d.weekNumber === performanceWeeks[0])
				: null;

			const week1Effort = week1Data?.effortScore ?? null;
			const currentEffort = latestEffortData?.effortScore ?? null;
			const week1Performance = week1Data?.performanceScore ?? null;
			const currentPerformance = latestPerformanceData?.performanceScore ?? null;

			stakeholderSummaries.push({
				stakeholderId: id,
				stakeholderName: name,
				effort: {
					week1: week1Effort,
					current: currentEffort,
					delta: calculateDelta(currentEffort, week1Effort),
					percentChange: calculatePercentChange(currentEffort, week1Effort)
				},
				performance: {
					week1: week1Performance,
					current: currentPerformance,
					delta: calculateDelta(currentPerformance, week1Performance),
					percentChange: calculatePercentChange(currentPerformance, week1Performance)
				}
			});
		});

		return stakeholderSummaries.sort((a, b) => a.stakeholderName.localeCompare(b.stakeholderName));
	})());

	// Effort chart configuration
	const effortChartConfig = $derived((() => {
		if (!showEffort) return null;

		const labels = allWeeks.map((w) => (w === 0 ? 'Initial' : `Week ${w}`));
		const datasets: any[] = [];

		// Individual effort (bold, prominent)
		datasets.push({
			label: 'My Effort',
			data: allWeeks.map((week: number) => {
				const weekData = individualData.find((d) => d.weekNumber === week);
				return weekData?.effortScore ?? null;
			}),
			borderColor: CHART_COLORS.effort.individual.border,
			backgroundColor: CHART_COLORS.effort.individual.bg,
			borderWidth: 3,
			tension: 0.3,
			pointRadius: 5,
			pointHoverRadius: 7,
			spanGaps: true
		});

		// Stakeholder average effort (always shown when data exists)
		if (stakeholderAveragesByWeek.length > 0) {
			datasets.push({
				label: selectedStakeholderIds.size === 0 ? 'Stakeholders (Avg)' : 'Selected Stakeholders (Avg)',
				data: allWeeks.map((week: number) => {
					const weekData = stakeholderAveragesByWeek.find((d) => d.weekNumber === week);
					return weekData?.avgEffort ?? null;
				}),
				borderColor: CHART_COLORS.effort.stakeholder.border,
				backgroundColor: CHART_COLORS.effort.stakeholder.bg,
				borderWidth: 2,
				tension: 0.3,
				pointRadius: 5,
				pointHoverRadius: 7,
				borderDash: [5, 5],
				spanGaps: true
			});
		}

		// Individual stakeholder lines (when enabled)
		if (showIndividualLines && stakeholdersToShowIndividually.length > 0) {
			stakeholdersToShowIndividually.forEach((stakeholder, index) => {
				const color = getStakeholderColor(index);
				datasets.push({
					label: stakeholder.name,
					data: allWeeks.map((week: number) => {
						const weekData = filteredStakeholderData.find(
							(d) => d.weekNumber === week && d.stakeholderId === stakeholder.id
						);
						return weekData?.effortScore ?? null;
					}),
					borderColor: color.border,
					backgroundColor: color.bg,
					borderWidth: 1.5,
					tension: 0.3,
					pointRadius: 3,
					pointHoverRadius: 5,
					spanGaps: true,
					hidden: false
				});
			});
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
						position: 'top',
						labels: {
							color: '#a1a1aa',
							usePointStyle: true,
							padding: 15,
							font: {
								size: 13,
								weight: 600
							}
						}
					},
					tooltip: {
						backgroundColor: '#1c1c20',
						titleColor: '#f4f5f8',
						bodyColor: '#a1a1aa',
						borderColor: 'rgba(255,255,255,0.08)',
						borderWidth: 1,
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
					y: {
						type: 'linear',
						position: 'left',
						title: {
							display: true,
							text: 'Effort Score',
							color: '#a1a1aa',
							font: {
								size: 12,
								weight: 600
							}
						},
						min: 0,
						max: 10,
						ticks: {
							color: '#a1a1aa',
							stepSize: 2,
							font: {
								size: 11
							}
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.06)'
						}
					},
					x: {
						title: {
							display: true,
							text: 'Week',
							color: '#a1a1aa',
							font: {
								size: 12,
								weight: 600
							}
						},
						ticks: {
							color: '#a1a1aa',
							font: {
								size: 11
							}
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.06)'
						}
					}
				}
			}
		};
	})());

	// Performance chart configuration
	const performanceChartConfig = $derived((() => {
		if (!showPerformance) return null;

		const labels = allWeeks.map((w) => (w === 0 ? 'Initial' : `Week ${w}`));
		const datasets: any[] = [];

		// Individual performance (bold, prominent)
		datasets.push({
			label: 'My Performance',
			data: allWeeks.map((week: number) => {
				const weekData = individualData.find((d) => d.weekNumber === week);
				return weekData?.performanceScore ?? null;
			}),
			borderColor: CHART_COLORS.performance.individual.border,
			backgroundColor: CHART_COLORS.performance.individual.bg,
			borderWidth: 3,
			tension: 0.3,
			pointRadius: 5,
			pointHoverRadius: 7,
			spanGaps: true
		});

		// Stakeholder average performance (always shown when data exists)
		if (stakeholderAveragesByWeek.length > 0) {
			datasets.push({
				label: selectedStakeholderIds.size === 0 ? 'Stakeholders (Avg)' : 'Selected Stakeholders (Avg)',
				data: allWeeks.map((week: number) => {
					const weekData = stakeholderAveragesByWeek.find((d) => d.weekNumber === week);
					return weekData?.avgProgress ?? null;
				}),
				borderColor: CHART_COLORS.performance.stakeholder.border,
				backgroundColor: CHART_COLORS.performance.stakeholder.bg,
				borderWidth: 2,
				tension: 0.3,
				pointRadius: 5,
				pointHoverRadius: 7,
				borderDash: [5, 5],
				spanGaps: true
			});
		}

		// Individual stakeholder lines (when enabled)
		if (showIndividualLines && stakeholdersToShowIndividually.length > 0) {
			stakeholdersToShowIndividually.forEach((stakeholder, index) => {
				const color = getStakeholderColor(index);
				datasets.push({
					label: stakeholder.name,
					data: allWeeks.map((week: number) => {
						const weekData = filteredStakeholderData.find(
							(d) => d.weekNumber === week && d.stakeholderId === stakeholder.id
						);
						return weekData?.performanceScore ?? null;
					}),
					borderColor: color.border,
					backgroundColor: color.bg,
					borderWidth: 1.5,
					tension: 0.3,
					pointRadius: 3,
					pointHoverRadius: 5,
					spanGaps: true,
					hidden: false
				});
			});
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
						position: 'top',
						labels: {
							color: '#a1a1aa',
							usePointStyle: true,
							padding: 15,
							font: {
								size: 13,
								weight: 600
							}
						}
					},
					tooltip: {
						backgroundColor: '#1c1c20',
						titleColor: '#f4f5f8',
						bodyColor: '#a1a1aa',
						borderColor: 'rgba(255,255,255,0.08)',
						borderWidth: 1,
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
					y: {
						type: 'linear',
						position: 'left',
						title: {
							display: true,
							text: 'Performance Score',
							color: '#a1a1aa',
							font: {
								size: 12,
								weight: 600
							}
						},
						min: 0,
						max: 10,
						ticks: {
							color: '#a1a1aa',
							stepSize: 2,
							font: {
								size: 11
							}
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.06)'
						}
					},
					x: {
						title: {
							display: true,
							text: 'Week',
							color: '#a1a1aa',
							font: {
								size: 12,
								weight: 600
							}
						},
						ticks: {
							color: '#a1a1aa',
							font: {
								size: 11
							}
						},
						grid: {
							color: 'rgba(255, 255, 255, 0.06)'
						}
					}
				}
			}
		};
	})());

	// Update effort chart when config changes
	$effect(() => {
		// Access reactive dependencies to track them
		const config = effortChartConfig;
		const instance = effortChartInstance;
		const canvas = effortChartCanvas;

		if (instance && canvas && config) {
			instance.data.labels = config.data.labels;
			instance.data.datasets = config.data.datasets;
			instance.update('none');
		}
	});

	// Update performance chart when config changes
	$effect(() => {
		// Access reactive dependencies to track them
		const config = performanceChartConfig;
		const instance = performanceChartInstance;
		const canvas = performanceChartCanvas;

		if (instance && canvas && config) {
			instance.data.labels = config.data.labels;
			instance.data.datasets = config.data.datasets;
			instance.update('none');
		}
	});

	onMount(() => {
		// Initialize effort chart
		if (effortChartCanvas && effortChartConfig) {
			const ctx = effortChartCanvas.getContext('2d');
			if (ctx) {
				effortChartInstance = new Chart(ctx, effortChartConfig as ChartConfiguration<'line'>);
			}
		}

		// Initialize performance chart
		if (performanceChartCanvas && performanceChartConfig) {
			const ctx = performanceChartCanvas.getContext('2d');
			if (ctx) {
				performanceChartInstance = new Chart(ctx, performanceChartConfig as ChartConfiguration<'line'>);
			}
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
				effortChartInstance = new Chart(ctx, effortChartConfig as ChartConfiguration<'line'>);
			}
		}

		if (!showPerformance && performanceChartInstance) {
			performanceChartInstance.destroy();
			performanceChartInstance = null;
		} else if (showPerformance && !performanceChartInstance && performanceChartCanvas && performanceChartConfig) {
			const ctx = performanceChartCanvas.getContext('2d');
			if (ctx) {
				performanceChartInstance = new Chart(ctx, performanceChartConfig as ChartConfiguration<'line'>);
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

	function toggleStakeholder(stakeholderId: string) {
		if (selectedStakeholderIds.has(stakeholderId)) {
			selectedStakeholderIds.delete(stakeholderId);
		} else {
			selectedStakeholderIds.add(stakeholderId);
		}
		// Trigger reactivity by reassigning
		selectedStakeholderIds = new Set(selectedStakeholderIds);
	}

	function selectAllStakeholders() {
		selectedStakeholderIds = new Set(stakeholders.map((s) => s.id));
	}

	function clearStakeholderFilter() {
		selectedStakeholderIds = new Set<string>();
	}
</script>

<div class="space-y-4">
	<!-- Title and Subtitle -->
	<div class="mb-2">
		<h3 class="text-lg font-bold text-text-primary">Effort and Performance Over Time</h3>
		<p class="text-sm text-text-secondary">Compare your self-assessments with stakeholder observations</p>
	</div>

	<!-- Controls -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4">
		<!-- Row 1: Metrics Selection -->
		<div class="flex flex-wrap items-center gap-4 border-b border-border-default pb-3">
			<span class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Metrics:</span>
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						bind:checked={showEffort}
						class="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
					/>
					<span class="text-sm font-semibold text-text-secondary">Effort</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						bind:checked={showPerformance}
						class="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
					/>
					<span class="text-sm font-semibold text-text-secondary">Performance</span>
				</label>
			</div>
		</div>

		<!-- Row 2: Stakeholder Controls -->
		{#if stakeholders.length > 0 && stakeholdersWithData.length > 0}
			<div class="flex flex-wrap items-center gap-6 pt-3">
				<div class="flex items-center gap-4">
					<span class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Filter Stakeholders:</span>
					<div class="flex flex-wrap gap-2">
						{#each stakeholders as stakeholder (stakeholder.id)}
							{@const hasData = stakeholderData.some((d) => d.stakeholderId === stakeholder.id)}
							{#if hasData}
								<button
									type="button"
									onclick={() => toggleStakeholder(stakeholder.id)}
									class="rounded-lg border px-3 py-1 text-xs font-semibold transition-all {selectedStakeholderIds.has(
										stakeholder.id
									) || selectedStakeholderIds.size === 0
										? 'border-accent bg-accent-muted text-accent'
										: 'border-border-strong bg-surface-raised text-text-secondary hover:border-accent/50 hover:bg-accent-muted'}"
								>
									{stakeholder.name}
									{#if selectedStakeholderIds.has(stakeholder.id)}
										<span class="ml-1">✓</span>
									{/if}
								</button>
							{/if}
						{/each}
						{#if selectedStakeholderIds.size > 0}
							<button
								type="button"
								onclick={selectAllStakeholders}
								class="rounded-lg border border-border-strong bg-surface-raised px-3 py-1 text-xs font-semibold text-text-secondary transition-all hover:border-accent/50 hover:bg-accent-muted"
							>
								All
							</button>
							<button
								type="button"
								onclick={clearStakeholderFilter}
								class="rounded-lg border border-border-strong bg-surface-raised px-3 py-1 text-xs font-semibold text-text-secondary transition-all hover:border-error/50 hover:bg-error-muted"
							>
								Clear
							</button>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-4">
					<span class="text-xs font-semibold uppercase tracking-wide text-text-tertiary">View:</span>
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={showIndividualLines}
							class="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
						/>
						<span class="text-sm font-semibold text-text-secondary">Show individual stakeholders</span>
					</label>
				</div>
			</div>
		{/if}
	</div>

	<!-- Chart Container -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-6">
		{#if showEffort || showPerformance}
			<div class="grid gap-6 {showEffort && showPerformance ? 'md:grid-cols-2' : 'grid-cols-1'}">
				{#if showEffort}
					<div>
						<h4 class="mb-2 text-sm font-semibold text-text-secondary">Effort</h4>
						<div class="h-[350px] w-full">
							{#if effortChartConfig && effortChartConfig.data.labels && effortChartConfig.data.labels.length > 0}
								<canvas bind:this={effortChartCanvas}></canvas>
							{:else}
								<div class="flex h-full items-center justify-center text-text-tertiary">
									<p class="text-sm">No effort data available</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				{#if showPerformance}
					<div>
						<h4 class="mb-2 text-sm font-semibold text-text-secondary">Performance</h4>
						<div class="h-[350px] w-full">
							{#if performanceChartConfig && performanceChartConfig.data.labels && performanceChartConfig.data.labels.length > 0}
								<canvas bind:this={performanceChartCanvas}></canvas>
							{:else}
								<div class="flex h-full items-center justify-center text-text-tertiary">
									<p class="text-sm">No performance data available</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex h-[350px] items-center justify-center text-text-tertiary">
				<p class="text-sm">Select at least one metric (Effort or Performance) to view</p>
			</div>
		{/if}
		{#if hasLimitedData}
			<p class="mt-3 text-center text-sm text-text-tertiary">
				Trends become clearer after week 4. Keep going!
			</p>
		{/if}
	</div>

	<!-- Summary Table -->
	{#if baseline.individualEffort !== null || baseline.individualProgress !== null}
			<div class="mt-8">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="text-base font-bold text-text-primary">Summary</h3>
					{#if stakeholderSummaryData.length > 0}
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								bind:checked={showIndividualStakeholdersInTable}
								class="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
							/>
							<span class="text-xs font-medium text-text-secondary">Show individual stakeholders</span>
						</label>
					{/if}
				</div>
				<div class="overflow-x-auto rounded-xl border border-border-default bg-surface-raised">
					<table class="w-full text-sm">
						<thead class="bg-surface-raised">
							<tr>
								<th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">Metric</th>
								<th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
									{baseline.individualEffort !== null || baseline.individualProgress !== null
										? (allWeeks.find((w) => w === 0) !== undefined ? 'Initial' : 'Week 1')
										: 'Week 1'}
								</th>
								<th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">Current</th>
								<th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">Change</th>
								<th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">% Change</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border-default">
						{#if showEffort}
							<!-- My Effort -->
							<tr class="bg-accent-muted/30">
								<td class="px-5 py-3 font-semibold text-text-primary">My Effort Rating</td>
								<td class="px-5 py-3 text-center font-medium text-text-secondary">
									{baseline.individualEffort?.toFixed(1) ?? '—'}
								</td>
								<td class="px-5 py-3 text-center font-medium text-text-secondary">
									{currentValues.individualEffort?.toFixed(1) ?? '—'}
								</td>
								<td class="px-5 py-3 text-center font-semibold {summaryData.individualEffort.delta !== null && summaryData.individualEffort.delta >= 0 ? 'text-success' : 'text-error'}">
									{summaryData.individualEffort.delta !== null
										? `${summaryData.individualEffort.delta > 0 ? '+' : ''}${summaryData.individualEffort.delta.toFixed(1)}`
										: '—'}
								</td>
								<td class="px-5 py-3 text-center font-semibold {summaryData.individualEffort.percentChange !== null && summaryData.individualEffort.percentChange >= 0 ? 'text-success' : 'text-error'}">
									{summaryData.individualEffort.percentChange !== null
										? `${summaryData.individualEffort.percentChange > 0 ? '+' : ''}${summaryData.individualEffort.percentChange.toFixed(1)}%`
										: '—'}
								</td>
							</tr>
							{#if stakeholderAveragesByWeek.length > 0}
								<!-- Stakeholder Average Effort -->
								<tr class="bg-surface-subtle/50">
									<td class="px-5 py-3 font-medium text-text-primary">Stakeholders Effort Rating (Avg)</td>
									<td class="px-5 py-3 text-center text-text-secondary">
										{baseline.stakeholderEffort?.toFixed(1) ?? '—'}
									</td>
									<td class="px-5 py-3 text-center text-text-secondary">
										{currentValues.stakeholderEffort?.toFixed(1) ?? '—'}
									</td>
									<td class="px-5 py-3 text-center font-semibold {summaryData.stakeholderEffort.delta !== null && summaryData.stakeholderEffort.delta >= 0 ? 'text-success' : 'text-error'}">
										{summaryData.stakeholderEffort.delta !== null
											? `${summaryData.stakeholderEffort.delta > 0 ? '+' : ''}${summaryData.stakeholderEffort.delta.toFixed(1)}`
											: '—'}
									</td>
									<td class="px-5 py-3 text-center font-semibold {summaryData.stakeholderEffort.percentChange !== null && summaryData.stakeholderEffort.percentChange >= 0 ? 'text-success' : 'text-error'}">
										{summaryData.stakeholderEffort.percentChange !== null
											? `${summaryData.stakeholderEffort.percentChange > 0 ? '+' : ''}${summaryData.stakeholderEffort.percentChange.toFixed(1)}%`
											: '—'}
									</td>
								</tr>
								<!-- Individual Stakeholder Effort Rows (Collapsible) -->
								{#if showIndividualStakeholdersInTable}
									{#each stakeholderSummaryData as stakeholder (stakeholder.stakeholderId)}
										{#if stakeholder.effort.week1 !== null || stakeholder.effort.current !== null}
											<tr class="bg-surface-raised/50">
												<td class="px-5 py-2.5 pl-8 text-sm text-text-secondary">
													<span class="font-medium">{stakeholder.stakeholderName}</span>
													<span class="ml-1 text-xs text-text-tertiary">(Effort)</span>
												</td>
												<td class="px-5 py-2.5 text-center text-sm text-text-secondary">
													{stakeholder.effort.week1?.toFixed(1) ?? '—'}
												</td>
												<td class="px-5 py-2.5 text-center text-sm text-text-secondary">
													{stakeholder.effort.current?.toFixed(1) ?? '—'}
												</td>
												<td class="px-5 py-2.5 text-center text-sm font-medium {stakeholder.effort.delta !== null && stakeholder.effort.delta >= 0 ? 'text-success' : 'text-error'}">
													{stakeholder.effort.delta !== null
														? `${stakeholder.effort.delta > 0 ? '+' : ''}${stakeholder.effort.delta.toFixed(1)}`
														: '—'}
												</td>
												<td class="px-5 py-2.5 text-center text-sm font-medium {stakeholder.effort.percentChange !== null && stakeholder.effort.percentChange >= 0 ? 'text-success' : 'text-error'}">
													{stakeholder.effort.percentChange !== null
														? `${stakeholder.effort.percentChange > 0 ? '+' : ''}${stakeholder.effort.percentChange.toFixed(1)}%`
														: '—'}
												</td>
											</tr>
										{/if}
									{/each}
								{/if}
							{/if}
						{/if}
						{#if showPerformance}
							<!-- My Performance -->
							<tr class="bg-warning-muted/30">
								<td class="px-5 py-3 font-semibold text-text-primary">My Performance Rating</td>
								<td class="px-5 py-3 text-center font-medium text-text-secondary">
									{baseline.individualProgress?.toFixed(1) ?? '—'}
								</td>
								<td class="px-5 py-3 text-center font-medium text-text-secondary">
									{currentValues.individualProgress?.toFixed(1) ?? '—'}
								</td>
								<td class="px-5 py-3 text-center font-semibold {summaryData.individualProgress.delta !== null && summaryData.individualProgress.delta >= 0 ? 'text-success' : 'text-error'}">
									{summaryData.individualProgress.delta !== null
										? `${summaryData.individualProgress.delta > 0 ? '+' : ''}${summaryData.individualProgress.delta.toFixed(1)}`
										: '—'}
								</td>
								<td class="px-5 py-3 text-center font-semibold {summaryData.individualProgress.percentChange !== null && summaryData.individualProgress.percentChange >= 0 ? 'text-success' : 'text-error'}">
									{summaryData.individualProgress.percentChange !== null
										? `${summaryData.individualProgress.percentChange > 0 ? '+' : ''}${summaryData.individualProgress.percentChange.toFixed(1)}%`
										: '—'}
								</td>
							</tr>
							{#if stakeholderAveragesByWeek.length > 0}
								<!-- Stakeholder Average Performance -->
								<tr class="bg-surface-subtle/50">
									<td class="px-5 py-3 font-medium text-text-primary">Stakeholders Performance Rating (Avg)</td>
									<td class="px-5 py-3 text-center text-text-secondary">
										{baseline.stakeholderProgress?.toFixed(1) ?? '—'}
									</td>
									<td class="px-5 py-3 text-center text-text-secondary">
										{currentValues.stakeholderProgress?.toFixed(1) ?? '—'}
									</td>
									<td class="px-5 py-3 text-center font-semibold {summaryData.stakeholderProgress.delta !== null && summaryData.stakeholderProgress.delta >= 0 ? 'text-success' : 'text-error'}">
										{summaryData.stakeholderProgress.delta !== null
											? `${summaryData.stakeholderProgress.delta > 0 ? '+' : ''}${summaryData.stakeholderProgress.delta.toFixed(1)}`
											: '—'}
									</td>
									<td class="px-5 py-3 text-center font-semibold {summaryData.stakeholderProgress.percentChange !== null && summaryData.stakeholderProgress.percentChange >= 0 ? 'text-success' : 'text-error'}">
										{summaryData.stakeholderProgress.percentChange !== null
											? `${summaryData.stakeholderProgress.percentChange > 0 ? '+' : ''}${summaryData.stakeholderProgress.percentChange.toFixed(1)}%`
											: '—'}
									</td>
								</tr>
								<!-- Individual Stakeholder Performance Rows (Collapsible) -->
								{#if showIndividualStakeholdersInTable}
									{#each stakeholderSummaryData as stakeholder (stakeholder.stakeholderId)}
										{#if stakeholder.performance.week1 !== null || stakeholder.performance.current !== null}
											<tr class="bg-surface-raised/50">
												<td class="px-5 py-2.5 pl-8 text-sm text-text-secondary">
													<span class="font-medium">{stakeholder.stakeholderName}</span>
													<span class="ml-1 text-xs text-text-tertiary">(Performance)</span>
												</td>
												<td class="px-5 py-2.5 text-center text-sm text-text-secondary">
													{stakeholder.performance.week1?.toFixed(1) ?? '—'}
												</td>
												<td class="px-5 py-2.5 text-center text-sm text-text-secondary">
													{stakeholder.performance.current?.toFixed(1) ?? '—'}
												</td>
												<td class="px-5 py-2.5 text-center text-sm font-medium {stakeholder.performance.delta !== null && stakeholder.performance.delta >= 0 ? 'text-success' : 'text-error'}">
													{stakeholder.performance.delta !== null
														? `${stakeholder.performance.delta > 0 ? '+' : ''}${stakeholder.performance.delta.toFixed(1)}`
														: '—'}
												</td>
												<td class="px-5 py-2.5 text-center text-sm font-medium {stakeholder.performance.percentChange !== null && stakeholder.performance.percentChange >= 0 ? 'text-success' : 'text-error'}">
													{stakeholder.performance.percentChange !== null
														? `${stakeholder.performance.percentChange > 0 ? '+' : ''}${stakeholder.performance.percentChange.toFixed(1)}%`
														: '—'}
												</td>
											</tr>
										{/if}
									{/each}
								{/if}
							{/if}
						{/if}
					</tbody>
				</table>
				</div>
			</div>
		{/if}
</div>
