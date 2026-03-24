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

	const [hasAnyObjective, coachClient, latestInsight] = await Promise.all([
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
			: null
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
			: null
	};
};
