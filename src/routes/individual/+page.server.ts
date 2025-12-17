import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
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
								weekNumber: true,
								effortScore: true,
								performanceScore: true
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
					Math.floor(
						(currentTime.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
					)
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
			if (!submittedTypes.has('RATING_A')) {
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
			if (!submittedTypes.has('RATING_B')) {
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
			const typeOrder: Record<string, number> = { INTENTION: 0, RATING_A: 1, RATING_B: 2 };
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
				expectedSequence.push({ week, type: 'RATING_A' });
				expectedSequence.push({ week, type: 'RATING_B' });
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

		// Prepare visualization data if cycle exists
		let visualizationData: {
			individual: Array<{
				weekNumber: number;
				effortScore: number | null;
				performanceScore: number | null;
			}>;
			stakeholders: Array<{
				weekNumber: number;
				stakeholderId: string;
				stakeholderName: string;
				effortScore: number | null;
				performanceScore: number | null;
			}>;
			stakeholderList: Array<{ id: string; name: string }>;
		} | null = null;

		if (cycle && isOnboardingComplete) {
			// Build reflection trend map for all weeks
			const reflectionTrendMap = new Map<
				number,
				{
					weekNumber: number;
					effortScores: number[];
					performanceScores: number[];
				}
			>();

			cycle.reflections.forEach((reflection) => {
				const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
					weekNumber: reflection.weekNumber,
					effortScores: [],
					performanceScores: []
				};

				if (reflection.effortScore !== null && reflection.effortScore !== undefined) {
					weekEntry.effortScores.push(reflection.effortScore);
				}
				if (reflection.performanceScore !== null && reflection.performanceScore !== undefined) {
					weekEntry.performanceScores.push(reflection.performanceScore);
				}

				reflectionTrendMap.set(reflection.weekNumber, weekEntry);
			});

			const allReflectionWeeks = Array.from(reflectionTrendMap.values()).sort(
				(a, b) => a.weekNumber - b.weekNumber
			);

			const individualWeeklyData = allReflectionWeeks.map((week) => {
				const effortAverage =
					week.effortScores.length > 0
						? Number(
								(
									week.effortScores.reduce((sum, score) => sum + score, 0) /
									week.effortScores.length
								).toFixed(1)
							)
						: null;
				const performanceAverage =
					week.performanceScores.length > 0
						? Number(
								(
									week.performanceScores.reduce((sum, score) => sum + score, 0) /
									week.performanceScores.length
								).toFixed(1)
							)
						: null;

				return {
					weekNumber: week.weekNumber,
					effortScore: effortAverage,
					performanceScore: performanceAverage
				};
			});

			// Load all stakeholder feedback data for visualization
			const stakeholderWeeklyData: Array<{
				weekNumber: number;
				stakeholderId: string;
				stakeholderName: string;
				effortScore: number | null;
				performanceScore: number | null;
			}> = [];

			const allFeedbacks = await prisma.feedback.findMany({
				where: {
					reflection: {
						cycleId: cycle.id
					}
				},
				include: {
					reflection: {
						select: {
							weekNumber: true
						}
					},
					stakeholder: {
						select: {
							id: true,
							name: true
						}
					}
				}
			});

			allFeedbacks.forEach((feedback) => {
				if (feedback.reflection) {
					stakeholderWeeklyData.push({
						weekNumber: feedback.reflection.weekNumber,
						stakeholderId: feedback.stakeholder.id,
						stakeholderName: feedback.stakeholder.name,
						effortScore: feedback.effortScore,
						performanceScore: feedback.performanceScore
					});
				}
			});

			visualizationData = {
				individual: individualWeeklyData,
				stakeholders: stakeholderWeeklyData,
				stakeholderList: objective.stakeholders.map((s) => ({ id: s.id, name: s.name }))
			};
		}

		// Calculate data for the three cards: Next Action, My Last Ratings, Stakeholders' Last Ratings
		let nextAction: {
			type: 'INTENTION' | 'RATING_A' | 'RATING_B';
			label: string;
			url: string | null;
			state: 'open' | 'missed' | 'upcoming';
		} | null = null;

		let myLastRatings: {
			effort: number | null;
			performance: number | null;
			effortChange: number | null;
			performanceChange: number | null;
			weekNumber: number | null;
		} | null = null;

		let stakeholdersLastRatings: {
			effort: number | null;
			performance: number | null;
			effortChange: number | null;
			performanceChange: number | null;
			weekNumber: number | null;
		} | null = null;

		if (cycle && currentWeek && isOnboardingComplete) {
			// Calculate next action
			const submittedTypes = new Set(
				cycle.reflections.filter((r) => r.weekNumber === currentWeek).map((r) => r.reflectionType)
			);

			// Check for next open action
			if (!submittedTypes.has('INTENTION')) {
				nextAction = {
					type: 'INTENTION',
					label: 'Complete your Monday intention reflection',
					url: '/prompts/monday',
					state: 'open'
				};
			} else if (!submittedTypes.has('RATING_A')) {
				nextAction = {
					type: 'RATING_A',
					label: 'Complete your Wednesday check-in',
					url: '/reflections/checkin?type=RATING_A',
					state: 'open'
				};
			} else if (!submittedTypes.has('RATING_B')) {
				nextAction = {
					type: 'RATING_B',
					label: 'Complete your Friday check-in',
					url: '/reflections/checkin?type=RATING_B',
					state: 'open'
				};
			} else {
				// All current week actions completed, next is next week's intention
				nextAction = {
					type: 'INTENTION',
					label: "Complete next week's Monday intention reflection",
					url: '/prompts/monday',
					state: 'upcoming'
				};
			}

			// Get latest individual ratings (most recent week with ratings)
			const reflectionsWithRatings = cycle.reflections
				.filter((r) => r.effortScore !== null || r.performanceScore !== null)
				.sort((a, b) => {
					if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber;
					// Prefer RATING_A/RATING_B over INTENTION for ratings
					const typeOrder: Record<string, number> = { INTENTION: 0, RATING_A: 1, RATING_B: 2 };
					return (typeOrder[b.reflectionType] ?? 0) - (typeOrder[a.reflectionType] ?? 0);
				});

			if (reflectionsWithRatings.length > 0) {
				const latestWeek = reflectionsWithRatings[0].weekNumber;
				const latestWeekReflections = reflectionsWithRatings.filter(
					(r) => r.weekNumber === latestWeek
				);

				// Get average effort and progress for latest week
				const effortScores = latestWeekReflections
					.map((r) => r.effortScore)
					.filter((s): s is number => s !== null && s !== undefined);
				const performanceScores = latestWeekReflections
					.map((r) => r.performanceScore)
					.filter((s): s is number => s !== null && s !== undefined);

				const latestEffort =
					effortScores.length > 0
						? Number((effortScores.reduce((sum, s) => sum + s, 0) / effortScores.length).toFixed(1))
						: null;
				const latestPerformance =
					performanceScores.length > 0
						? Number(
								(
									performanceScores.reduce((sum, s) => sum + s, 0) / performanceScores.length
								).toFixed(1)
							)
						: null;

				// Get previous week ratings for comparison
				const previousWeek = latestWeek > 1 ? latestWeek - 1 : null;
				let previousEffort: number | null = null;
				let previousPerformance: number | null = null;

				if (previousWeek) {
					const previousWeekReflections = cycle.reflections.filter(
						(r) => r.weekNumber === previousWeek
					);
					const prevEffortScores = previousWeekReflections
						.map((r) => r.effortScore)
						.filter((s): s is number => s !== null && s !== undefined);
					const prevPerformanceScores = previousWeekReflections
						.map((r) => r.performanceScore)
						.filter((s): s is number => s !== null && s !== undefined);

					previousEffort =
						prevEffortScores.length > 0
							? Number(
									(
										prevEffortScores.reduce((sum, s) => sum + s, 0) / prevEffortScores.length
									).toFixed(1)
								)
							: null;
					previousPerformance =
						prevPerformanceScores.length > 0
							? Number(
									(
										prevPerformanceScores.reduce((sum, s) => sum + s, 0) /
										prevPerformanceScores.length
									).toFixed(1)
								)
							: null;
				}

				myLastRatings = {
					effort: latestEffort,
					performance: latestPerformance,
					effortChange:
						latestEffort !== null && previousEffort !== null ? latestEffort - previousEffort : null,
					performanceChange:
						latestPerformance !== null && previousPerformance !== null
							? latestPerformance - previousPerformance
							: null,
					weekNumber: latestWeek
				};
			}

			// Get latest stakeholder ratings
			const allFeedbacks = await prisma.feedback.findMany({
				where: {
					reflection: {
						cycleId: cycle.id
					}
				},
				include: {
					reflection: {
						select: {
							weekNumber: true
						}
					}
				},
				orderBy: {
					submittedAt: 'desc'
				}
			});

			if (allFeedbacks.length > 0) {
				// Group feedbacks by week
				const feedbacksByWeek = new Map<
					number,
					Array<{ effortScore: number | null; performanceScore: number | null }>
				>();

				allFeedbacks.forEach((feedback) => {
					if (feedback.reflection) {
						const week = feedback.reflection.weekNumber;
						if (!feedbacksByWeek.has(week)) {
							feedbacksByWeek.set(week, []);
						}
						feedbacksByWeek.get(week)!.push({
							effortScore: feedback.effortScore,
							performanceScore: feedback.performanceScore
						});
					}
				});

				// Get latest week with feedback
				const latestWeekWithFeedback = Math.max(...Array.from(feedbacksByWeek.keys()));
				const latestWeekFeedbacks = feedbacksByWeek.get(latestWeekWithFeedback) ?? [];

				const stakeholderEffortScores = latestWeekFeedbacks
					.map((f) => f.effortScore)
					.filter((s): s is number => s !== null && s !== undefined);
				const stakeholderPerformanceScores = latestWeekFeedbacks
					.map((f) => f.performanceScore)
					.filter((s): s is number => s !== null && s !== undefined);

				const latestStakeholderEffort =
					stakeholderEffortScores.length > 0
						? Number(
								(
									stakeholderEffortScores.reduce((sum, s) => sum + s, 0) /
									stakeholderEffortScores.length
								).toFixed(1)
							)
						: null;
				const latestStakeholderPerformance =
					stakeholderPerformanceScores.length > 0
						? Number(
								(
									stakeholderPerformanceScores.reduce((sum, s) => sum + s, 0) /
									stakeholderPerformanceScores.length
								).toFixed(1)
							)
						: null;

				// Get previous week stakeholder ratings
				const previousWeekWithFeedback =
					latestWeekWithFeedback > 1 ? latestWeekWithFeedback - 1 : null;
				let previousStakeholderEffort: number | null = null;
				let previousStakeholderPerformance: number | null = null;

				if (previousWeekWithFeedback && feedbacksByWeek.has(previousWeekWithFeedback)) {
					const prevWeekFeedbacks = feedbacksByWeek.get(previousWeekWithFeedback)!;
					const prevEffortScores = prevWeekFeedbacks
						.map((f) => f.effortScore)
						.filter((s): s is number => s !== null && s !== undefined);
					const prevPerformanceScores = prevWeekFeedbacks
						.map((f) => f.performanceScore)
						.filter((s): s is number => s !== null && s !== undefined);

					previousStakeholderEffort =
						prevEffortScores.length > 0
							? Number(
									(
										prevEffortScores.reduce((sum, s) => sum + s, 0) / prevEffortScores.length
									).toFixed(1)
								)
							: null;
					previousStakeholderPerformance =
						prevPerformanceScores.length > 0
							? Number(
									(
										prevPerformanceScores.reduce((sum, s) => sum + s, 0) /
										prevPerformanceScores.length
									).toFixed(1)
								)
							: null;
				}

				stakeholdersLastRatings = {
					effort: latestStakeholderEffort,
					performance: latestStakeholderPerformance,
					effortChange:
						latestStakeholderEffort !== null && previousStakeholderEffort !== null
							? latestStakeholderEffort - previousStakeholderEffort
							: null,
					performanceChange:
						latestStakeholderPerformance !== null && previousStakeholderPerformance !== null
							? latestStakeholderPerformance - previousStakeholderPerformance
							: null,
					weekNumber: latestWeekWithFeedback
				};
			}
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
				: null,
			cycle: cycle
				? {
						id: cycle.id,
						startDate: cycle.startDate.toISOString()
					}
				: null,
			visualizationData,
			nextAction,
			myLastRatings,
			stakeholdersLastRatings
		};
	} catch (error: any) {
		console.error('[individual:error] Failed to load individual page', {
			error: error.message,
			stack: error.stack
		});
		throw error;
	}
};
