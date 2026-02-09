import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { generateCycleReport } from '$lib/server/ai/generateInsight';

export const POST: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1
			}
		}
	});

	if (!objective || objective.cycles.length === 0) {
		return json({ error: 'No active cycle found' }, { status: 400 });
	}

	const cycle = objective.cycles[0];
	const insightId = await generateCycleReport(dbUser.id, cycle.id);

	if (!insightId) {
		return json({ error: 'Failed to generate report' }, { status: 500 });
	}

	const insight = await prisma.insight.findUnique({
		where: { id: insightId },
		select: { id: true, content: true, createdAt: true }
	});

	return json({
		id: insight?.id,
		content: insight?.content ?? null,
		createdAt: insight?.createdAt?.toISOString()
	});
};
