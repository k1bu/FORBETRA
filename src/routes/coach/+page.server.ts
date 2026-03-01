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

	// Coach activity — total notes written
	const noteCount = await prisma.coachNote.count({
		where: { coachId: dbUser.id }
	});

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
	const highPriorityAlerts = clientSummaries.reduce(
		(sum, client) => sum + client.alerts.filter((a) => a.severity === 'high').length,
		0
	);
	const stabilityScores = clientSummaries
		.map((c) => c.objective?.insights?.stabilityScore)
		.filter((s): s is number => s != null);
	const avgStability =
		stabilityScores.length > 0
			? Math.round(stabilityScores.reduce((sum, s) => sum + s, 0) / stabilityScores.length)
			: null;
	const alignmentRatios = clientSummaries
		.map((c) => c.objective?.insights?.alignmentRatio)
		.filter((r): r is number => r !== null);
	const avgAlignment =
		alignmentRatios.length > 0
			? Math.round((alignmentRatios.reduce((sum, r) => sum + r, 0) / alignmentRatios.length) * 100)
			: null;

	// Get recent alerts for preview (top 5 high priority)
	const recentAlerts = clientSummaries
		.flatMap((client) =>
			client.alerts.map((alert) => ({
				clientName: client.name,
				clientId: client.id,
				alert
			}))
		)
		.sort((a, b) => {
			const severityOrder = { high: 3, medium: 2, low: 1 };
			return severityOrder[b.alert.severity] - severityOrder[a.alert.severity];
		})
		.slice(0, 5);

	// Build at-risk client list (top 5 with alerts, sorted by severity)
	const activeSummaries = clientSummaries.filter((c) => !c.archived);
	const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
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
			completionPct: c.objective?.cycle ? Math.round(c.objective.cycle.completion * 100) : null
		}));

	// Portfolio insight — how many clients are improving/declining/stable
	const improving = activeSummaries.filter(
		(c) => (c.objective?.insights?.trajectoryScore ?? 0) > 5
	).length;
	const declining = activeSummaries.filter(
		(c) => (c.objective?.insights?.trajectoryScore ?? 0) < -5
	).length;

	// Portfolio momentum — week-over-week avg effort/perf change
	const effortDeltas: number[] = [];
	const perfDeltas: number[] = [];
	for (const client of activeSummaries) {
		const refs = client.objective?.cycle?.recentReflections;
		if (!refs || refs.length < 2) continue;
		const curr = refs[0];
		const prev = refs[1];
		if (curr.effortScore !== null && prev.effortScore !== null) {
			effortDeltas.push(curr.effortScore - prev.effortScore);
		}
		if (curr.performanceScore !== null && prev.performanceScore !== null) {
			perfDeltas.push(curr.performanceScore - prev.performanceScore);
		}
	}
	const portfolioMomentum =
		effortDeltas.length > 0 || perfDeltas.length > 0
			? {
					effortDelta:
						effortDeltas.length > 0
							? Number((effortDeltas.reduce((s, d) => s + d, 0) / effortDeltas.length).toFixed(1))
							: null,
					perfDelta:
						perfDeltas.length > 0
							? Number((perfDeltas.reduce((s, d) => s + d, 0) / perfDeltas.length).toFixed(1))
							: null
				}
			: null;

	// Portfolio wins — positive highlights for emotional engagement
	const portfolioWins: Array<{ clientName: string; clientId: string; message: string }> = [];
	for (const client of activeSummaries) {
		const refs = client.objective?.cycle?.recentReflections;
		if (refs && refs.length >= 2) {
			const latest = refs[0];
			const prior = refs.slice(1);
			// Personal best: latest effort or performance is highest in window
			if (
				latest.effortScore !== null &&
				prior.every((r) => r.effortScore === null || latest.effortScore! >= r.effortScore)
			) {
				const priorMax = Math.max(
					...prior.filter((r) => r.effortScore !== null).map((r) => r.effortScore!)
				);
				if (latest.effortScore > priorMax) {
					portfolioWins.push({
						clientName: client.name,
						clientId: client.id,
						message: `Hit a personal best in effort (${latest.effortScore}/10)`
					});
				}
			}
			if (
				latest.performanceScore !== null &&
				prior.every(
					(r) => r.performanceScore === null || latest.performanceScore! >= r.performanceScore
				)
			) {
				const priorMax = Math.max(
					...prior.filter((r) => r.performanceScore !== null).map((r) => r.performanceScore!)
				);
				if (latest.performanceScore > priorMax) {
					portfolioWins.push({
						clientName: client.name,
						clientId: client.id,
						message: `Hit a personal best in performance (${latest.performanceScore}/10)`
					});
				}
			}
		}
		// Near completion
		const completion = client.objective?.cycle
			? Math.round(client.objective.cycle.completion * 100)
			: 0;
		if (completion >= 90 && completion < 100) {
			portfolioWins.push({
				clientName: client.name,
				clientId: client.id,
				message: `${completion}% through their cycle — almost there`
			});
		}
	}
	// Keep top 3, deduplicate by client (prefer first win per client)
	const seenClients = new Set<string>();
	const topWins = portfolioWins
		.filter((w) => {
			if (seenClients.has(w.clientId)) return false;
			seenClients.add(w.clientId);
			return true;
		})
		.slice(0, 3);

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
			totalAlerts,
			highPriorityAlerts,
			avgStability,
			avgAlignment
		},
		recentAlerts,
		atRiskClients,
		portfolioInsight: {
			improving,
			declining,
			stable: activeSummaries.length - improving - declining,
			total: activeSummaries.length
		},
		portfolioMomentum,
		portfolioWins: topWins,
		coachActivity: { noteCount }
	};
};
