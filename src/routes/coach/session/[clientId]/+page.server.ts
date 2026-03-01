import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buildClientSummary } from '$lib/server/buildClientSummary';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'COACH');
	const clientId = event.params.clientId;

	// Verify coach-client relationship
	const relationship = await prisma.coachClient.findUnique({
		where: {
			coachId_individualId: {
				coachId: dbUser.id,
				individualId: clientId
			}
		}
	});

	if (!relationship) {
		throw error(404, 'Client not found');
	}

	// Load full individual data (same pattern as roster but for single client)
	const individual = await prisma.user.findUnique({
		where: { id: clientId },
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
	});

	if (!individual) {
		throw error(404, 'Client not found');
	}

	const client = buildClientSummary(
		{
			id: relationship.id,
			individualId: relationship.individualId,
			createdAt: relationship.createdAt,
			archivedAt: relationship.archivedAt
		},
		individual
	);

	if (!client) {
		throw error(404, 'Client not found');
	}

	// Load latest COACH_PREP insight
	const coachPrep = await prisma.insight.findFirst({
		where: {
			userId: clientId,
			type: 'COACH_PREP',
			status: 'COMPLETED'
		},
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			content: true,
			createdAt: true
		}
	});

	// Load COACH_ALERT insights (last 7 days)
	const alerts = await prisma.insight.findMany({
		where: {
			userId: clientId,
			type: 'COACH_ALERT',
			status: 'COMPLETED',
			createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
		},
		select: {
			content: true,
			createdAt: true
		}
	});

	// Determine AI prep freshness (has new data arrived since prep was generated?)
	let prepFreshness: { isStale: boolean; newDataSince: number } | null = null;
	if (coachPrep) {
		const prepTime = coachPrep.createdAt.getTime();
		const reflections = individual.objectives[0]?.cycles[0]?.reflections ?? [];
		const stakeholders = individual.objectives[0]?.stakeholders ?? [];

		const newReflections = reflections.filter(
			(r) => r.submittedAt && r.submittedAt.getTime() > prepTime
		).length;
		const newFeedbacks = stakeholders.reduce((count, s) => {
			return (
				count +
				s.feedbacks.filter((f) => f.submittedAt && f.submittedAt.getTime() > prepTime).length
			);
		}, 0);

		prepFreshness = {
			isStale: newReflections + newFeedbacks > 0,
			newDataSince: newReflections + newFeedbacks
		};
	}

	// Load ALL coach notes (not limited to 3)
	const cycle = individual.objectives[0]?.cycles[0] ?? null;
	const allCoachNotes = cycle
		? await prisma.coachNote.findMany({
				where: {
					coachId: dbUser.id,
					individualId: clientId,
					cycleId: cycle.id
				},
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					content: true,
					weekNumber: true,
					createdAt: true
				}
			})
		: [];

	// Load all reflections for the current cycle
	const allReflections = cycle
		? cycle.reflections.map((r) => ({
				id: r.id,
				weekNumber: r.weekNumber,
				reflectionType: r.reflectionType,
				submittedAt: r.submittedAt?.toISOString() ?? null,
				effortScore: r.effortScore,
				performanceScore: r.performanceScore,
				notes: r.notes
			}))
		: [];

	// Extract subgoals from objective
	const subgoals = individual.objectives[0]?.subgoals ?? [];

	// Extract stakeholder feedback trends (last 2 per stakeholder)
	const stakeholderTrends = (individual.objectives[0]?.stakeholders ?? []).map((s) => {
		const latest = s.feedbacks[0] ?? null;
		const previous = s.feedbacks[1] ?? null;
		return {
			name: s.name,
			latestEffort: latest?.effortScore ?? null,
			latestPerformance: latest?.performanceScore ?? null,
			previousEffort: previous?.effortScore ?? null,
			previousPerformance: previous?.performanceScore ?? null
		};
	});

	return {
		client,
		subgoals,
		stakeholderTrends,
		coachPrep: coachPrep
			? {
					id: coachPrep.id,
					content: coachPrep.content,
					createdAt: coachPrep.createdAt.toISOString()
				}
			: null,
		prepFreshness,
		alerts: alerts
			.filter((a) => a.content)
			.map((a) => ({
				content: a.content!,
				createdAt: a.createdAt.toISOString()
			})),
		allReflections,
		allCoachNotes: allCoachNotes.map((n) => ({
			id: n.id,
			content: n.content,
			weekNumber: n.weekNumber,
			createdAt: n.createdAt.toISOString()
		})),
		cycleId: cycle?.id ?? null
	};
};

export const actions: Actions = {
	createNote: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');
		const clientId = event.params.clientId;

		const formData = await event.request.formData();
		const cycleId = String(formData.get('cycleId') ?? '').trim();
		const weekNumberRaw = String(formData.get('weekNumber') ?? '').trim();
		const content = String(formData.get('content') ?? '').trim();

		if (!content || content.length < 10) {
			return fail(400, { noteError: 'Note content must be at least 10 characters.' });
		}

		// Verify coach-client relationship
		const relationship = await prisma.coachClient.findUnique({
			where: {
				coachId_individualId: {
					coachId: dbUser.id,
					individualId: clientId
				}
			}
		});

		if (!relationship) {
			return fail(403, { noteError: 'You do not have access to this client.' });
		}

		const weekNumber = weekNumberRaw ? parseInt(weekNumberRaw, 10) : null;

		// Verify cycle exists if provided
		if (cycleId) {
			const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
			if (!cycle) {
				return fail(400, { noteError: 'Cycle no longer exists.' });
			}
		}

		await prisma.coachNote.create({
			data: {
				coachId: dbUser.id,
				individualId: clientId,
				cycleId: cycleId || null,
				weekNumber,
				content
			}
		});

		return { noteSuccess: true };
	}
};
