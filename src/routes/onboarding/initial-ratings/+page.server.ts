import { fail, redirect } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import prisma from '$lib/server/prisma';
import { checkInEntrySchema } from '$lib/validation/reflection';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');
	const isPreview = event.url.searchParams.get('preview') === 'true';

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		orderBy: { createdAt: 'desc' },
		include: {
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1
			},
			subgoals: {
				orderBy: { createdAt: 'asc' }
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0];

	if (!cycle) {
		throw redirect(303, '/onboarding');
	}

	// Check if initial ratings already exist (week 0 reflection)
	const firstSubgoal = objective.subgoals[0];
	if (!firstSubgoal) {
		throw redirect(303, '/onboarding');
	}

	const existingInitialRating = await prisma.reflection.findFirst({
		where: {
			userId: dbUser.id,
			cycleId: cycle.id,
			weekNumber: 0,
			subgoalId: firstSubgoal.id
		}
	});

	// If initial ratings exist and not in preview mode, redirect to complete
	if (existingInitialRating && !isPreview) {
		throw redirect(303, '/onboarding/complete');
	}

	return {
		isPreview,
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description ?? ''
		},
		cycle: {
			id: cycle.id,
			label: cycle.label ?? 'Cycle 1'
		},
		subgoals: objective.subgoals.map((subgoal) => ({
			id: subgoal.id,
			label: subgoal.label,
			description: subgoal.description ?? ''
		})),
		previousEntry: existingInitialRating
			? {
					id: existingInitialRating.id,
					effortScore: existingInitialRating.effortScore ?? null,
					performanceScore: existingInitialRating.performanceScore ?? null,
					notes: existingInitialRating.notes ?? ''
				}
			: null
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');
		const isPreview = event.url.searchParams.get('preview') === 'true';

		const objective = await prisma.objective.findFirst({
			where: { userId: dbUser.id },
			orderBy: { createdAt: 'desc' },
			include: {
				cycles: {
					orderBy: { startDate: 'desc' },
					take: 1
				},
				subgoals: {
					orderBy: { createdAt: 'asc' },
					take: 1
				}
			}
		});

		if (!objective || !objective.cycles[0] || !objective.subgoals[0]) {
			return fail(400, { error: 'Objective, cycle, or subgoals not found.' });
		}

		const cycle = objective.cycles[0];
		const firstSubgoal = objective.subgoals[0];

		const formData = await event.request.formData();
		const submission = Object.fromEntries(formData) as Record<string, string>;
		const parsed = checkInEntrySchema.safeParse(submission);

		if (!parsed.success) {
			const errors = parsed.error.flatten();
			return fail(400, {
				error:
					errors.fieldErrors.effortScore?.[0] ??
					errors.fieldErrors.performanceScore?.[0] ??
					'Invalid input',
				values: submission
			});
		}

		const data = parsed.data;
		// Notes are not collected for initial ratings, always set to null
		const notes = null;

		try {
			// Create reflection with weekNumber = 0 for initial ratings
			// Use RATING_B type as a placeholder (we'll treat week 0 specially in charts)
			await prisma.reflection.upsert({
				where: {
					cycleId_weekNumber_reflectionType_subgoalId: {
						cycleId: cycle.id,
						weekNumber: 0,
						reflectionType: 'RATING_B', // Using RATING_B as placeholder
						subgoalId: firstSubgoal.id
					}
				},
				update: {
					notes,
					effortScore: data.effortScore,
					performanceScore: data.performanceScore,
					submittedAt: new Date(),
					checkInDate: new Date()
				},
				create: {
					cycleId: cycle.id,
					userId: dbUser.id,
					subgoalId: firstSubgoal.id,
					reflectionType: 'RATING_B', // Using RATING_B as placeholder
					weekNumber: 0,
					effortScore: data.effortScore,
					performanceScore: data.performanceScore,
					notes,
					checkInDate: new Date()
				}
			});

			// Redirect to complete page
			throw redirect(303, '/onboarding/complete');
		} catch (error) {
			if (error instanceof Error && error.message.includes('redirect')) {
				throw error;
			}
			console.error('Failed to record initial ratings', error);
			return fail(500, { error: 'Could not save your ratings. Please try again.' });
		}
	}
};
