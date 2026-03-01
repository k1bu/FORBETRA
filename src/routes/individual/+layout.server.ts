import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const checkInCount = await prisma.reflection.count({
		where: { userId: dbUser.id }
	});

	const maturityStage: 'new' | 'growing' | 'established' =
		checkInCount >= 12 ? 'established' : checkInCount >= 4 ? 'growing' : 'new';

	return { maturityStage, checkInCount };
};
