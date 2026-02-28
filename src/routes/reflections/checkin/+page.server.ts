import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { checkInEntrySchema } from '$lib/validation/reflection';
import type { Actions, PageServerLoad } from './$types';
import type { ReflectionType } from '@prisma/client';
import { computeWeekNumber, getDateForWeekday } from '$lib/server/coachUtils';
import { parseCheckInDays } from '$lib/utils/checkInDays';

// Unified check-in: every check-in is RATING_A (effort + performance + notes)
const getCheckInType = (
	startDate: Date,
	weekNumber: number,
	checkInFrequency?: string
): {
	type: ReflectionType;
	label: string;
	availableDate: Date;
	isAvailable: boolean;
} => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Parse check-in days from frequency string (e.g. "mon,wed,fri" or legacy "3x"/"2x"/"1x")
	const days = parseCheckInDays(checkInFrequency ?? '3x');
	const dayNumbers = days.map(dayNameToNumber);

	// Find the next available check-in day for this week
	const sortedDays = [...dayNumbers].sort((a, b) => a - b);

	// Find the latest day that has passed (or today), or the earliest day if none have passed
	let bestDay: number | null = null;
	for (const day of sortedDays) {
		const dayDate = getDateForWeekday(day, startDate, weekNumber);
		if (today >= dayDate) {
			bestDay = day; // Keep updating to get the latest available day
		}
	}

	if (bestDay !== null) {
		const dayDate = getDateForWeekday(bestDay, startDate, weekNumber);
		return {
			type: 'RATING_A',
			label: 'Check-in',
			availableDate: dayDate,
			isAvailable: true
		};
	}

	// No day has passed yet — show the first upcoming day
	const firstDay = sortedDays[0] ?? 3; // fallback to Wednesday
	const dayDate = getDateForWeekday(firstDay, startDate, weekNumber);
	return {
		type: 'RATING_A',
		label: 'Check-in',
		availableDate: dayDate,
		isAvailable: false
	};
};

function dayNameToNumber(day: string): number {
	const map: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
	return map[day] ?? 3;
}

export const load: PageServerLoad = async (event) => {
	const isPreview = event.url.searchParams.get('preview') === 'true';
	const { dbUser } = requireRole(event, isPreview ? ['INDIVIDUAL', 'ADMIN'] : 'INDIVIDUAL');

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

	const computedWeek = computeWeekNumber(cycle.startDate);
	const checkInFrequency = cycle.checkInFrequency ?? '3x';

	// Support ?week=N for catch-up on previous weeks
	const weekParam = event.url.searchParams.get('week');
	let currentWeek = computedWeek;
	if (weekParam) {
		const parsed = parseInt(weekParam, 10);
		if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= computedWeek) {
			currentWeek = parsed;
		}
	}

	// Unified: all check-ins are RATING_A
	// Always use unified check-in (RATING_A with both effort + performance)
	const checkInInfo = getCheckInType(cycle.startDate, currentWeek, checkInFrequency);
	if (isPreview) {
		checkInInfo.isAvailable = true;
	}

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
		checkInFrequency,
		isAvailable: checkInInfo.isAvailable,
		availableDate: checkInInfo.availableDate.toISOString(),
		isLocked: false,
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

		const computedWeek = computeWeekNumber(cycle.startDate);
		const isPreview = event.url.searchParams.get('preview') === 'true';

		// Support ?week=N for catch-up submissions
		const weekParam = event.url.searchParams.get('week');
		let weekNumber = computedWeek;
		if (weekParam) {
			const parsed = parseInt(weekParam, 10);
			if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= computedWeek) {
				weekNumber = parsed;
			}
		}

		const actionCheckInFrequency = cycle.checkInFrequency ?? '3x';

		// Unified: always RATING_A
		const checkInInfo = getCheckInType(cycle.startDate, weekNumber, actionCheckInFrequency);
		if (isPreview) {
			checkInInfo.isAvailable = true;
		}

		// Check if check-in is available (skip in preview mode)
		if (!isPreview && !checkInInfo.isAvailable) {
			return fail(400, {
				error: `This check-in is not available yet. It will be available on ${checkInInfo.availableDate.toLocaleDateString()}.`
			});
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
			return fail(400, { error: 'No sub-objectives found. Complete onboarding first.' });
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

			// Compute streak after successful upsert
			let streak = 0;
			try {
				const allReflections = await prisma.reflection.findMany({
					where: { cycleId: cycle.id },
					select: { weekNumber: true, reflectionType: true }
				});

				const completedSet = new Set(
					allReflections.map((r) => `${r.weekNumber}-${r.reflectionType}`)
				);

				const streakCheckInFrequency = cycle.checkInFrequency ?? '3x';
				const streakCheckInDays = parseCheckInDays(streakCheckInFrequency);
				const currentWeek = computeWeekNumber(cycle.startDate);
				const expectedSequence: Array<{ week: number; type: string }> = [];
				for (let w = 1; w <= currentWeek; w++) {
					// Each check-in day = one RATING_A
					for (let d = 0; d < streakCheckInDays.length; d++) {
						expectedSequence.push({ week: w, type: 'RATING_A' });
					}
				}

				for (let i = expectedSequence.length - 1; i >= 0; i--) {
					const expected = expectedSequence[i];
					if (completedSet.has(`${expected.week}-${expected.type}`)) {
						streak++;
					} else {
						break;
					}
				}
			} catch {
				// Streak computation is non-critical
			}

			return {
				success: true,
				type: checkInInfo.type,
				streak
			};
		} catch (error) {
			console.error('Failed to record check-in', error);
			return fail(500, { error: 'Could not save your check-in. Please try again.' });
		}
	}
};
