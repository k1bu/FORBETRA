import prisma from '$lib/server/prisma';
import { computeWeekNumber } from '$lib/server/coachUtils';

export async function getActiveObjectiveWithCycle(userId: string) {
	const objective = await prisma.objective.findFirst({
		where: { userId, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { where: { active: true }, orderBy: { createdAt: 'asc' } },
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
				orderBy: { createdAt: 'asc' }
			}
		}
	});

	if (!objective) return null;

	const cycle = objective.cycles[0] ?? null;
	const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

	return { objective, cycle, currentWeek };
}
