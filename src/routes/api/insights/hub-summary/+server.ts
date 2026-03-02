import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { generateWeeklySynthesis } from '$lib/server/ai/generateInsight';
import { computeWeekNumber } from '$lib/server/coachUtils';
import { rateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	if (!rateLimit(`insight:${dbUser.id}`, 5, 60_000)) {
		return json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
	}

	// Get active cycle
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
	const currentWeek = computeWeekNumber(cycle.startDate);

	const insightId = await generateWeeklySynthesis(dbUser.id, cycle.id, currentWeek);

	if (!insightId) {
		return json({ error: 'Failed to generate insight' }, { status: 500 });
	}

	// Fetch the generated insight content
	const insight = await prisma.insight.findUnique({
		where: { id: insightId },
		select: { id: true, content: true, type: true, weekNumber: true, createdAt: true }
	});

	return json({
		id: insight?.id,
		content: insight?.content ?? null,
		type: insight?.type,
		weekNumber: insight?.weekNumber,
		createdAt: insight?.createdAt?.toISOString()
	});
};
