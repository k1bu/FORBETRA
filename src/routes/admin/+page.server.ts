import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');

	const [
		userCounts,
		objectiveCount,
		activeCycleCount,
		reflectionCount,
		feedbackCount,
		stakeholderCount,
		recentUsers,
		recentReflections,
		recentFeedback
	] = await Promise.all([
		prisma.user.groupBy({
			by: ['role'],
			_count: { id: true }
		}),
		prisma.objective.count(),
		prisma.cycle.count({ where: { status: 'ACTIVE' } }),
		prisma.reflection.count(),
		prisma.feedback.count(),
		prisma.stakeholder.count(),
		prisma.user.findMany({
			orderBy: { createdAt: 'desc' },
			take: 5,
			select: { id: true, name: true, email: true, role: true, createdAt: true }
		}),
		prisma.reflection.findMany({
			orderBy: { submittedAt: 'desc' },
			take: 5,
			select: {
				id: true,
				reflectionType: true,
				weekNumber: true,
				submittedAt: true,
				user: { select: { name: true, email: true } }
			}
		}),
		prisma.feedback.findMany({
			orderBy: { submittedAt: 'desc' },
			take: 5,
			select: {
				id: true,
				submittedAt: true,
				stakeholder: { select: { name: true } },
				reflection: { select: { user: { select: { name: true } } } }
			}
		})
	]);

	const roleCounts: Record<string, number> = {};
	let totalUsers = 0;
	for (const entry of userCounts) {
		roleCounts[entry.role] = entry._count.id;
		totalUsers += entry._count.id;
	}

	return {
		stats: {
			totalUsers,
			roleCounts,
			objectiveCount,
			activeCycleCount,
			reflectionCount,
			feedbackCount,
			stakeholderCount
		},
		recentActivity: {
			users: recentUsers,
			reflections: recentReflections,
			feedback: recentFeedback
		}
	};
};
