import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const activeCycle = await prisma.cycle.findFirst({
		where: {
			userId: dbUser.id,
			status: 'ACTIVE'
		},
		select: { id: true }
	});

	return {
		userName: dbUser.name || 'there',
		hasActiveCycle: !!activeCycle
	};
};
