import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		include: {
			subgoals: { take: 1 },
			stakeholders: { take: 1 },
			cycles: { orderBy: { startDate: 'desc' }, take: 1 }
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0] ?? null;
	const subgoal = objective.subgoals[0] ?? null;
	const stakeholder = objective.stakeholders[0] ?? null;

	return {
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description
		},
		subgoal: subgoal
			? {
					id: subgoal.id,
					label: subgoal.label,
					description: subgoal.description
				}
			: null,
		cycle: cycle
			? {
					id: cycle.id,
					label: cycle.label,
					startDate: cycle.startDate.toISOString(),
					endDate: cycle.endDate?.toISOString() ?? null
				}
			: null,
		stakeholder: stakeholder
			? {
					id: stakeholder.id,
					name: stakeholder.name,
					email: stakeholder.email,
					relationship: stakeholder.relationship
				}
			: null
	};
};
