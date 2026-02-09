import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');

	const [insights, typeCounts, statusCounts, thumbsCounts] = await Promise.all([
		prisma.insight.findMany({
			orderBy: { createdAt: 'desc' },
			take: 50,
			select: {
				id: true,
				type: true,
				status: true,
				weekNumber: true,
				thumbs: true,
				modelId: true,
				createdAt: true,
				content: true,
				user: { select: { id: true, name: true, email: true } }
			}
		}),
		prisma.insight.groupBy({
			by: ['type'],
			_count: { id: true }
		}),
		prisma.insight.groupBy({
			by: ['status'],
			_count: { id: true }
		}),
		prisma.insight.groupBy({
			by: ['thumbs'],
			_count: { id: true }
		})
	]);

	const totalInsights = typeCounts.reduce((sum, t) => sum + t._count.id, 0);

	const typeBreakdown: Record<string, number> = {};
	for (const entry of typeCounts) {
		typeBreakdown[entry.type] = entry._count.id;
	}

	const statusBreakdown: Record<string, number> = {};
	for (const entry of statusCounts) {
		statusBreakdown[entry.status] = entry._count.id;
	}

	let thumbsUp = 0;
	let thumbsDown = 0;
	let thumbsNone = 0;
	for (const entry of thumbsCounts) {
		if (entry.thumbs === 1) thumbsUp = entry._count.id;
		else if (entry.thumbs === -1) thumbsDown = entry._count.id;
		else thumbsNone = entry._count.id;
	}

	return {
		insights,
		stats: {
			totalInsights,
			typeBreakdown,
			statusBreakdown,
			thumbsUp,
			thumbsDown,
			thumbsNone,
			successRate:
				totalInsights > 0
					? Math.round(
							((statusBreakdown['COMPLETED'] ?? 0) / totalInsights) * 100
						)
					: 0
		}
	};
};
