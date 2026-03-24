import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import {
	computeCompletionMetrics,
	computeNextAction,
	computeNextCheckInDay
} from '$lib/server/hubMetrics';
import type { PageServerLoad } from './$types';

export type MaturityStage = 'new' | 'growing' | 'established';

function getMaturityStage(reflectionCount: number): MaturityStage {
	if (reflectionCount >= 12) return 'established';
	if (reflectionCount >= 4) return 'growing';
	return 'new';
}

function computeTotalWeeks(startDate: Date, endDate: Date | null, currentWeek: number): number {
	if (endDate) {
		return Math.max(
			1,
			Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
		);
	}
	return currentWeek;
}

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const { objective, cycle, currentWeek } = await event.parent();

	const [hasAnyObjective, coachClient, latestInsight, feedbacks] = await Promise.all([
		prisma.objective.findFirst({
			where: { userId: dbUser.id },
			select: { id: true }
		}),
		prisma.coachClient.findFirst({
			where: { individualId: dbUser.id },
			select: { coach: { select: { name: true } } }
		}),
		cycle
			? prisma.insight.findFirst({
					where: {
						userId: dbUser.id,
						cycleId: cycle.id,
						status: 'COMPLETED',
						type: { in: ['CHECK_IN', 'WEEKLY_SYNTHESIS'] }
					},
					orderBy: { createdAt: 'desc' },
					select: { id: true, content: true, type: true, weekNumber: true, createdAt: true }
				})
			: null,
		cycle
			? prisma.feedback.findMany({
					where: { reflection: { cycleId: cycle.id } },
					select: {
						effortScore: true,
						performanceScore: true,
						reflection: { select: { weekNumber: true } }
					}
				})
			: []
	]);

	const isFirstVisit = !hasAnyObjective;
	const isOnboardingComplete = !!(objective && cycle);
	const checkInFrequency = cycle?.checkInFrequency ?? '3x';
	const reflections = cycle?.reflections ?? [];

	// Early return for incomplete onboarding
	if (!cycle || !currentWeek || !isOnboardingComplete) {
		return {
			isFirstVisit,
			isOnboardingComplete: false,
			maturityStage: 'new' as MaturityStage,
			nextCheckInDay: computeNextCheckInDay(checkInFrequency),
			coachName: coachClient?.coach?.name ?? null,
			objective: objective
				? {
						id: objective.id,
						title: objective.title,
						subgoals: objective.subgoals.map((s) => ({ id: s.id, label: s.label }))
					}
				: null,
			summary: null,
			cycle: null,
			currentWeek: null,
			totalWeeks: null,
			nextAction: null,
			latestInsight: null
		};
	}

	const totalWeeks = computeTotalWeeks(cycle.startDate, cycle.endDate ?? null, currentWeek);
	const summary = computeCompletionMetrics(reflections, currentWeek, checkInFrequency);
	const nextAction = computeNextAction(reflections, currentWeek, checkInFrequency);
	const maturityStage = getMaturityStage(reflections.length);

	// Compute the three signals: effort trend, performance trend, perception gap
	const effortScores = reflections
		.filter((r) => r.effortScore != null)
		.sort((a, b) => a.weekNumber - b.weekNumber)
		.map((r) => ({ week: r.weekNumber, score: r.effortScore! }));
	const perfScores = reflections
		.filter((r) => r.performanceScore != null)
		.sort((a, b) => a.weekNumber - b.weekNumber)
		.map((r) => ({ week: r.weekNumber, score: r.performanceScore! }));

	const avg = (arr: number[]) =>
		arr.length > 0 ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
	const trend = (scores: Array<{ week: number; score: number }>) => {
		if (scores.length < 2) return { direction: 'flat' as const, delta: 0 };
		const recent = scores.slice(-3).map((s) => s.score);
		const earlier = scores.slice(0, Math.max(1, scores.length - 3)).map((s) => s.score);
		const recentAvg = avg(recent)!;
		const earlierAvg = avg(earlier)!;
		const d = +(recentAvg - earlierAvg).toFixed(1);
		return {
			direction: d > 0.3 ? ('up' as const) : d < -0.3 ? ('down' as const) : ('flat' as const),
			delta: d
		};
	};

	const selfEffortAvg = avg(effortScores.map((s) => s.score));
	const selfPerfAvg = avg(perfScores.map((s) => s.score));
	const effortTrend = trend(effortScores);
	const perfTrend = trend(perfScores);

	// Perception gap
	const revEffortScores = feedbacks.filter((f) => f.effortScore != null).map((f) => f.effortScore!);
	const revPerfScores = feedbacks
		.filter((f) => f.performanceScore != null)
		.map((f) => f.performanceScore!);
	const revEffortAvg = avg(revEffortScores);
	const revPerfAvg = avg(revPerfScores);
	const effortGap =
		selfEffortAvg != null && revEffortAvg != null
			? +(selfEffortAvg - revEffortAvg).toFixed(1)
			: null;
	const perfGap =
		selfPerfAvg != null && revPerfAvg != null ? +(selfPerfAvg - revPerfAvg).toFixed(1) : null;

	return {
		isFirstVisit,
		isOnboardingComplete,
		maturityStage,
		nextCheckInDay: computeNextCheckInDay(checkInFrequency),
		coachName: coachClient?.coach?.name ?? null,
		objective: {
			id: objective.id,
			title: objective.title,
			subgoals: objective.subgoals.map((s) => ({ id: s.id, label: s.label }))
		},
		summary: {
			...summary,
			totalStakeholders: objective.stakeholders.length
		},
		cycle: {
			id: cycle.id,
			startDate: cycle.startDate.toISOString(),
			endDate: cycle.endDate?.toISOString() ?? null,
			isOverdue: currentWeek > totalWeeks,
			isCycleCompleted: cycle.status === 'COMPLETED'
		},
		currentWeek,
		totalWeeks,
		nextAction,
		latestInsight: latestInsight
			? {
					id: latestInsight.id,
					content: latestInsight.content,
					type: latestInsight.type,
					weekNumber: latestInsight.weekNumber,
					createdAt: latestInsight.createdAt.toISOString()
				}
			: null,
		signals: {
			effort: { avg: selfEffortAvg, trend: effortTrend },
			performance: { avg: selfPerfAvg, trend: perfTrend },
			reviewerEffort: { avg: revEffortAvg },
			reviewerPerformance: { avg: revPerfAvg },
			effortGap,
			perfGap,
			hasFeedback: feedbacks.length > 0
		}
	};
};
