import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		include: {
			subgoals: { take: 1 },
			stakeholders: { take: 1 },
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						where: { weekNumber: 0 },
						take: 1
					}
				}
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	// Check if initial ratings are missing - redirect to initial-ratings if so
	const cycle = objective.cycles[0] ?? null;
	const firstSubgoal = objective.subgoals[0];
	if (cycle && firstSubgoal) {
		const hasInitialRating = cycle.reflections.some((r) => r.weekNumber === 0);
		if (!hasInitialRating) {
			throw redirect(303, '/onboarding/initial-ratings');
		}
	}

	const subgoal = objective.subgoals[0] ?? null;
	const stakeholder = objective.stakeholders[0] ?? null;

	// Send welcome email to individual (only once, check if we've sent it before)
	// We can check if this is the first time they're seeing this page by checking if they have any reflections
	const hasReflections = await prisma.reflection.findFirst({
		where: { userId: dbUser.id },
		select: { id: true }
	});

	if (!hasReflections) {
		try {
			const template = emailTemplates.welcomeIndividual({
				individualName: dbUser.name || undefined,
				appUrl: event.url.origin
			});
			await sendEmail({
				to: dbUser.email,
				...template
			});
		} catch (error) {
			console.error('[email:error] Failed to send welcome email', error);
			// Don't fail the request if email fails
		}
	}

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
