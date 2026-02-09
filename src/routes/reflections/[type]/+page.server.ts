import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { reflectionEntrySchema } from '$lib/validation/reflection';
import type { Actions, PageServerLoad } from './$types';
import type { ReflectionType } from '@prisma/client';

const typeMap: Record<string, ReflectionType> = {
	'rating-a': 'RATING_A',
	'rating-b': 'RATING_B',
	ratinga: 'RATING_A',
	ratingb: 'RATING_B'
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

	// Fetch all historic ratings for each subgoal (only if not Week 1)
	// Get all Effort (RATING_A) and Performance (RATING_B) scores for each subgoal
	const previousRatingsBySubgoal = new Map<
		string,
		{ weekNumber: number; effortScore: number | null; performanceScore: number | null }
	>();
	const historicRatingsBySubgoal = new Map<
		string,
		Array<{ weekNumber: number; effortScore: number | null; performanceScore: number | null }>
	>();

	if (currentWeek > 1) {
		for (const subgoal of objective.subgoals) {
			// Get all RATING_A (Effort) reflections for this subgoal
			const effortReflections = await prisma.reflection.findMany({
				where: {
					userId: dbUser.id,
					cycleId: cycle.id,
					subgoalId: subgoal.id,
					reflectionType: 'RATING_A',
					weekNumber: { lt: currentWeek }
				},
				orderBy: { weekNumber: 'desc' },
				select: { weekNumber: true, effortScore: true }
			});

			// Get all RATING_B (Performance) reflections for this subgoal
			const performanceReflections = await prisma.reflection.findMany({
				where: {
					userId: dbUser.id,
					cycleId: cycle.id,
					subgoalId: subgoal.id,
					reflectionType: 'RATING_B',
					weekNumber: { lt: currentWeek }
				},
				orderBy: { weekNumber: 'desc' },
				select: { weekNumber: true, performanceScore: true }
			});

			// Get last ratings (most recent)
			const lastEffort = effortReflections[0];
			const lastPerformance = performanceReflections[0];
			const lastWeek = Math.max(lastEffort?.weekNumber ?? 0, lastPerformance?.weekNumber ?? 0);

			previousRatingsBySubgoal.set(subgoal.id, {
				weekNumber: lastWeek,
				effortScore: lastEffort?.effortScore ?? null,
				performanceScore: lastPerformance?.performanceScore ?? null
			});

			// Build historic ratings map by week
			const historicMap = new Map<
				number,
				{ effortScore: number | null; performanceScore: number | null }
			>();

			effortReflections.forEach((r) => {
				if (!historicMap.has(r.weekNumber)) {
					historicMap.set(r.weekNumber, { effortScore: null, performanceScore: null });
				}
				historicMap.get(r.weekNumber)!.effortScore = r.effortScore;
			});

			performanceReflections.forEach((r) => {
				if (!historicMap.has(r.weekNumber)) {
					historicMap.set(r.weekNumber, { effortScore: null, performanceScore: null });
				}
				historicMap.get(r.weekNumber)!.performanceScore = r.performanceScore;
			});

			// Convert to array sorted by week number (descending)
			const historicArray = Array.from(historicMap.entries())
				.map(([weekNumber, scores]) => ({ weekNumber, ...scores }))
				.sort((a, b) => b.weekNumber - a.weekNumber);

			historicRatingsBySubgoal.set(subgoal.id, historicArray);
		}
	}

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
				reflectionType === 'RATING_A'
					? (entry.effortScore ?? null)
					: (entry.performanceScore ?? null),
			notes: entry.notes ?? ''
		})),
		previousRatingsBySubgoal: Object.fromEntries(previousRatingsBySubgoal),
		historicRatingsBySubgoal: Object.fromEntries(
			Array.from(historicRatingsBySubgoal.entries()).map(([key, value]) => [key, value])
		)
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
					effortScore: reflectionType === 'RATING_A' ? score : undefined,
					performanceScore: reflectionType === 'RATING_B' ? score : undefined,
					submittedAt: new Date(),
					checkInDate: new Date()
				},
				create: {
					cycleId: cycle.id,
					userId: dbUser.id,
					subgoalId: data.subgoalId,
					reflectionType,
					weekNumber,
					effortScore: reflectionType === 'RATING_A' ? score : null,
					performanceScore: reflectionType === 'RATING_B' ? score : null,
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
