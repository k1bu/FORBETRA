import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { onboardingSchema } from '$lib/validation/onboarding';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const existingObjective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		select: { id: true }
	});

	if (existingObjective) {
		throw redirect(303, '/onboarding/complete');
	}

	return {
		user: {
			name: dbUser.name,
			email: dbUser.email
		},
		defaults: {
			startDate: new Date().toISOString().slice(0, 10),
			durationWeeks: 12
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const submission = Object.fromEntries(formData) as Record<string, string>;

		const parsed = onboardingSchema.safeParse(submission);

		if (!parsed.success) {
			const errors = parsed.error.flatten();

			return fail(400, {
				errors: errors.fieldErrors,
				values: submission
			});
		}

		const data = parsed.data;

		await prisma.$transaction(async (tx) => {
			const objective = await tx.objective.create({
				data: {
					userId: dbUser.id,
					title: data.objectiveTitle,
					description: data.objectiveDescription ?? null
				}
			});

			await tx.subgoal.create({
				data: {
					objectiveId: objective.id,
					label: data.subgoalLabel,
					description: data.subgoalDescription ?? null
				}
			});

			if (data.stakeholderEmail && data.stakeholderName) {
				await tx.stakeholder.create({
					data: {
						individualId: dbUser.id,
						objectiveId: objective.id,
						name: data.stakeholderName,
						email: data.stakeholderEmail,
						relationship: data.stakeholderRelationship ?? null
					}
				});
			}

			const startDate = new Date(data.cycleStartDate);
			const endDate = new Date(startDate);
			endDate.setDate(endDate.getDate() + data.cycleDurationWeeks * 7);

			await tx.cycle.create({
				data: {
					userId: dbUser.id,
					objectiveId: objective.id,
					label: data.cycleLabel && data.cycleLabel.length > 0 ? data.cycleLabel : 'Cycle 1',
					startDate,
					endDate,
					status: 'ACTIVE'
				}
			});
		});

		throw redirect(303, '/onboarding/complete');
	}
};
