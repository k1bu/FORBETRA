import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { dbUserId, dbUserName } = await parent();

	const activeCycle = await prisma.cycle.findFirst({
		where: {
			userId: dbUserId,
			status: 'ACTIVE'
		},
		select: { id: true }
	});

	return {
		userName: dbUserName || 'there',
		hasActiveCycle: !!activeCycle
	};
};
