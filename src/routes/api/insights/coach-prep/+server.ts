import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { generateCoachPrep } from '$lib/server/ai/generateInsight';
import { rateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'COACH');

	if (!rateLimit(`insight:${dbUser.id}`, 5, 60_000)) {
		return json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
	}

	const body = await event.request.json();
	const individualId = (body.individualId ?? '').toString().trim();

	if (!individualId) {
		return json({ error: 'individualId is required' }, { status: 400 });
	}

	// Verify coach-client relationship
	const relationship = await prisma.coachClient.findUnique({
		where: {
			coachId_individualId: {
				coachId: dbUser.id,
				individualId
			}
		}
	});

	if (!relationship) {
		return json({ error: 'You do not have access to this client' }, { status: 403 });
	}

	// Find active cycle for individual
	const objective = await prisma.objective.findFirst({
		where: { userId: individualId, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			cycles: {
				where: { status: 'ACTIVE' },
				orderBy: { startDate: 'desc' },
				take: 1
			}
		}
	});

	if (!objective || objective.cycles.length === 0) {
		return json({ error: 'No active cycle found for this client' }, { status: 400 });
	}

	const cycle = objective.cycles[0];
	const insightId = await generateCoachPrep(dbUser.id, individualId, cycle.id);

	if (!insightId) {
		return json({ error: 'Failed to generate coach prep' }, { status: 500 });
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
