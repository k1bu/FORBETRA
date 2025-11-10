import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

const toIsoDate = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const weeksBetween = (start: Date, end: Date) =>
	Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));

const computeWeekNumber = (startDate: Date) => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

const weekNumberForDate = (startDate: Date, target: Date) => {
	const diff = target.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

const stdDev = (values: number[]) => {
	if (values.length === 0) return null;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const variance =
		values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
	return Math.sqrt(variance);
};

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'COACH');

	const individuals = await prisma.user.findMany({
		where: {
			role: 'INDIVIDUAL',
			coachNotesReceived: {
				some: {
					coachId: dbUser.id
				}
			}
		},
		orderBy: { createdAt: 'asc' },
		select: {
			id: true,
			email: true,
			name: true,
			objectives: {
				where: { active: true },
				orderBy: { createdAt: 'desc' },
				include: {
					subgoals: {
						orderBy: { createdAt: 'asc' }
					},
					cycles: {
						orderBy: { startDate: 'desc' },
						take: 1,
						include: {
							reflections: {
								orderBy: { submittedAt: 'desc' },
								take: 5,
								select: {
									id: true,
									weekNumber: true,
									reflectionType: true,
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
								select: {
									submittedAt: true,
									effortScore: true,
									progressScore: true
								}
							}
						}
					}
				}
			}
		}
	});

	const now = new Date();

	const clientSummaries = individuals.map((individual) => {
		const objective = individual.objectives[0] ?? null;
		const cycle = objective?.cycles[0] ?? null;
		const cycleEnd = cycle?.endDate ?? null;
		const totalWeeks = cycle && cycleEnd ? weeksBetween(cycle.startDate, cycleEnd) : 0;
		const weeksElapsed = cycle
			? Math.max(
					0,
					Math.floor((now.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
				)
			: 0;
		const completion =
			totalWeeks > 0 ? Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100)) : 0;
		const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

		const reflectionTrendMap = new Map<
			number,
			{
				weekNumber: number;
				effortScores: number[];
				progressScores: number[];
			}
		>();

		cycle?.reflections.forEach((reflection) => {
			const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
				weekNumber: reflection.weekNumber,
				effortScores: [],
				progressScores: []
			};

			if (reflection.effortScore !== null && reflection.effortScore !== undefined) {
				weekEntry.effortScores.push(reflection.effortScore);
			}
			if (reflection.progressScore !== null && reflection.progressScore !== undefined) {
				weekEntry.progressScores.push(reflection.progressScore);
			}

			reflectionTrendMap.set(reflection.weekNumber, weekEntry);
		});

		const trendWeeks = Array.from(reflectionTrendMap.values())
			.sort((a, b) => b.weekNumber - a.weekNumber)
			.slice(0, 4);

		const effortSeries: number[] = [];
		const progressSeries: number[] = [];

		const reflectionTrend = trendWeeks.map((week) => {
			const effortAverage =
				week.effortScores.length > 0
					? Number(
							(
								week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length
							).toFixed(1)
						)
					: null;
			if (effortAverage !== null) effortSeries.push(effortAverage);

			const progressAverage =
				week.progressScores.length > 0
					? Number(
							(
								week.progressScores.reduce((sum, score) => sum + score, 0) /
								week.progressScores.length
							).toFixed(1)
						)
					: null;
			if (progressAverage !== null) progressSeries.push(progressAverage);

			return {
				weekNumber: week.weekNumber,
				effortScore: effortAverage,
				progressScore: progressAverage
			};
		});

		const effortStd = stdDev(effortSeries);
		const progressStd = stdDev(progressSeries);
		const stdValues = [effortStd, progressStd].filter((value): value is number => value !== null);
		const combinedStd =
			stdValues.length > 0
				? stdValues.reduce((sum, value) => sum + value, 0) / stdValues.length
				: null;
		const consistencyScore =
			combinedStd !== null ? Math.max(0, Math.round(100 - combinedStd * 10)) : null;

		let respondedStakeholders = 0;
		const stakeholders =
			objective?.stakeholders.map((stakeholder) => {
				const lastFeedback = stakeholder.feedbacks[0] ?? null;
				let feedbackWeek: number | null = null;
				if (lastFeedback?.submittedAt && cycle) {
					feedbackWeek = weekNumberForDate(cycle.startDate, lastFeedback.submittedAt);
					if (currentWeek !== null && feedbackWeek === currentWeek) {
						respondedStakeholders += 1;
					}
				}
				return {
					id: stakeholder.id,
					name: stakeholder.name,
					email: stakeholder.email,
					lastFeedback: lastFeedback
						? {
								submittedAt: lastFeedback.submittedAt?.toISOString() ?? null,
								effortScore: lastFeedback.effortScore,
								progressScore: lastFeedback.progressScore,
								weekNumber: feedbackWeek
							}
						: null
				};
			}) ?? [];

		const alignmentRatio = objective?.stakeholders.length
			? respondedStakeholders / objective.stakeholders.length
			: null;

		const avgEffort =
			effortSeries.length > 0
				? Number(
						(effortSeries.reduce((sum, value) => sum + value, 0) / effortSeries.length).toFixed(1)
					)
				: null;
		const avgProgress =
			progressSeries.length > 0
				? Number(
						(progressSeries.reduce((sum, value) => sum + value, 0) / progressSeries.length).toFixed(
							1
						)
					)
				: null;

		return {
			id: individual.id,
			name: individual.name ?? individual.email,
			email: individual.email,
			objective: objective
				? {
						id: objective.id,
						title: objective.title,
						description: objective.description ?? '',
						cycle: cycle
							? {
									id: cycle.id,
									label: cycle.label ?? 'Cycle',
									startDate: toIsoDate(cycle.startDate),
									endDate: toIsoDate(cycle.endDate ?? null),
									status: cycle.status,
									completion,
									weeksElapsed,
									currentWeek: currentWeek ?? null,
									recentReflections: reflectionTrend
								}
							: null,
						subgoalCount: objective.subgoals.length,
						stakeholderCount: stakeholders.length,
						respondedStakeholders,
						insights: cycle
							? {
									avgEffort,
									avgProgress,
									consistencyScore,
									alignmentRatio
								}
							: null
					}
				: null,
			stakeholders
		};
	});

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		clients: clientSummaries
	};
};
