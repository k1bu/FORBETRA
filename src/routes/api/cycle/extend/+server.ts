import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const body = await event.request.json();
	const cycleId = body.cycleId as string;
	const weeks = body.weeks as number ?? 4;

	if (!cycleId) {
		return json({ error: 'cycleId is required' }, { status: 400 });
	}

	if (weeks < 1 || weeks > 12) {
		return json({ error: 'weeks must be between 1 and 12' }, { status: 400 });
	}

	const cycle = await prisma.cycle.findFirst({
		where: { id: cycleId, userId: dbUser.id }
	});

	if (!cycle) {
		return json({ error: 'Cycle not found' }, { status: 404 });
	}

	const currentEnd = cycle.endDate ?? new Date();
	const newEnd = new Date(currentEnd);
	newEnd.setDate(newEnd.getDate() + weeks * 7);

	await prisma.cycle.update({
		where: { id: cycleId },
		data: { endDate: newEnd }
	});

	return json({ success: true, newEndDate: newEnd.toISOString() });
};
