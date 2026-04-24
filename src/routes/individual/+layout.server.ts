import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { getActiveObjectiveWithCycle } from '$lib/server/individualContext';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const result = await getActiveObjectiveWithCycle(dbUser.id);

	if (!result) {
		throw redirect(303, '/onboarding');
	}

	const { objective, cycle, currentWeek } = result;

	// If objective exists with cycles and subgoals but no initial rating (week 0), redirect to initial-ratings
	// Skip this check if there are no subgoals — initial ratings require at least one subgoal
	if (cycle && objective.subgoals.length > 0) {
		const hasInitialRating = await prisma.reflection.findFirst({
			where: { userId: dbUser.id, cycleId: cycle.id, weekNumber: 0 }
		});
		if (!hasInitialRating) {
			throw redirect(303, '/onboarding/initial-ratings');
		}
	}

	return {
		dbUserId: dbUser.id,
		dbUserName: dbUser.name,
		objective,
		cycle,
		currentWeek
	};
};
