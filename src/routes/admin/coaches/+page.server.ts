import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');

	const [coachClients, coachInvites] = await Promise.all([
		prisma.coachClient.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				coach: { select: { id: true, name: true, email: true } },
				individual: { select: { id: true, name: true, email: true } }
			}
		}),
		prisma.coachInvite.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				coach: { select: { id: true, name: true, email: true } },
				individual: { select: { id: true, name: true, email: true } }
			}
		})
	]);

	return { coachClients, coachInvites };
};
