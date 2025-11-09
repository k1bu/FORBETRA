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

		const recentReflections =
			cycle?.reflections.map((reflection) => ({
				id: reflection.id,
				weekNumber: reflection.weekNumber,
				reflectionType: reflection.reflectionType,
				submittedAt: reflection.submittedAt?.toISOString() ?? null,
				effortScore: reflection.effortScore,
				progressScore: reflection.progressScore,
				notes: reflection.notes ?? ''
			})) ?? [];

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
									recentReflections
								}
							: null,
						subgoalCount: objective.subgoals.length,
						stakeholderCount: stakeholders.length,
						respondedStakeholders
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
