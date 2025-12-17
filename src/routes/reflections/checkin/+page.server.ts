import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { checkInEntrySchema } from '$lib/validation/reflection';
import type { Actions, PageServerLoad } from './$types';
import type { ReflectionType } from '@prisma/client';

// Helper to compute week number from start date
const computeWeekNumber = (startDate: Date): number => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

// Get the date for a specific weekday in a given week (1 = Monday, 3 = Wednesday, 5 = Friday)
const getDateForWeekday = (weekday: number, startDate: Date, weekNumber: number): Date => {
	// Find the Monday of the week that contains startDate
	const startDayOfWeek = startDate.getDay();
	const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek; // Monday is day 1
	const cycleMonday = new Date(startDate);
	cycleMonday.setDate(startDate.getDate() + mondayOffset);
	cycleMonday.setHours(0, 0, 0, 0);

	// Calculate the Monday of the target week (weekNumber weeks from cycle start)
	const targetMonday = new Date(cycleMonday);
	targetMonday.setDate(cycleMonday.getDate() + (weekNumber - 1) * 7);

	// Add days to get to the target weekday (Wednesday = 3, Friday = 5)
	const targetDate = new Date(targetMonday);
	targetDate.setDate(targetMonday.getDate() + (weekday - 1));
	targetDate.setHours(0, 0, 0, 0);

	return targetDate;
};

// Determine which check-in type based on current date
const getCheckInType = (
	startDate: Date,
	weekNumber: number
): {
	type: ReflectionType;
	label: string;
	availableDate: Date;
	isAvailable: boolean;
} => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const wednesdayDate = getDateForWeekday(3, startDate, weekNumber); // Wednesday = 3
	const fridayDate = getDateForWeekday(5, startDate, weekNumber); // Friday = 5

	// If it's Friday or later, show Friday check-in
	if (today >= fridayDate) {
		return {
			type: 'RATING_B',
			label: 'Friday check-in',
			availableDate: fridayDate,
			isAvailable: true
		};
	}

	// If it's Wednesday or later (but before Friday), show Wednesday check-in
	if (today >= wednesdayDate) {
		return {
			type: 'RATING_A',
			label: 'Wednesday check-in',
			availableDate: wednesdayDate,
			isAvailable: true
		};
	}

	// Before Wednesday, show Wednesday check-in but mark as not available yet
	return {
		type: 'RATING_A',
		label: 'Wednesday check-in',
		availableDate: wednesdayDate,
		isAvailable: false
	};
};

// Check if next Monday intention has been submitted (locks editing)
const isNextMondayIntentionSubmitted = async (
	cycleId: string,
	userId: string,
	currentWeek: number
): Promise<boolean> => {
	const nextWeekIntention = await prisma.reflection.findFirst({
		where: {
			cycleId,
			userId,
			reflectionType: 'INTENTION',
			weekNumber: currentWeek + 1
		}
	});

	return !!nextWeekIntention;
};

export const load: PageServerLoad = async (event) => {
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

	// Check if type is specified in query params
	const typeParam = event.url.searchParams.get('type');
	const isPreview = event.url.searchParams.get('preview') === 'true';

	let checkInInfo: {
		type: ReflectionType;
		label: string;
		availableDate: Date;
		isAvailable: boolean;
	};

	if (typeParam === 'RATING_A' || typeParam === 'RATING_B') {
		// Use the specified type
		const tuesdayDate = getDateForWeekday(2, cycle.startDate, currentWeek);
		const thursdayDate = getDateForWeekday(4, cycle.startDate, currentWeek);
		const fridayDate = getDateForWeekday(5, cycle.startDate, currentWeek);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (typeParam === 'RATING_A') {
			checkInInfo = {
				type: 'RATING_A',
				label: 'Wednesday check-in',
				availableDate: tuesdayDate,
				isAvailable: isPreview || today >= tuesdayDate
			};
		} else {
			checkInInfo = {
				type: 'RATING_B',
				label: 'Friday check-in',
				availableDate: thursdayDate,
				isAvailable: isPreview || today >= thursdayDate
			};
		}
	} else {
		// Fall back to auto-detection
		checkInInfo = getCheckInType(cycle.startDate, currentWeek);
		// Override availability if preview mode
		if (isPreview) {
			checkInInfo.isAvailable = true;
		}
	}

	const isLocked = await isNextMondayIntentionSubmitted(cycle.id, dbUser.id, currentWeek);

	// Get existing reflection for this check-in type (using first subgoal as placeholder for objective-level reflection)
	const firstSubgoal = objective.subgoals[0];
	const existingReflection = firstSubgoal
		? await prisma.reflection.findFirst({
				where: {
					userId: dbUser.id,
					cycleId: cycle.id,
					reflectionType: checkInInfo.type,
					weekNumber: currentWeek,
					subgoalId: firstSubgoal.id
				}
			})
		: null;

	// Fetch previous ratings (only if not Week 1)
	let previousRatings: {
		weekNumber: number;
		effortScore: number | null;
		performanceScore: number | null;
	} | null = null;
	let historicRatings: Array<{
		weekNumber: number;
		effortScore: number | null;
		performanceScore: number | null;
	}> = [];

	if (currentWeek > 1) {
		if (firstSubgoal) {
			// Get all reflections for this subgoal (both RATING_A and RATING_B capture both scores)
			const allReflections = await prisma.reflection.findMany({
				where: {
					userId: dbUser.id,
					cycleId: cycle.id,
					subgoalId: firstSubgoal.id,
					weekNumber: { lt: currentWeek }
				},
				orderBy: { weekNumber: 'desc' },
				select: { weekNumber: true, effortScore: true, performanceScore: true }
			});

			// Get last ratings (most recent reflection with either score)
			const lastReflection = allReflections[0];
			if (lastReflection) {
				previousRatings = {
					weekNumber: lastReflection.weekNumber,
					effortScore: lastReflection.effortScore ?? null,
					performanceScore: lastReflection.performanceScore ?? null
				};
			} else {
				// Initialize with null values if no previous reflections exist (but we're past Week 1)
				previousRatings = {
					weekNumber: currentWeek - 1,
					effortScore: null,
					performanceScore: null
				};
			}

			// Build historic ratings map by week (combining scores from all reflections)
			const historicMap = new Map<
				number,
				{ effortScore: number | null; performanceScore: number | null }
			>();

			allReflections.forEach((r) => {
				if (!historicMap.has(r.weekNumber)) {
					historicMap.set(r.weekNumber, { effortScore: null, performanceScore: null });
				}
				const weekData = historicMap.get(r.weekNumber)!;
				// Use the most recent score if multiple reflections exist for the same week
				if (r.effortScore !== null) weekData.effortScore = r.effortScore;
				if (r.performanceScore !== null) weekData.performanceScore = r.performanceScore;
			});

			// Convert to array sorted by week number (descending)
			historicRatings = Array.from(historicMap.entries())
				.map(([weekNumber, scores]) => ({ weekNumber, ...scores }))
				.sort((a, b) => b.weekNumber - a.weekNumber);
		} else {
			// If no subgoal but we're past Week 1, initialize with null values
			previousRatings = {
				weekNumber: currentWeek - 1,
				effortScore: null,
				performanceScore: null
			};
		}
	}

	return {
		checkInType: checkInInfo.type,
		checkInLabel: checkInInfo.label,
		isAvailable: checkInInfo.isAvailable,
		availableDate: checkInInfo.availableDate.toISOString(),
		isLocked: isPreview ? false : isLocked, // Allow editing in preview mode
		isPreview,
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description ?? ''
		},
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
		previousEntry: existingReflection
			? {
					id: existingReflection.id,
					effortScore: existingReflection.effortScore ?? null,
					performanceScore: existingReflection.performanceScore ?? null,
					notes: existingReflection.notes ?? ''
				}
			: null,
		previousRatings,
		historicRatings
	};
};

export const actions: Actions = {
	default: async (event) => {
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

		const weekNumber = computeWeekNumber(cycle.startDate);
		const isPreview = event.url.searchParams.get('preview') === 'true';
		const typeParam = event.url.searchParams.get('type');

		let checkInInfo: {
			type: ReflectionType;
			label: string;
			availableDate: Date;
			isAvailable: boolean;
		};

		// Respect type parameter if provided, otherwise auto-detect
		if (typeParam === 'RATING_A' || typeParam === 'RATING_B') {
			const tuesdayDate = getDateForWeekday(2, cycle.startDate, weekNumber);
			const thursdayDate = getDateForWeekday(4, cycle.startDate, weekNumber);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (typeParam === 'RATING_A') {
				checkInInfo = {
					type: 'RATING_A',
					label: 'Wednesday check-in',
					availableDate: tuesdayDate,
					isAvailable: isPreview || today >= tuesdayDate
				};
			} else {
				checkInInfo = {
					type: 'RATING_B',
					label: 'Friday check-in',
					availableDate: thursdayDate,
					isAvailable: isPreview || today >= thursdayDate
				};
			}
		} else {
			checkInInfo = getCheckInType(cycle.startDate, weekNumber);
			if (isPreview) {
				checkInInfo.isAvailable = true;
			}
		}

		// Check if check-in is available (skip in preview mode)
		if (!isPreview && !checkInInfo.isAvailable) {
			return fail(400, {
				error: `This check-in is not available yet. It will be available on ${checkInInfo.availableDate.toLocaleDateString()}.`
			});
		}

		// Check if locked (next Monday intention submitted) - skip in preview mode
		if (!isPreview) {
			const isLocked = await isNextMondayIntentionSubmitted(cycle.id, dbUser.id, weekNumber);
			if (isLocked) {
				return fail(400, {
					error:
						'This check-in can no longer be edited because the next Monday intention has been submitted.'
				});
			}
		}

		// Get first subgoal to use as placeholder for objective-level reflection
		const objectiveWithSubgoals = await prisma.objective.findFirst({
			where: { userId: dbUser.id, active: true },
			orderBy: { createdAt: 'desc' },
			include: {
				subgoals: {
					orderBy: { createdAt: 'asc' },
					take: 1
				}
			}
		});

		if (!objectiveWithSubgoals || objectiveWithSubgoals.subgoals.length === 0) {
			return fail(400, { error: 'No subgoals found. Complete onboarding first.' });
		}

		const firstSubgoal = objectiveWithSubgoals.subgoals[0];

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
		const notes = data.notes ?? null;

		try {
			await prisma.reflection.upsert({
				where: {
					cycleId_weekNumber_reflectionType_subgoalId: {
						cycleId: cycle.id,
						weekNumber,
						reflectionType: checkInInfo.type,
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
					reflectionType: checkInInfo.type,
					weekNumber,
					effortScore: data.effortScore,
					performanceScore: data.performanceScore,
					notes,
					checkInDate: new Date()
				}
			});

			return {
				success: true,
				type: checkInInfo.type
			};
		} catch (error) {
			console.error('Failed to record check-in', error);
			return fail(500, { error: 'Could not save your check-in. Please try again.' });
		}
	}
};
