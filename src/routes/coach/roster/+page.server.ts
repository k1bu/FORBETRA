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
											progressScore: true,
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
											progressScore: true,
											reflection: {
												select: {
													weekNumber: true,
													effortScore: true,
													progressScore: true
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

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		clients: clientSummaries
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

		const weekNumber = weekNumberRaw ? parseInt(weekNumberRaw, 10) : null;
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
	}
};

