import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		include: {
			subgoals: { orderBy: { createdAt: 'asc' } }, // Get all subgoals, ordered by creation
			stakeholders: { orderBy: { createdAt: 'asc' } },
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

	const subgoals = objective.subgoals;
	const stakeholders = objective.stakeholders;

	// Send welcome email to individual (only once)
	// Use total reflection count as a proxy: if only the week-0 baseline exists (count=1),
	// send the welcome. Once a real check-in exists (count>1), don't re-send.
	const reflectionCount = await prisma.reflection.count({
		where: { userId: dbUser.id }
	});

	if (reflectionCount <= 1) {
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

		// Send welcome SMS
		await trySendSms(
			dbUser.phone,
			smsTemplates.welcomeIndividual({
				individualName: dbUser.name || undefined,
				appUrl: event.url.origin
			})
		);
	}

	return {
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description
		},
		subgoals: subgoals.map((subgoal) => ({
			id: subgoal.id,
			label: subgoal.label,
			description: subgoal.description
		})),
		cycle: cycle
			? {
					id: cycle.id,
					label: cycle.label,
					startDate: cycle.startDate.toISOString(),
					endDate: cycle.endDate?.toISOString() ?? null
				}
			: null,
		stakeholders: stakeholders.map((s) => ({
			id: s.id,
			name: s.name,
			email: s.email,
			relationship: s.relationship
		}))
	};
};
