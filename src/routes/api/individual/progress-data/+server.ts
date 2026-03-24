import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { getActiveObjectiveWithCycle } from '$lib/server/individualContext';
import {
	computeMyLastRatings,
	computeStakeholdersLastRatings,
	computeHeatMap,
	computeVisualizationData,
	computeCompletionMetrics
} from '$lib/server/hubMetrics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const result = await getActiveObjectiveWithCycle(dbUser.id);
	if (!result?.cycle) {
		throw error(404, 'No active cycle');
	}

	const { objective, cycle, currentWeek } = result;
	if (!currentWeek) {
		throw error(404, 'No active week');
	}

	const reflections = cycle.reflections ?? [];
	const checkInFrequency = cycle.checkInFrequency ?? '3x';
	const stakeholderRefs = objective.stakeholders.map((s) => ({ id: s.id, name: s.name }));

	const [allFeedbacks] = await Promise.all([
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
		})
	]);

	const myLastRatings = computeMyLastRatings(reflections);
	const stakeholdersLastRatings = computeStakeholdersLastRatings(allFeedbacks);
	const summary = computeCompletionMetrics(reflections, currentWeek, checkInFrequency);
	const { weeks: heatMapWeeks, totalWeeks } = computeHeatMap(
		reflections,
		currentWeek,
		cycle.startDate,
		cycle.endDate ?? null
	);
	const visualizationData =
		heatMapWeeks.length > 0
			? computeVisualizationData(heatMapWeeks, allFeedbacks, stakeholderRefs)
			: null;

	return json({
		myLastRatings,
		stakeholdersLastRatings,
		summary: { ...summary, totalStakeholders: objective.stakeholders.length },
		heatMapWeeks,
		totalWeeks,
		visualizationData
	});
};
