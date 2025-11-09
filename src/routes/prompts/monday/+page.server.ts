import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { getIntentionPromptForWeek } from '$lib/prompts/intention';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const intentionSchema = z.object({
	subgoalId: z.string({ required_error: 'Choose a focus area' }),
	intention: z
		.string({ required_error: 'Intention is required' })
		.trim()
		.min(25, 'Aim for at least 25 characters to clarify your intention')
		.max(1500, 'Keep intentions under 1500 characters')
});

const computeWeekNumber = (startDate: Date) => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			cycles: { orderBy: { startDate: 'desc' }, take: 1 },
			subgoals: { orderBy: { createdAt: 'asc' } }
		}
	});

	if (!objective || objective.subgoals.length === 0) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0];

	if (!cycle) {
		throw redirect(303, '/onboarding');
	}

	const weekNumber = computeWeekNumber(cycle.startDate);
	const prompt = getIntentionPromptForWeek(weekNumber);

	const existing = await prisma.reflection.findFirst({
		where: {
			cycleId: cycle.id,
			userId: dbUser.id,
			reflectionType: 'INTENTION',
			weekNumber
		}
	});

	return {
		prompt,
		cycle: {
			id: cycle.id,
			label: cycle.label ?? 'Cycle',
			startDate: cycle.startDate.toISOString()
		},
		subgoals: objective.subgoals.map((subgoal) => ({
			id: subgoal.id,
			label: subgoal.label
		})),
		weekNumber,
		existing: existing
			? {
					id: existing.id,
					subgoalId: existing.subgoalId,
					intention: existing.notes ?? ''
				}
			: null
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const objective = await prisma.objective.findFirst({
			where: { userId: dbUser.id, active: true },
			orderBy: { createdAt: 'desc' },
			include: {
				cycles: { orderBy: { startDate: 'desc' }, take: 1 }
			}
		});

		const cycle = objective?.cycles[0];

		if (!cycle) {
			return fail(400, { error: 'No active cycle found. Complete onboarding first.' });
		}

		const formData = await event.request.formData();
		const values = Object.fromEntries(formData) as Record<string, string>;
		const parsed = intentionSchema.safeParse(values);

		if (!parsed.success) {
			const errors = parsed.error.flatten();
			return fail(400, {
				error: errors.fieldErrors.intention?.[0] ?? 'Invalid submission',
				values
			});
		}

		const data = parsed.data;
		const weekNumber = computeWeekNumber(cycle.startDate);

		try {
			await prisma.reflection.upsert({
				where: {
					cycleId_weekNumber_reflectionType_subgoalId: {
						cycleId: cycle.id,
						weekNumber,
						reflectionType: 'INTENTION',
						subgoalId: data.subgoalId
					}
				},
				update: {
					notes: data.intention,
					submittedAt: new Date(),
					checkInDate: new Date()
				},
				create: {
					cycleId: cycle.id,
					userId: dbUser.id,
					subgoalId: data.subgoalId,
					reflectionType: 'INTENTION',
					weekNumber,
					notes: data.intention,
					checkInDate: new Date()
				}
			});

			return { success: true };
		} catch (error) {
			console.error('Failed to save intention prompt', error);
			return fail(500, { error: 'Unable to save your intention. Please try again.' });
		}
	}
};
