import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { computeWeekNumber } from '$lib/server/coachUtils';
import { parseCheckInDays } from '$lib/utils/checkInDays';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const [objective, hasAnyObjective, coachClient] = await Promise.all([
			prisma.objective.findFirst({
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
			}),
			prisma.objective.findFirst({
				where: { userId: dbUser.id },
				select: { id: true }
			}),
			prisma.coachClient.findFirst({
				where: { individualId: dbUser.id },
				select: { coach: { select: { name: true } } }
			})
		]);
		const isFirstVisit = !hasAnyObjective;

		// Check if onboarding is complete
		const isOnboardingComplete = !!(objective && objective.cycles.length > 0);

		// If no objective, redirect to onboarding
		if (!objective) {
			throw redirect(303, '/onboarding');
		}

		// If objective exists with cycles but no initial rating (week 0), redirect to initial-ratings
		if (objective.cycles.length > 0) {
			const cycleId = objective.cycles[0].id;
			const hasInitialRating = await prisma.reflection.findFirst({
				where: { userId: dbUser.id, cycleId, weekNumber: 0 }
			});
			if (!hasInitialRating) {
				throw redirect(303, '/onboarding/initial-ratings');
			}
		}

		const cycle = objective.cycles[0] ?? null;
		// Use the same week calculation as the dashboard (Math.floor + 1)
		const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

		// Calculate summary metrics
		// Determine check-in frequency for this cycle
		const checkInFrequency = cycle?.checkInFrequency ?? '3x';
		const checkInDays = parseCheckInDays(checkInFrequency);
		const checksPerWeek = checkInDays.length;

		let completionRate: number | null = null;
		let currentStreak: number = 0;
		let totalExpected: number = 0;
		let totalCompleted: number = 0;
		let openExperiences: number = 0;

		if (cycle && currentWeek) {
			totalExpected = currentWeek * checksPerWeek;
			totalCompleted = cycle.reflections.length;
			completionRate =
				totalExpected > 0 ? Math.min(100, Math.round((totalCompleted / totalExpected) * 100)) : 0;

			// Count open and missed experiences for current week
			// Unified: each check-in day = one RATING_A expected
			const currentWeekReflections = cycle.reflections.filter((r) => r.weekNumber === currentWeek);
			const ratingACount = currentWeekReflections.filter(
				(r) => r.reflectionType === 'RATING_A'
			).length;
			const expectedCheckIns = checkInDays.length;
			const pendingCheckIns = Math.max(0, expectedCheckIns - ratingACount);
			openExperiences = pendingCheckIns;

			// Calculate current streak
			const typeOrder: Record<string, number> = { RATING_A: 0, RATING_B: 1 };
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
				// Each check-in day = one RATING_A
				for (let d = 0; d < checkInDays.length; d++) {
					expectedSequence.push({ week, type: 'RATING_A' });
				}
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

		// Calculate data for the three cards
		let nextAction: {
			type: 'RATING_A' | 'RATING_B';
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

		let allFeedbacks: Array<{
			stakeholderId: string;
			effortScore: number | null;
			performanceScore: number | null;
			reflection: { weekNumber: number } | null;
		}> = [];

		// Build stakeholder name map (used by scorecard, heat maps, and visualization)
		const stakeholderNameMap = new Map<string, string>();
		for (const sh of objective.stakeholders) {
			stakeholderNameMap.set(sh.id, sh.name);
		}

		if (cycle && currentWeek && isOnboardingComplete) {
			// Calculate next action (unified)
			const ratingACount = cycle.reflections.filter(
				(r) => r.weekNumber === currentWeek && r.reflectionType === 'RATING_A'
			).length;
			if (ratingACount < checkInDays.length) {
				nextAction = {
					type: 'RATING_A',
					label: 'Complete your check-in',
					url: '/reflections/checkin',
					state: 'open'
				};
			} else {
				nextAction = {
					type: 'RATING_A',
					label: 'All check-ins complete this week',
					url: null,
					state: 'upcoming'
				};
			}

			// Get latest individual ratings
			const reflectionsWithRatings = cycle.reflections
				.filter((r) => r.effortScore !== null || r.performanceScore !== null)
				.sort((a, b) => {
					if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber;
					const typeOrder: Record<string, number> = { RATING_A: 0, RATING_B: 1 };
					return (typeOrder[b.reflectionType] ?? 0) - (typeOrder[a.reflectionType] ?? 0);
				});

			if (reflectionsWithRatings.length > 0) {
				const latestWeek = reflectionsWithRatings[0].weekNumber;
				const latestWeekReflections = reflectionsWithRatings.filter(
					(r) => r.weekNumber === latestWeek
				);

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
			allFeedbacks = await prisma.feedback.findMany({
				where: {
					reflection: {
						cycleId: cycle.id
					}
				},
				select: {
					stakeholderId: true,
					effortScore: true,
					performanceScore: true,
					submittedAt: true,
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

		// --- Heat Map Data: weekly effort/performance averages ---
		let heatMapWeeks: Array<{
			weekNumber: number;
			effort: number | null;
			performance: number | null;
		}> | null = null;
		let totalWeeks: number | null = null;

		if (cycle && currentWeek && isOnboardingComplete) {
			const cycleEnd = cycle.endDate ?? null;
			totalWeeks = cycleEnd
				? Math.max(
						1,
						Math.ceil((cycleEnd.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
					)
				: currentWeek;

			const weekMap = new Map<number, { efforts: number[]; performances: number[] }>();
			for (const r of cycle.reflections) {
				if (!weekMap.has(r.weekNumber)) {
					weekMap.set(r.weekNumber, { efforts: [], performances: [] });
				}
				const w = weekMap.get(r.weekNumber)!;
				if (r.effortScore !== null) w.efforts.push(r.effortScore);
				if (r.performanceScore !== null) w.performances.push(r.performanceScore);
			}

			heatMapWeeks = [];
			for (let wk = 1; wk <= totalWeeks; wk++) {
				const d = weekMap.get(wk);
				heatMapWeeks.push({
					weekNumber: wk,
					effort:
						d && d.efforts.length > 0
							? Number((d.efforts.reduce((a, b) => a + b, 0) / d.efforts.length).toFixed(1))
							: null,
					performance:
						d && d.performances.length > 0
							? Number(
									(d.performances.reduce((a, b) => a + b, 0) / d.performances.length).toFixed(1)
								)
							: null
				});
			}
		}

		// --- Visualization Data: reshape for PerformanceEffortChart ---
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

		if (isOnboardingComplete && heatMapWeeks && heatMapWeeks.length > 0) {
			const individual = heatMapWeeks.map((w) => ({
				weekNumber: w.weekNumber,
				effortScore: w.effort,
				performanceScore: w.performance
			}));

			const stakeholders = allFeedbacks
				.filter((fb) => fb.reflection !== null)
				.map((fb) => ({
					weekNumber: fb.reflection!.weekNumber,
					stakeholderId: fb.stakeholderId,
					stakeholderName: stakeholderNameMap.get(fb.stakeholderId) ?? 'Unknown',
					effortScore: fb.effortScore,
					performanceScore: fb.performanceScore
				}));

			const stakeholderList = objective.stakeholders.map((s) => ({ id: s.id, name: s.name }));

			visualizationData = { individual, stakeholders, stakeholderList };
		}

		// --- Perception Gaps: per-stakeholder self-vs-stakeholder comparison ---
		let perceptionGaps: Array<{
			stakeholderId: string;
			stakeholderName: string;
			effortGap: number | null;
			performanceGap: number | null;
			effortGapTrend: 'widening' | 'closing' | 'stable' | null;
			performanceGapTrend: 'widening' | 'closing' | 'stable' | null;
			maxAbsGap: number;
		}> | null = null;

		if (cycle && currentWeek && isOnboardingComplete && totalWeeks && allFeedbacks.length > 0) {
			// Build per-stakeholder, per-week buckets
			const shWeekMap = new Map<
				string,
				{ name: string; weeks: Map<number, { efforts: number[]; performances: number[] }> }
			>();

			for (const fb of allFeedbacks) {
				if (!fb.reflection) continue;
				const wk = fb.reflection.weekNumber;
				const shId = fb.stakeholderId;

				if (!shWeekMap.has(shId)) {
					shWeekMap.set(shId, {
						name: stakeholderNameMap.get(shId) ?? 'Unknown',
						weeks: new Map()
					});
				}
				const sh = shWeekMap.get(shId)!;
				if (!sh.weeks.has(wk)) {
					sh.weeks.set(wk, { efforts: [], performances: [] });
				}
				const w = sh.weeks.get(wk)!;
				if (fb.effortScore !== null) w.efforts.push(fb.effortScore);
				if (fb.performanceScore !== null) w.performances.push(fb.performanceScore);
			}

			// Self scores per week
			const selfWeekMap = new Map<number, { efforts: number[]; performances: number[] }>();
			for (const r of cycle.reflections) {
				if (!selfWeekMap.has(r.weekNumber)) {
					selfWeekMap.set(r.weekNumber, { efforts: [], performances: [] });
				}
				const w = selfWeekMap.get(r.weekNumber)!;
				if (r.effortScore !== null) w.efforts.push(r.effortScore);
				if (r.performanceScore !== null) w.performances.push(r.performanceScore);
			}

			perceptionGaps = Array.from(shWeekMap.entries())
				.map(([shId, sh]) => {
					const pairedWeeks: Array<{
						weekNumber: number;
						selfEffort: number;
						selfPerf: number;
						stkEffort: number;
						stkPerf: number;
					}> = [];

					for (const [wk, stkScores] of sh.weeks) {
						const selfScores = selfWeekMap.get(wk);
						if (!selfScores) continue;

						const selfEff =
							selfScores.efforts.length > 0
								? selfScores.efforts.reduce((a, b) => a + b, 0) / selfScores.efforts.length
								: null;
						const selfPrf =
							selfScores.performances.length > 0
								? selfScores.performances.reduce((a, b) => a + b, 0) /
									selfScores.performances.length
								: null;
						const stkEff =
							stkScores.efforts.length > 0
								? stkScores.efforts.reduce((a, b) => a + b, 0) / stkScores.efforts.length
								: null;
						const stkPrf =
							stkScores.performances.length > 0
								? stkScores.performances.reduce((a, b) => a + b, 0) / stkScores.performances.length
								: null;

						if (selfEff !== null && stkEff !== null && selfPrf !== null && stkPrf !== null) {
							pairedWeeks.push({
								weekNumber: wk,
								selfEffort: selfEff,
								selfPerf: selfPrf,
								stkEffort: stkEff,
								stkPerf: stkPrf
							});
						}
					}

					pairedWeeks.sort((a, b) => a.weekNumber - b.weekNumber);

					if (pairedWeeks.length === 0) {
						return {
							stakeholderId: shId,
							stakeholderName: sh.name,
							effortGap: null,
							performanceGap: null,
							effortGapTrend: null as 'widening' | 'closing' | 'stable' | null,
							performanceGapTrend: null as 'widening' | 'closing' | 'stable' | null,
							maxAbsGap: 0
						};
					}

					const latest = pairedWeeks[pairedWeeks.length - 1];
					const effortGap = Number((latest.selfEffort - latest.stkEffort).toFixed(1));
					const performanceGap = Number((latest.selfPerf - latest.stkPerf).toFixed(1));

					function computeTrend(
						pairs: typeof pairedWeeks,
						getSelfScore: (p: (typeof pairedWeeks)[0]) => number,
						getStkScore: (p: (typeof pairedWeeks)[0]) => number
					): 'widening' | 'closing' | 'stable' | null {
						if (pairs.length < 2) return null;
						const recent = pairs.slice(-3);
						const gaps = recent.map((p) => Math.abs(getSelfScore(p) - getStkScore(p)));
						if (gaps.length < 2) return null;

						let totalDelta = 0;
						for (let i = 1; i < gaps.length; i++) {
							totalDelta += gaps[i] - gaps[i - 1];
						}
						const avgDelta = totalDelta / (gaps.length - 1);

						if (avgDelta > 0.5) return 'widening';
						if (avgDelta < -0.5) return 'closing';
						return 'stable';
					}

					const effortGapTrend = computeTrend(
						pairedWeeks,
						(p) => p.selfEffort,
						(p) => p.stkEffort
					);
					const performanceGapTrend = computeTrend(
						pairedWeeks,
						(p) => p.selfPerf,
						(p) => p.stkPerf
					);
					const maxAbsGap = Math.max(Math.abs(effortGap), Math.abs(performanceGap));

					return {
						stakeholderId: shId,
						stakeholderName: sh.name,
						effortGap,
						performanceGap,
						effortGapTrend,
						performanceGapTrend,
						maxAbsGap
					};
				})
				.filter((g) => g.effortGap !== null || g.performanceGap !== null);
		}

		// --- Latest AI Insight ---
		let latestInsight: {
			id: string;
			content: string | null;
			type: string;
			weekNumber: number | null;
			createdAt: string;
		} | null = null;

		if (cycle && isOnboardingComplete) {
			const insight = await prisma.insight.findFirst({
				where: {
					userId: dbUser.id,
					cycleId: cycle.id,
					status: 'COMPLETED',
					type: { in: ['CHECK_IN', 'WEEKLY_SYNTHESIS'] }
				},
				orderBy: { createdAt: 'desc' },
				select: { id: true, content: true, type: true, weekNumber: true, createdAt: true }
			});

			if (insight) {
				latestInsight = {
					id: insight.id,
					content: insight.content,
					type: insight.type,
					weekNumber: insight.weekNumber,
					createdAt: insight.createdAt.toISOString()
				};
			}
		}

		// Compute the next check-in day name for the welcome card
		const dayNameMap: Record<string, string> = {
			mon: 'Monday',
			tue: 'Tuesday',
			wed: 'Wednesday',
			thu: 'Thursday',
			fri: 'Friday',
			sat: 'Saturday',
			sun: 'Sunday'
		};
		const checkInDayLabels = cycle
			? parseCheckInDays(cycle.checkInFrequency ?? '3x').map((d) => dayNameMap[d] ?? d)
			: [];
		const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const todayIndex = new Date().getDay();
		const nextCheckInDay =
			checkInDayLabels.length > 0
				? checkInDayLabels
						.map((d) => ({ day: d, dist: (dayOrder.indexOf(d) - todayIndex + 7) % 7 || 7 }))
						.sort((a, b) => a.dist - b.dist)[0].day
				: 'Friday';

		return {
			isFirstVisit,
			isOnboardingComplete,
			nextCheckInDay,
			coachName: coachClient?.coach?.name ?? null,
			objective: objective
				? {
						id: objective.id,
						title: objective.title,
						subgoals: objective.subgoals.map((s) => ({ id: s.id, label: s.label }))
					}
				: null,
			summary: isOnboardingComplete
				? {
						completionRate,
						currentStreak,
						totalCompleted,
						totalExpected,
						openExperiences,
						totalStakeholders: objective.stakeholders.length
					}
				: null,
			cycle: cycle
				? {
						id: cycle.id,
						startDate: cycle.startDate.toISOString(),
						endDate: cycle.endDate?.toISOString() ?? null,
						isOverdue: !!(currentWeek && totalWeeks && currentWeek > totalWeeks),
						isCycleCompleted: cycle.status === 'COMPLETED'
					}
				: null,
			currentWeek,
			totalWeeks,
			nextAction,
			myLastRatings,
			stakeholdersLastRatings,
			perceptionGaps,
			latestInsight,
			visualizationData: isOnboardingComplete ? visualizationData : null
		};
	} catch (error: unknown) {
		const errMsg = error instanceof Error ? error.message : 'Unknown error';
		const errStack = error instanceof Error ? error.stack : undefined;
		console.error('[individual:error] Failed to load individual page', {
			error: errMsg,
			stack: errStack
		});
		throw error;
	}
};
