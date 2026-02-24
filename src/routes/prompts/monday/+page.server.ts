import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { getIntentionPromptForWeek } from '$lib/prompts/intention';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { computeWeekNumber } from '$lib/server/coachUtils';

const intentionSchema = z.object({
	intention: z
		.string({ error: 'Intention is required' })
		.trim()
		.min(25, 'Aim for at least 25 characters to clarify your intention')
		.max(1500, 'Keep intentions under 1500 characters')
});

export const load: PageServerLoad = async (event) => {
	const isPreview = event.url.searchParams.get('preview') === 'true';
	const { dbUser } = requireRole(event, isPreview ? ['INDIVIDUAL', 'ADMIN'] : 'INDIVIDUAL');

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

	// Get coach notes for this user and cycle/week
	const coachNotes = await prisma.coachNote.findMany({
		where: {
			individualId: dbUser.id,
			cycleId: cycle.id,
			OR: [
				{ weekNumber: weekNumber },
				{ weekNumber: null } // General notes (no specific week)
			]
		},
		orderBy: { createdAt: 'desc' },
		include: {
			coach: {
				select: {
					name: true
				}
			}
		}
	});

	return {
		prompt,
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description
		},
		cycle: {
			id: cycle.id,
			label: cycle.label ?? 'Cycle',
			startDate: cycle.startDate.toISOString()
		},
		subgoals: objective.subgoals.map((subgoal) => ({
			id: subgoal.id,
			label: subgoal.label,
			description: subgoal.description
		})),
		weekNumber,
		existing: existing
			? {
					id: existing.id,
					intention: existing.notes ?? ''
				}
			: null,
		coachNotes: coachNotes.map((note) => ({
			id: note.id,
			content: note.content,
			coachName: note.coach.name ?? 'Your coach',
			createdAt: note.createdAt.toISOString()
		}))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const objective = await prisma.objective.findFirst({
			where: { userId: dbUser.id, active: true },
			orderBy: { createdAt: 'desc' },
			include: {
				cycles: { orderBy: { startDate: 'desc' }, take: 1 },
				subgoals: { orderBy: { createdAt: 'asc' }, take: 1 }
			}
		});

		if (!objective) {
			return fail(400, { error: 'No active objective found. Complete onboarding first.' });
		}

		const cycle = objective.cycles[0];

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

		// Get the first subgoal to use as default (intentions are objective-level, not subgoal-specific)
		const firstSubgoal = objective.subgoals[0];

		if (!firstSubgoal) {
			return fail(400, { error: 'No sub-objectives found. Please complete onboarding first.' });
		}

		try {
			await prisma.reflection.upsert({
				where: {
					cycleId_weekNumber_reflectionType_subgoalId: {
						cycleId: cycle.id,
						weekNumber,
						reflectionType: 'INTENTION',
						subgoalId: firstSubgoal.id
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
					subgoalId: firstSubgoal.id,
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
