import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildClientSummary } from '$lib/server/buildClientSummary';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'COACH');

	// Redirect new coaches to onboarding (skip if already completed or has clients)
	if (!dbUser.coachOnboardingCompletedAt) {
		const clientCount = await prisma.coachClient.count({
			where: { coachId: dbUser.id }
		});
		if (clientCount === 0) {
			throw redirect(307, '/coach/onboarding');
		}
		// Backfill for existing coaches with clients
		await prisma.user.update({
			where: { id: dbUser.id },
			data: { coachOnboardingCompletedAt: new Date() }
		});
	}

	// Load minimal data for hub overview
	const coachClients = await prisma.coachClient.findMany({
		where: { coachId: dbUser.id },
		select: {
			id: true,
			individualId: true,
			createdAt: true,
			archivedAt: true
		}
	});

	const individualIds = coachClients.map((entry) => entry.individualId);

	// Load individuals with full relations for summary calculations
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
						take: 1,
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

	// Build minimal client summaries for metrics only
	const clientSummaries = coachClients
		.map((relationship) => {
			const individual = individualLookup.get(relationship.individualId);
			if (!individual) return null;
			return buildClientSummary(relationship, individual);
		})
		.filter((value): value is NonNullable<typeof value> => value !== null);

	const invitations = await prisma.coachInvite.findMany({
		where: { coachId: dbUser.id },
		select: {
			id: true,
			acceptedAt: true,
			cancelledAt: true,
			expiresAt: true
		}
	});

	// Calculate summary metrics
	const totalAlerts = clientSummaries.reduce((sum, client) => sum + client.alerts.length, 0);

	const activeSummaries = clientSummaries.filter((c) => !c.archived);
	const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

	// Build at-risk client list (top alert banner)
	const atRiskClients = activeSummaries
		.filter((c) => c.alerts.length > 0)
		.sort((a, b) => {
			const maxSev = (alerts: typeof a.alerts) =>
				Math.max(0, ...alerts.map((al) => severityOrder[al.severity] ?? 0));
			return maxSev(b.alerts) - maxSev(a.alerts) || b.alerts.length - a.alerts.length;
		})
		.slice(0, 5)
		.map((c) => ({
			id: c.id,
			name: c.name,
			objective: c.objective?.title ?? null,
			topAlert: c.alerts.sort(
				(a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0)
			)[0],
			trajectory: c.objective?.insights?.trajectoryScore ?? null,
			completionPct: c.objective?.cycle ? Math.round(c.objective.cycle.completion) : null
		}));

	// Build full active client list (at-risk first, then healthy, sorted by name)
	const atRiskIds = new Set(atRiskClients.map((c) => c.id));
	const healthyClients = activeSummaries
		.filter((c) => !atRiskIds.has(c.id))
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((c) => ({
			id: c.id,
			name: c.name,
			objective: c.objective?.title ?? null,
			trajectory: c.objective?.insights?.trajectoryScore ?? null,
			completionPct: c.objective?.cycle ? Math.round(c.objective.cycle.completion) : null
		}));

	// Portfolio metrics
	const completionValues = activeSummaries
		.map((c) => c.objective?.cycle?.completion)
		.filter((v): v is number => v != null);
	const avgCompletion =
		completionValues.length > 0
			? Math.round(completionValues.reduce((s, v) => s + v, 0) / completionValues.length)
			: null;

	const totalStakeholders = activeSummaries.reduce(
		(sum, c) => sum + (c.objective?.stakeholderCount ?? 0),
		0
	);
	const respondedStakeholders = activeSummaries.reduce(
		(sum, c) => sum + (c.objective?.respondedStakeholders ?? 0),
		0
	);
	const feedbackRate =
		totalStakeholders > 0 ? Math.round((respondedStakeholders / totalStakeholders) * 100) : null;

	const totalReflectionsThisWeek = activeSummaries.reduce((sum, c) => {
		const cycle = c.objective?.cycle;
		if (!cycle?.recentReflections?.length) return sum;
		const currentWeek = cycle.currentWeek;
		if (currentWeek == null) return sum;
		return sum + cycle.recentReflections.filter((r) => r.weekNumber === currentWeek).length;
	}, 0);

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		rosterSummary: {
			total: coachClients.length,
			active: coachClients.filter((entry) => entry.archivedAt === null).length,
			archived: coachClients.filter((entry) => entry.archivedAt !== null).length,
			pendingInvites: invitations.filter(
				(invite) => !invite.acceptedAt && !invite.cancelledAt && invite.expiresAt > new Date()
			).length
		},
		analytics: {
			totalAlerts
		},
		portfolio: {
			avgCompletion,
			feedbackRate,
			reflectionsThisWeek: totalReflectionsThisWeek
		},
		atRiskClients,
		healthyClients
	};
};
