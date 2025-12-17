import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { buildClientSummary } from '$lib/server/buildClientSummary';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'COACH');

	const coachClients = await prisma.coachClient.findMany({
		where: { coachId: dbUser.id },
		orderBy: [
			{ archivedAt: 'asc' },
			{ createdAt: 'asc' }
		],
		select: {
			id: true,
			individualId: true,
			createdAt: true,
			archivedAt: true
		}
	});

	const individualIds = coachClients.map((entry) => entry.individualId);

	const individuals = individualIds.length
		? await prisma.user.findMany({
				where: {
					id: { in: individualIds }
				},
				select: {
					id: true,
					email: true,
					name: true,
					objectives: {
						where: { active: true },
						orderBy: { createdAt: 'desc' },
						include: {
							subgoals: {
								orderBy: { createdAt: 'asc' },
								select: {
									id: true,
									label: true,
									description: true
								}
							},
							cycles: {
								orderBy: { startDate: 'desc' },
								take: 1,
								include: {
									reflections: {
										orderBy: { submittedAt: 'desc' },
										select: {
											id: true,
											weekNumber: true,
											reflectionType: true,
											submittedAt: true,
											effortScore: true,
											performanceScore: true,
											notes: true
										}
									},
									coachNotes: {
										where: { coachId: dbUser.id },
										orderBy: { createdAt: 'desc' },
										take: 3,
										select: {
											id: true,
											content: true,
											weekNumber: true,
											createdAt: true
										}
									}
								}
							},
							stakeholders: {
								orderBy: { createdAt: 'asc' },
								include: {
									feedbacks: {
										orderBy: { submittedAt: 'desc' },
										take: 10,
										select: {
											submittedAt: true,
											effortScore: true,
											performanceScore: true,
											reflection: {
												select: {
													weekNumber: true,
													effortScore: true,
													performanceScore: true
												}
											}
										}
									}
								}
							}
						}
					}
				}
			})
		: [];

	const individualLookup = new Map(individuals.map((individual) => [individual.id, individual]));

	const clientSummaries = coachClients
		.map((relationship) => {
			const individual = individualLookup.get(relationship.individualId);
			if (!individual) return null;
			return buildClientSummary(relationship, individual);
		})
		.filter((value): value is NonNullable<typeof value> => value !== null);

	// Calculate analytics
	const totalAlerts = clientSummaries.reduce((sum, client) => sum + client.alerts.length, 0);
	const highPriorityAlerts = clientSummaries.reduce(
		(sum, client) => sum + client.alerts.filter((a) => a.severity === 'high').length,
		0
	);
	const mediumPriorityAlerts = clientSummaries.reduce(
		(sum, client) => sum + client.alerts.filter((a) => a.severity === 'medium').length,
		0
	);
	const lowPriorityAlerts = clientSummaries.reduce(
		(sum, client) => sum + client.alerts.filter((a) => a.severity === 'low').length,
		0
	);

	const consistencyScores = clientSummaries
		.map((c) => c.objective?.insights?.consistencyScore)
		.filter((s): s is number => s !== null);
	const avgConsistency =
		consistencyScores.length > 0
			? Math.round(consistencyScores.reduce((sum, s) => sum + s, 0) / consistencyScores.length)
			: null;

	const alignmentRatios = clientSummaries
		.map((c) => c.objective?.insights?.alignmentRatio)
		.filter((r): r is number => r !== null);
	const avgAlignment =
		alignmentRatios.length > 0
			? Math.round((alignmentRatios.reduce((sum, r) => sum + r, 0) / alignmentRatios.length) * 100)
			: null;

	const avgEffortScores = clientSummaries
		.map((c) => c.objective?.insights?.avgEffort)
		.filter((e): e is number => e !== null);
	const overallAvgEffort =
		avgEffortScores.length > 0
			? Number((avgEffortScores.reduce((sum, e) => sum + e, 0) / avgEffortScores.length).toFixed(1))
			: null;

	const avgProgressScores = clientSummaries
		.map((c) => c.objective?.insights?.avgProgress)
		.filter((p): p is number => p !== null);
	const overallAvgProgress =
		avgProgressScores.length > 0
			? Number(
					(avgProgressScores.reduce((sum, p) => sum + p, 0) / avgProgressScores.length).toFixed(1)
				)
			: null;

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		clients: clientSummaries,
		analytics: {
			totalAlerts,
			highPriorityAlerts,
			mediumPriorityAlerts,
			lowPriorityAlerts,
			avgConsistency,
			avgAlignment,
			overallAvgEffort,
			overallAvgProgress
		}
	};
};

