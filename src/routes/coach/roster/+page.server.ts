import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
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

	// Load latest COACH_PREP insights per client
	const clientIds = clientSummaries.map((c) => c.id);
	const coachPrepInsights = clientIds.length
		? await prisma.insight.findMany({
				where: {
					userId: { in: clientIds },
					type: 'COACH_PREP',
					status: 'COMPLETED'
				},
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					userId: true,
					content: true,
					createdAt: true
				}
			})
		: [];

	// Map to latest per client
	const coachPrepMap: Record<string, { id: string; content: string | null; createdAt: Date }> = {};
	for (const insight of coachPrepInsights) {
		if (!coachPrepMap[insight.userId]) {
			coachPrepMap[insight.userId] = {
				id: insight.id,
				content: insight.content,
				createdAt: insight.createdAt
			};
		}
	}

	// Check for COACH_ALERT insights
	const coachAlerts = clientIds.length
		? await prisma.insight.findMany({
				where: {
					userId: { in: clientIds },
					type: 'COACH_ALERT',
					status: 'COMPLETED',
					createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
				},
				select: {
					userId: true,
					content: true
				}
			})
		: [];

	const alertMap: Record<string, string[]> = {};
	for (const alert of coachAlerts) {
		if (!alertMap[alert.userId]) alertMap[alert.userId] = [];
		if (alert.content) alertMap[alert.userId].push(alert.content);
	}

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		clients: clientSummaries,
		coachPrepMap,
		alertMap
	};
};

export const actions: Actions = {
	createNote: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');

		const formData = await event.request.formData();
		const individualId = String(formData.get('individualId') ?? '').trim();
		const cycleId = String(formData.get('cycleId') ?? '').trim();
		const weekNumberRaw = String(formData.get('weekNumber') ?? '').trim();
		const content = String(formData.get('content') ?? '').trim();

		if (!individualId) {
			return fail(400, { error: 'Client identifier is required.' });
		}

		if (!content || content.length < 10) {
			return fail(400, { error: 'Note content must be at least 10 characters.' });
		}

		// Verify coach-client relationship
		const relationship = await prisma.coachClient.findUnique({
			where: {
				coachId_individualId: {
					coachId: dbUser.id,
					individualId
				}
			}
		});

		if (!relationship) {
			return fail(403, { error: 'You do not have access to this client.' });
		}

		let weekNumber = weekNumberRaw ? parseInt(weekNumberRaw, 10) : null;
		if (weekNumber !== null && isNaN(weekNumber)) weekNumber = null;
		const cycleIdOrNull = cycleId || null;

		try {
			await prisma.coachNote.create({
				data: {
					coachId: dbUser.id,
					individualId,
					cycleId: cycleIdOrNull,
					weekNumber,
					content
				}
			});

			return { noteSuccess: true };
		} catch (error) {
			console.error('Failed to create coach note', error);
			return fail(500, { noteError: 'Unable to save note. Please try again.' });
		}
	},
	archiveClient: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');
		const formData = await event.request.formData();
		const individualId = String(formData.get('individualId') ?? '').trim();
		const archive = String(formData.get('archive') ?? 'true') === 'true';

		if (!individualId) {
			return fail(400, { error: 'Client identifier is required.' });
		}

		const relationship = await prisma.coachClient.findUnique({
			where: {
				coachId_individualId: {
					coachId: dbUser.id,
					individualId
				}
			}
		});

		if (!relationship) {
			return fail(403, { error: 'You do not have access to this client.' });
		}

		await prisma.coachClient.update({
			where: {
				coachId_individualId: {
					coachId: dbUser.id,
					individualId
				}
			},
			data: {
				archivedAt: archive ? new Date() : null
			}
		});

		return { success: true };
	},
	updateCadence: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');
		const formData = await event.request.formData();
		const individualId = String(formData.get('individualId') ?? '').trim();
		const cycleId = String(formData.get('cycleId') ?? '').trim();
		const stakeholderCadence = String(formData.get('stakeholderCadence') ?? 'weekly').trim();
		const autoThrottle = formData.get('autoThrottle') === 'on';

		if (!individualId || !cycleId) {
			return fail(400, { error: 'Missing required fields.' });
		}

		const validCadences = ['every_checkin', 'weekly', 'monthly'];
		if (!validCadences.includes(stakeholderCadence)) {
			return fail(400, { error: 'Invalid cadence value.' });
		}

		// Verify coach-client relationship
		const relationship = await prisma.coachClient.findUnique({
			where: {
				coachId_individualId: {
					coachId: dbUser.id,
					individualId
				}
			}
		});

		if (!relationship) {
			return fail(403, { error: 'You do not have access to this client.' });
		}

		// Verify cycle belongs to the individual
		const cycle = await prisma.cycle.findFirst({
			where: { id: cycleId, userId: individualId }
		});

		if (!cycle) {
			return fail(404, { error: 'Cycle not found.' });
		}

		await prisma.cycle.update({
			where: { id: cycleId },
			data: { stakeholderCadence, autoThrottle }
		});

		return { cadenceSuccess: true };
	}
};

