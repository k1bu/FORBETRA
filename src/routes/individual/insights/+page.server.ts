import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { stdDev } from '$lib/server/coachUtils';
import { findSignificantGaps, type PerceptionGap } from '$lib/utils/gapNarrative';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true,
							submittedAt: true,
							effortScore: true,
							performanceScore: true,
							notes: true
						}
					}
				}
			},
			stakeholders: {
				orderBy: { createdAt: 'asc' },
				include: {
					feedbacks: {
						orderBy: { submittedAt: 'desc' },
						include: {
							reflection: {
								select: {
									weekNumber: true
								}
							}
						}
					}
				}
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0] ?? null;

	// Fetch all feedbacks for visualizations (needed for correlation and gap lens)
	const allFeedbacks = cycle
		? await prisma.feedback.findMany({
				where: {
					reflection: {
						cycleId: cycle.id
					}
				},
				include: {
					reflection: {
						select: {
							weekNumber: true
						}
					},
					stakeholder: {
						select: {
							id: true,
							name: true
						}
					}
				}
			})
		: [];
	const currentTime = new Date();
	const currentWeek = cycle
		? Math.max(
				1,
				Math.floor((currentTime.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
			)
		: null;

	const reflectionTrendMap = new Map<
		number,
		{
			weekNumber: number;
			effortScores: number[];
			performanceScores: number[];
		}
	>();

	if (cycle) {
		cycle.reflections.forEach((reflection) => {
			const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
				weekNumber: reflection.weekNumber,
				effortScores: [],
				performanceScores: []
			};
			if (reflection.reflectionType === 'RATING_A' || reflection.reflectionType === 'RATING_B') {
				if (reflection.effortScore !== null) {
					weekEntry.effortScores.push(reflection.effortScore);
				}
				if (reflection.performanceScore !== null) {
					weekEntry.performanceScores.push(reflection.performanceScore);
				}
			}
			reflectionTrendMap.set(reflection.weekNumber, weekEntry);
		});
	}

	const trendWeeks = Array.from(reflectionTrendMap.values())
		.sort((a, b) => b.weekNumber - a.weekNumber)
		.slice(0, 4);

	let trendEffortSum = 0;
	let trendEffortCount = 0;
	let trendProgressSum = 0;
	let trendProgressCount = 0;

	const reflectionTrend = trendWeeks.map((week) => {
		const effortAverage =
			week.effortScores.length > 0
				? Number(
						(
							week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length
						).toFixed(1)
					)
				: null;
		if (effortAverage !== null) {
			trendEffortSum += effortAverage;
			trendEffortCount += 1;
		}

		const progressAverage =
			week.performanceScores.length > 0
				? Number(
						(
							week.performanceScores.reduce((sum, score) => sum + score, 0) /
							week.performanceScores.length
						).toFixed(1)
					)
				: null;
		if (progressAverage !== null) {
			trendProgressSum += progressAverage;
			trendProgressCount += 1;
		}

		return {
			weekNumber: week.weekNumber,
			effortScore: effortAverage,
			performanceScore: progressAverage
		};
	});

	const reflectionTrendSummary = {
		weeks: reflectionTrend,
		avgEffort: trendEffortCount > 0 ? Number((trendEffortSum / trendEffortCount).toFixed(1)) : null,
		avgProgress:
			trendProgressCount > 0 ? Number((trendProgressSum / trendProgressCount).toFixed(1)) : null
	};

	const effortSeries = reflectionTrend
		.map((week) => week.effortScore)
		.filter((value): value is number => value !== null);
	const progressSeries = reflectionTrend
		.map((week) => week.performanceScore)
		.filter((value): value is number => value !== null);

	const effortStd = stdDev(effortSeries);
	const progressStd = stdDev(progressSeries);

	const stdValues = [effortStd, progressStd].filter((value): value is number => value !== null);
	const combinedStd =
		stdValues.length > 0
			? stdValues.reduce((sum, value) => sum + value, 0) / stdValues.length
			: null;
	const stabilityScore =
		combinedStd !== null ? Math.max(0, Math.round(100 - combinedStd * 10)) : null;

	// Trajectory: linear regression slope of last 4 weeks combined effort+performance
	let trajectoryScore: number | null = null;
	if (trendWeeks.length >= 2) {
		const points: { x: number; y: number }[] = [];
		for (const week of trendWeeks) {
			const effortAvg =
				week.effortScores.length > 0
					? week.effortScores.reduce((s, v) => s + v, 0) / week.effortScores.length
					: null;
			const perfAvg =
				week.performanceScores.length > 0
					? week.performanceScores.reduce((s, v) => s + v, 0) / week.performanceScores.length
					: null;
			const vals = [effortAvg, perfAvg].filter((v): v is number => v !== null);
			if (vals.length > 0) {
				points.push({ x: week.weekNumber, y: vals.reduce((a, b) => a + b, 0) / vals.length });
			}
		}
		if (points.length >= 2) {
			const n = points.length;
			const sumX = points.reduce((s, p) => s + p.x, 0);
			const sumY = points.reduce((s, p) => s + p.y, 0);
			const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
			const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
			const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
			trajectoryScore = Math.max(-100, Math.min(100, Math.round(slope * 25)));
		}
	}

	let respondedThisWeek = 0;
	if (currentWeek) {
		objective.stakeholders.forEach((stakeholder) => {
			const latestFeedback = stakeholder.feedbacks[0] ?? null;
			const latestReflectionWeek = latestFeedback?.reflection?.weekNumber ?? null;
			const isCurrentWeekResponse =
				currentWeek !== null &&
				latestReflectionWeek === currentWeek &&
				!!latestFeedback?.submittedAt;

			if (isCurrentWeekResponse) {
				respondedThisWeek += 1;
			}
		});
	}

	const alignmentRatio =
		objective.stakeholders.length > 0 ? respondedThisWeek / objective.stakeholders.length : null;

	// Prepare data for Correlation View and Gap Lens
	let correlationData: {
		individual: Array<{ effort: number; progress: number; weekNumber: number }>;
		stakeholders: Array<{
			effort: number;
			progress: number;
			weekNumber: number;
			stakeholderName: string;
		}>;
	} | null = null;

	let gapLensData: {
		effort: Array<{ weekNumber: number; difference: number }>;
		performance: Array<{ weekNumber: number; difference: number }>;
		stakeholders: Array<{
			id: string;
			name: string;
			effortGaps: Array<{ weekNumber: number; difference: number }>;
			performanceGaps: Array<{ weekNumber: number; difference: number }>;
		}>;
	} | null = null;

	if (cycle) {
		// Build individual weekly data
		const allReflectionWeeks = Array.from(reflectionTrendMap.values()).sort(
			(a, b) => a.weekNumber - b.weekNumber
		);

		const individualWeeklyData = allReflectionWeeks.map((week) => {
			const effortAverage =
				week.effortScores.length > 0
					? Number(
							(
								week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length
							).toFixed(1)
						)
					: null;
			const progressAverage =
				week.performanceScores.length > 0
					? Number(
							(
								week.performanceScores.reduce((sum, score) => sum + score, 0) /
								week.performanceScores.length
							).toFixed(1)
						)
					: null;

			return {
				weekNumber: week.weekNumber,
				effortScore: effortAverage,
				performanceScore: progressAverage
			};
		});

		// Prepare correlation data (only weeks with both effort and progress)
		const individualCorrelation = individualWeeklyData
			.filter((week) => week.effortScore !== null && week.performanceScore !== null)
			.map((week) => ({
				effort: week.effortScore!,
				progress: week.performanceScore!,
				weekNumber: week.weekNumber
			}));

		// Prepare stakeholder correlation data (exclude Week 13)
		const stakeholderCorrelation: Array<{
			effort: number;
			progress: number;
			weekNumber: number;
			stakeholderName: string;
		}> = [];

		allFeedbacks.forEach((feedback) => {
			if (
				feedback.reflection &&
				feedback.effortScore !== null &&
				feedback.performanceScore !== null
			) {
				stakeholderCorrelation.push({
					effort: feedback.effortScore,
					progress: feedback.performanceScore,
					weekNumber: feedback.reflection.weekNumber,
					stakeholderName: feedback.stakeholder.name
				});
			}
		});

		correlationData = {
			individual: individualCorrelation,
			stakeholders: stakeholderCorrelation
		};

		// Prepare Gap Lens data (Self - Stakeholder difference)
		// Average gap across all stakeholders
		const gapLensEffort: Array<{ weekNumber: number; difference: number }> = [];
		const gapLensPerformance: Array<{ weekNumber: number; difference: number }> = [];

		// Per-stakeholder gaps
		const gapLensEffortByStakeholder: Map<
			string,
			Array<{ weekNumber: number; difference: number }>
		> = new Map();
		const gapLensPerformanceByStakeholder: Map<
			string,
			Array<{ weekNumber: number; difference: number }>
		> = new Map();

		// Group stakeholder feedbacks by week and calculate averages
		const stakeholderWeeklyMap = new Map<
			number,
			{
				effortScores: number[];
				performanceScores: number[];
			}
		>();

		// Group by stakeholder for individual gap calculations
		const stakeholderFeedbackMap = new Map<
			string,
			Array<{ weekNumber: number; effortScore: number | null; performanceScore: number | null }>
		>();

		allFeedbacks.forEach((feedback) => {
			if (feedback.reflection) {
				const weekNumber = feedback.reflection.weekNumber;
				const stakeholderId = feedback.stakeholder.id;

				// For average calculation
				if (!stakeholderWeeklyMap.has(weekNumber)) {
					stakeholderWeeklyMap.set(weekNumber, { effortScores: [], performanceScores: [] });
				}
				const weekData = stakeholderWeeklyMap.get(weekNumber)!;
				if (feedback.effortScore !== null) {
					weekData.effortScores.push(feedback.effortScore);
				}
				if (feedback.performanceScore !== null) {
					weekData.performanceScores.push(feedback.performanceScore);
				}

				// For per-stakeholder calculation
				if (!stakeholderFeedbackMap.has(stakeholderId)) {
					stakeholderFeedbackMap.set(stakeholderId, []);
				}
				stakeholderFeedbackMap.get(stakeholderId)!.push({
					weekNumber,
					effortScore: feedback.effortScore,
					performanceScore: feedback.performanceScore
				});

				// Initialize per-stakeholder gap arrays
				if (!gapLensEffortByStakeholder.has(stakeholderId)) {
					gapLensEffortByStakeholder.set(stakeholderId, []);
				}
				if (!gapLensPerformanceByStakeholder.has(stakeholderId)) {
					gapLensPerformanceByStakeholder.set(stakeholderId, []);
				}
			}
		});

		// Calculate average gaps for each week
		individualWeeklyData.forEach((week) => {
			const stakeholderWeekData = stakeholderWeeklyMap.get(week.weekNumber);
			if (stakeholderWeekData) {
				if (week.effortScore !== null && stakeholderWeekData.effortScores.length > 0) {
					const stakeholderAvg =
						stakeholderWeekData.effortScores.reduce((sum, score) => sum + score, 0) /
						stakeholderWeekData.effortScores.length;
					gapLensEffort.push({
						weekNumber: week.weekNumber,
						difference: Number((week.effortScore - stakeholderAvg).toFixed(1))
					});
				}
				if (week.performanceScore !== null && stakeholderWeekData.performanceScores.length > 0) {
					const stakeholderAvg =
						stakeholderWeekData.performanceScores.reduce((sum, score) => sum + score, 0) /
						stakeholderWeekData.performanceScores.length;
					gapLensPerformance.push({
						weekNumber: week.weekNumber,
						difference: Number((week.performanceScore - stakeholderAvg).toFixed(1))
					});
				}
			}

			// Calculate per-stakeholder gaps
			stakeholderFeedbackMap.forEach((feedbacks, stakeholderId) => {
				const weekFeedback = feedbacks.find((f) => f.weekNumber === week.weekNumber);
				if (weekFeedback) {
					// Effort gap for this stakeholder
					if (week.effortScore !== null && weekFeedback.effortScore !== null) {
						const gapArray = gapLensEffortByStakeholder.get(stakeholderId)!;
						gapArray.push({
							weekNumber: week.weekNumber,
							difference: Number((week.effortScore - weekFeedback.effortScore).toFixed(1))
						});
					}
					// Performance gap for this stakeholder
					if (week.performanceScore !== null && weekFeedback.performanceScore !== null) {
						const gapArray = gapLensPerformanceByStakeholder.get(stakeholderId)!;
						gapArray.push({
							weekNumber: week.weekNumber,
							difference: Number((week.performanceScore - weekFeedback.performanceScore).toFixed(1))
						});
					}
				}
			});
		});

		// Sort by week number
		gapLensEffort.sort((a, b) => a.weekNumber - b.weekNumber);
		gapLensPerformance.sort((a, b) => a.weekNumber - b.weekNumber);

		// Sort per-stakeholder gaps
		gapLensEffortByStakeholder.forEach((gaps) => gaps.sort((a, b) => a.weekNumber - b.weekNumber));
		gapLensPerformanceByStakeholder.forEach((gaps) =>
			gaps.sort((a, b) => a.weekNumber - b.weekNumber)
		);

		// Build stakeholder list with their gap data
		const stakeholdersWithGaps = objective.stakeholders.map((stakeholder) => {
			const effortGaps = gapLensEffortByStakeholder.get(stakeholder.id) ?? [];
			const performanceGaps = gapLensPerformanceByStakeholder.get(stakeholder.id) ?? [];
			return {
				id: stakeholder.id,
				name: stakeholder.name,
				effortGaps,
				performanceGaps
			};
		});

		gapLensData = {
			effort: gapLensEffort,
			performance: gapLensPerformance,
			stakeholders: stakeholdersWithGaps
		};
	}

	let cycleReport: {
		id: string;
		content: string | null;
		createdAt: Date;
		thumbs: number | null;
	} | null = null;
	if (cycle) {
		cycleReport = await prisma.insight.findFirst({
			where: { userId: dbUser.id, cycleId: cycle.id, status: 'COMPLETED', type: 'CYCLE_REPORT' },
			orderBy: { createdAt: 'desc' },
			select: { id: true, content: true, createdAt: true, thumbs: true }
		});
	}

	// Perception gap analysis — compare latest self-scores to rater averages
	let perceptionGaps: PerceptionGap[] = [];
	if (cycle && currentWeek) {
		const latestWeek = reflectionTrend[0]; // Most recent week
		if (latestWeek) {
			const recentFeedbacks = allFeedbacks.filter(
				(f) => f.reflection.weekNumber === latestWeek.weekNumber
			);
			if (recentFeedbacks.length > 0) {
				const raterEffortScores = recentFeedbacks
					.map((f) => f.effortScore)
					.filter((s): s is number => s != null);
				const raterPerfScores = recentFeedbacks
					.map((f) => f.performanceScore)
					.filter((s): s is number => s != null);
				const raterEffortAvg =
					raterEffortScores.length > 0
						? raterEffortScores.reduce((a, b) => a + b, 0) / raterEffortScores.length
						: null;
				const raterPerfAvg =
					raterPerfScores.length > 0
						? raterPerfScores.reduce((a, b) => a + b, 0) / raterPerfScores.length
						: null;

				perceptionGaps = findSignificantGaps(
					latestWeek.effortScore,
					latestWeek.performanceScore,
					raterEffortAvg,
					raterPerfAvg
				);
			}
		}
	}

	return {
		objective: {
			id: objective.id,
			title: objective.title
		},
		reflectionTrend: reflectionTrendSummary,
		insights: {
			avgEffort: reflectionTrendSummary.avgEffort,
			avgProgress: reflectionTrendSummary.avgProgress,
			stabilityScore,
			trajectoryScore,
			alignmentRatio
		},
		correlationData,
		gapLensData,
		cycleReport,
		perceptionGaps
	};
};
