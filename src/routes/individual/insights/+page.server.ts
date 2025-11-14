import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

const stdDev = (values: number[]) => {
	if (values.length === 0) return null;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const variance =
		values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
	return Math.sqrt(variance);
};

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
							progressScore: true,
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
						take: 1,
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
			intention: boolean;
			effortScores: number[];
			progressScores: number[];
		}
	>();

	if (cycle) {
		cycle.reflections.forEach((reflection) => {
			const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
				weekNumber: reflection.weekNumber,
				intention: false,
				effortScores: [],
				progressScores: []
			};
			if (reflection.reflectionType === 'INTENTION') {
				weekEntry.intention = true;
			}
			if (reflection.reflectionType === 'EFFORT' || reflection.reflectionType === 'PROGRESS') {
				if (reflection.effortScore !== null) {
					weekEntry.effortScores.push(reflection.effortScore);
				}
				if (reflection.progressScore !== null) {
					weekEntry.progressScores.push(reflection.progressScore);
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
						(week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length).toFixed(
							1
						)
					)
				: null;
		if (effortAverage !== null) {
			trendEffortSum += effortAverage;
			trendEffortCount += 1;
		}

		const progressAverage =
			week.progressScores.length > 0
				? Number(
						(
							week.progressScores.reduce((sum, score) => sum + score, 0) /
							week.progressScores.length
						).toFixed(1)
					)
				: null;
		if (progressAverage !== null) {
			trendProgressSum += progressAverage;
			trendProgressCount += 1;
		}

		return {
			weekNumber: week.weekNumber,
			intentionSubmitted: week.intention,
			effortScore: effortAverage,
			progressScore: progressAverage
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
		.map((week) => week.progressScore)
		.filter((value): value is number => value !== null);

	const effortStd = stdDev(effortSeries);
	const progressStd = stdDev(progressSeries);

	const stdValues = [effortStd, progressStd].filter((value): value is number => value !== null);
	const combinedStd =
		stdValues.length > 0
			? stdValues.reduce((sum, value) => sum + value, 0) / stdValues.length
			: null;
	const consistencyScore =
		combinedStd !== null ? Math.max(0, Math.round(100 - combinedStd * 10)) : null;

	let respondedThisWeek = 0;
	if (currentWeek) {
		objective.stakeholders.forEach((stakeholder) => {
			const latestFeedback = stakeholder.feedbacks[0] ?? null;
			const latestReflectionWeek = latestFeedback?.reflection?.weekNumber ?? null;
			const isCurrentWeekResponse =
				currentWeek !== null && latestReflectionWeek === currentWeek && !!latestFeedback?.submittedAt;

			if (isCurrentWeekResponse) {
				respondedThisWeek += 1;
			}
		});
	}

	const alignmentRatio =
		objective.stakeholders.length > 0 ? respondedThisWeek / objective.stakeholders.length : null;

	return {
		objective: {
			id: objective.id,
			title: objective.title
		},
		reflectionTrend: reflectionTrendSummary,
		insights: {
			avgEffort: reflectionTrendSummary.avgEffort,
			avgProgress: reflectionTrendSummary.avgProgress,
			consistencyScore,
			alignmentRatio
		}
	};
};

