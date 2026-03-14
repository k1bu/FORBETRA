import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

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

	// History data: reflections grouped by week (merged from history page)
	type HistoryWeek = {
		weekNumber: number;
		reflections: Array<{
			id: string;
			type: string;
			effortScore: number | null;
			performanceScore: number | null;
			notes: string | null;
			checkInDate: string;
		}>;
	};
	let historyWeeks: HistoryWeek[] = [];

	if (cycle) {
		const historyWeekMap = new Map<number, HistoryWeek['reflections']>();
		for (const r of cycle.reflections) {
			if (!historyWeekMap.has(r.weekNumber)) {
				historyWeekMap.set(r.weekNumber, []);
			}
			historyWeekMap.get(r.weekNumber)!.push({
				id: r.id,
				type: r.reflectionType,
				effortScore: r.effortScore,
				performanceScore: r.performanceScore,
				notes: r.notes,
				checkInDate: r.submittedAt?.toISOString() ?? new Date().toISOString()
			});
		}
		historyWeeks = Array.from(historyWeekMap.entries())
			.map(([weekNumber, reflections]) => ({ weekNumber, reflections }))
			.sort((a, b) => b.weekNumber - a.weekNumber);
	}

	return {
		objective: {
			id: objective.id,
			title: objective.title
		},
		correlationData,
		gapLensData,
		cycleReport,
		historyWeeks
	};
};
