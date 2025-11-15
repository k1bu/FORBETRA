import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { orderBy: { createdAt: 'asc' } },
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true
						}
					}
				}
			},
			stakeholders: {
				orderBy: { createdAt: 'asc' }
			}
		}
	});

	// Check if this is the user's first visit (no objective exists at all)
	const hasAnyObjective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		select: { id: true }
	});
	const isFirstVisit = !hasAnyObjective;

	// Check if onboarding is complete
	// Onboarding is complete if: objective exists, has at least one subgoal, and has at least one cycle
	const isOnboardingComplete = !!(
		objective &&
		objective.subgoals.length > 0 &&
		objective.cycles.length > 0
	);

	// If no objective, return early with onboarding status
	if (!objective) {
		return {
			isFirstVisit,
			isOnboardingComplete: false,
			objective: null,
			summary: null
		};
	}

	const cycle = objective.cycles[0] ?? null;
	const currentTime = new Date();
	const currentWeek = cycle
		? Math.max(
				1,
				Math.floor((currentTime.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
			)
		: null;

	// Calculate summary metrics
	let completionRate: number | null = null;
	let currentStreak: number = 0;
	let totalExpected: number = 0;
	let totalCompleted: number = 0;
	let openExperiences: number = 0;
	let missedExperiences: number = 0;

	if (cycle && currentWeek) {
		totalExpected = currentWeek * 3;
		totalCompleted = cycle.reflections.length;
		completionRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

		// Count open and missed experiences for current week
		const submittedTypes = new Set(
			cycle.reflections.filter((r) => r.weekNumber === currentWeek).map((r) => r.reflectionType)
		);

		if (!submittedTypes.has('INTENTION')) openExperiences++;
		if (!submittedTypes.has('EFFORT')) {
			// Check if it's past the deadline (Friday)
			const fridayDate = new Date(cycle.startDate);
			const startDayOfWeek = cycle.startDate.getDay();
			const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
			const cycleMonday = new Date(cycle.startDate);
			cycleMonday.setDate(cycle.startDate.getDate() + mondayOffset);
			cycleMonday.setHours(0, 0, 0, 0);
			const targetMonday = new Date(cycleMonday);
			targetMonday.setDate(cycleMonday.getDate() + (currentWeek - 1) * 7);
			const friday = new Date(targetMonday);
			friday.setDate(targetMonday.getDate() + 4);
			friday.setHours(0, 0, 0, 0);

			if (currentTime >= friday) {
				missedExperiences++;
			} else {
				openExperiences++;
			}
		}
		if (!submittedTypes.has('PROGRESS')) {
			// Check if next Monday intention is submitted (locks it)
			const nextWeekIntention = await prisma.reflection.findFirst({
				where: {
					cycleId: cycle.id,
					userId: dbUser.id,
					reflectionType: 'INTENTION',
					weekNumber: currentWeek + 1
				}
			});
			if (nextWeekIntention) {
				missedExperiences++;
			} else {
				openExperiences++;
			}
		}

		// Calculate current streak
		const typeOrder: Record<string, number> = { INTENTION: 0, EFFORT: 1, PROGRESS: 2 };
		const sortedReflections = [...cycle.reflections].sort((a, b) => {
			if (a.weekNumber !== b.weekNumber) {
				return a.weekNumber - b.weekNumber;
			}
			return (typeOrder[a.reflectionType] ?? 999) - (typeOrder[b.reflectionType] ?? 999);
		});

		const completedReflections = new Set<string>();
		sortedReflections.forEach((r) => {
			completedReflections.add(`${r.weekNumber}-${r.reflectionType}`);
		});

		const expectedSequence: Array<{ week: number; type: string }> = [];
		for (let week = 1; week <= currentWeek; week++) {
			expectedSequence.push({ week, type: 'INTENTION' });
			expectedSequence.push({ week, type: 'EFFORT' });
			expectedSequence.push({ week, type: 'PROGRESS' });
		}

		let streak = 0;
		for (let i = expectedSequence.length - 1; i >= 0; i--) {
			const expected = expectedSequence[i];
			const key = `${expected.week}-${expected.type}`;
			if (completedReflections.has(key)) {
				streak++;
			} else {
				break;
			}
		}
		currentStreak = streak;
	}

	return {
		isFirstVisit,
		isOnboardingComplete,
		objective: objective
			? {
					id: objective.id,
					title: objective.title
				}
			: null,
		summary: isOnboardingComplete
			? {
					completionRate,
					currentStreak,
					totalCompleted,
					totalExpected,
					openExperiences,
					missedExperiences,
					totalStakeholders: objective.stakeholders.length
				}
			: null
	};
};
