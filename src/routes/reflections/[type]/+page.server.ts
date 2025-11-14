import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { reflectionEntrySchema } from '$lib/validation/reflection';
import type { Actions, PageServerLoad } from './$types';
import type { ReflectionType } from '@prisma/client';

const typeMap: Record<string, ReflectionType> = {
	effort: 'EFFORT',
	progress: 'PROGRESS'
};

const ensureType = (param: string | undefined) => {
	if (!param) return null;
	const normalized = param.toLowerCase();
	return typeMap[normalized] ?? null;
};

// Helper to compute week number from start date
const computeWeekNumber = (startDate: Date): number => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

export const load: PageServerLoad = async (event) => {
	const reflectionType = ensureType(event.params.type);

	if (!reflectionType) {
		throw redirect(303, '/individual');
	}

	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
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

	if (!objective || objective.subgoals.length === 0) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0];

	if (!cycle) {
		throw redirect(303, '/onboarding');
	}

	const currentWeek = computeWeekNumber(cycle.startDate);

	const reflections = await prisma.reflection.findMany({
		where: {
			userId: dbUser.id,
			cycleId: cycle.id,
			reflectionType,
			weekNumber: currentWeek
		}
	});

	return {
		reflectionType,
		cycle: {
			id: cycle.id,
			label: cycle.label ?? 'Cycle',
			startDate: cycle.startDate.toISOString()
		},
		subgoals: objective.subgoals.map((subgoal) => ({
			id: subgoal.id,
			label: subgoal.label,
			description: subgoal.description ?? ''
		})),
		currentWeek,
		previousEntries: reflections.map((entry) => ({
			id: entry.id,
			subgoalId: entry.subgoalId,
			score:
				reflectionType === 'EFFORT' ? (entry.effortScore ?? null) : (entry.progressScore ?? null),
			notes: entry.notes ?? ''
		}))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const reflectionType = ensureType(event.params.type);

		if (!reflectionType) {
			throw redirect(303, '/individual');
		}

		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const objective = await prisma.objective.findFirst({
			where: { userId: dbUser.id, active: true },
			orderBy: { createdAt: 'desc' },
			include: {
				cycles: {
					orderBy: { startDate: 'desc' },
					take: 1
				}
			}
		});

		const cycle = objective?.cycles[0];

		if (!cycle) {
			return fail(400, { error: 'No active cycle found. Complete onboarding first.' });
		}

		const formData = await event.request.formData();
		const submission = Object.fromEntries(formData) as Record<string, string>;
		const parsed = reflectionEntrySchema.safeParse(submission);

		if (!parsed.success) {
			const errors = parsed.error.flatten();
			return fail(400, {
				error: errors.fieldErrors.score?.[0] ?? 'Invalid input',
				values: submission
			});
		}

		const data = parsed.data;
		const score = data.score;
		const notes = data.notes ?? null;
		const weekNumber = computeWeekNumber(cycle.startDate);

		try {
			await prisma.reflection.upsert({
				where: {
					cycleId_weekNumber_reflectionType_subgoalId: {
						cycleId: cycle.id,
						weekNumber,
						reflectionType,
						subgoalId: data.subgoalId
					}
				},
				update: {
					notes,
					effortScore: reflectionType === 'EFFORT' ? score : undefined,
					progressScore: reflectionType === 'PROGRESS' ? score : undefined,
					submittedAt: new Date(),
					checkInDate: new Date()
				},
				create: {
					cycleId: cycle.id,
					userId: dbUser.id,
					subgoalId: data.subgoalId,
					reflectionType,
					weekNumber,
					effortScore: reflectionType === 'EFFORT' ? score : null,
					progressScore: reflectionType === 'PROGRESS' ? score : null,
					notes,
					checkInDate: new Date()
				}
			});

			return {
				success: true,
				type: reflectionType,
				subgoalId: data.subgoalId
			};
		} catch (error) {
			console.error('Failed to record reflection', error);
			return fail(500, { error: 'Could not save your reflection. Please try again.' });
		}
	}
};
