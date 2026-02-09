import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	const { dbUser } = requireAuth(event);
	const { id } = event.params;

	const body = await event.request.json();
	const thumbs = body.thumbs;

	if (thumbs !== 1 && thumbs !== -1) {
		return json({ error: 'thumbs must be 1 or -1' }, { status: 400 });
	}

	const insight = await prisma.insight.findUnique({
		where: { id },
		select: { userId: true }
	});

	if (!insight) {
		return json({ error: 'Insight not found' }, { status: 404 });
	}

	// Only the insight's user can rate it
	if (insight.userId !== dbUser.id) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	await prisma.insight.update({
		where: { id },
		data: { thumbs }
	});

	return json({ success: true });
};
