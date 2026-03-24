import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { getActiveObjectiveWithCycle } from '$lib/server/individualContext';
import {
	computeMyLastRatings,
	computeStakeholdersLastRatings,
	computePerceptionGaps
} from '$lib/server/hubMetrics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const result = await getActiveObjectiveWithCycle(dbUser.id);
	if (!result?.cycle) {
		throw error(404, 'No active cycle');
	}

	const { objective, cycle } = result;
	const reflections = cycle.reflections ?? [];
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
	const perceptionGaps =
		allFeedbacks.length > 0
			? computePerceptionGaps(allFeedbacks, reflections, stakeholderRefs)
			: null;

	const uniqueRatedStakeholders = new Set(allFeedbacks.map((f) => f.stakeholderId)).size;

	return json({
		myLastRatings,
		stakeholdersLastRatings,
		perceptionGaps,
		hasMultipleStakeholderRatings: uniqueRatedStakeholders >= 2,
		totalStakeholders: objective.stakeholders.length
	});
};
