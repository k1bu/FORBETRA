import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import {
	computeCompletionMetrics,
	computeNextAction,
	computeMyLastRatings,
	computeStakeholdersLastRatings,
	computeHeatMap,
	computeVisualizationData,
	computePerceptionGaps,
	computeNextCheckInDay
} from '$lib/server/hubMetrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const { objective, cycle, currentWeek } = await event.parent();

	const [hasAnyObjective, coachClient] = await Promise.all([
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
	const isOnboardingComplete = !!(objective && cycle);
	const checkInFrequency = cycle?.checkInFrequency ?? '3x';
	const reflections = cycle?.reflections ?? [];

	// Early return for incomplete onboarding
	if (!cycle || !currentWeek || !isOnboardingComplete) {
		return {
			isFirstVisit,
			isOnboardingComplete: false,
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
			myLastRatings: null,
			stakeholdersLastRatings: null,
			perceptionGaps: null,
			latestInsight: null,
			visualizationData: null
		};
	}

	// Fetch feedbacks + latest insight in parallel
	const [allFeedbacks, latestInsight] = await Promise.all([
		prisma.feedback.findMany({
			where: { reflection: { cycleId: cycle.id } },
			select: {
				stakeholderId: true,
				effortScore: true,
				performanceScore: true,
				submittedAt: true,
				reflection: { select: { weekNumber: true } }
			},
			orderBy: { submittedAt: 'desc' }
		}),
		prisma.insight.findFirst({
			where: {
				userId: dbUser.id,
				cycleId: cycle.id,
				status: 'COMPLETED',
				type: { in: ['CHECK_IN', 'WEEKLY_SYNTHESIS'] }
			},
			orderBy: { createdAt: 'desc' },
			select: { id: true, content: true, type: true, weekNumber: true, createdAt: true }
		})
	]);

	// Pure computations
	const summary = computeCompletionMetrics(reflections, currentWeek, checkInFrequency);
	const nextAction = computeNextAction(reflections, currentWeek, checkInFrequency);
	const myLastRatings = computeMyLastRatings(reflections);
	const stakeholdersLastRatings = computeStakeholdersLastRatings(allFeedbacks);
	const { weeks: heatMapWeeks, totalWeeks } = computeHeatMap(
		reflections,
		currentWeek,
		cycle.startDate,
		cycle.endDate ?? null
	);
	const stakeholderRefs = objective.stakeholders.map((s) => ({ id: s.id, name: s.name }));
	const visualizationData =
		heatMapWeeks.length > 0
			? computeVisualizationData(heatMapWeeks, allFeedbacks, stakeholderRefs)
			: null;
	const perceptionGaps =
		allFeedbacks.length > 0
			? computePerceptionGaps(allFeedbacks, reflections, stakeholderRefs)
			: null;

	return {
		isFirstVisit,
		isOnboardingComplete,
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
		myLastRatings,
		stakeholdersLastRatings,
		perceptionGaps,
		latestInsight: latestInsight
			? {
					id: latestInsight.id,
					content: latestInsight.content,
					type: latestInsight.type,
					weekNumber: latestInsight.weekNumber,
					createdAt: latestInsight.createdAt.toISOString()
				}
			: null,
		visualizationData
	};
};
