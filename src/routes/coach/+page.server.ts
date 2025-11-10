import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import type { Actions, PageServerLoad } from './$types';
import type { TokenType } from '@prisma/client';

const toIsoDate = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const weeksBetween = (start: Date, end: Date) =>
	Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));

const computeWeekNumber = (startDate: Date) => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

const weekNumberForDate = (startDate: Date, target: Date) => {
	const diff = target.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

const stdDev = (values: number[]) => {
	if (values.length === 0) return null;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const variance =
		values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
	return Math.sqrt(variance);
};

const generateTokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

const createInviteToken = () => randomBytes(32).toString('hex');

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
								orderBy: { createdAt: 'asc' }
							},
							cycles: {
								orderBy: { startDate: 'desc' },
								take: 1,
								include: {
									reflections: {
										orderBy: { submittedAt: 'desc' },
										take: 5,
										select: {
											id: true,
											weekNumber: true,
											reflectionType: true,
											submittedAt: true,
											effortScore: true,
											progressScore: true,
											notes: true
										}
									}
								}
							},
							stakeholders: {
								orderBy: { createdAt: 'asc' },
								include: {
									feedbacks: {
										orderBy: { submittedAt: 'desc' },
										take: 1,
										select: {
											submittedAt: true,
											effortScore: true,
											progressScore: true
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

	const now = new Date();

	const clientSummaries = coachClients
		.map((relationship) => {
			const individual = individualLookup.get(relationship.individualId);
			if (!individual) {
				return null;
			}

		const objective = individual.objectives[0] ?? null;
		const cycle = objective?.cycles[0] ?? null;
		const cycleEnd = cycle?.endDate ?? null;
		const totalWeeks = cycle && cycleEnd ? weeksBetween(cycle.startDate, cycleEnd) : 0;
		const weeksElapsed = cycle
			? Math.max(
					0,
					Math.floor((now.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
				)
			: 0;
		const completion =
			totalWeeks > 0 ? Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100)) : 0;
		const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

		const reflectionTrendMap = new Map<
			number,
			{
				weekNumber: number;
				effortScores: number[];
				progressScores: number[];
			}
		>();

		cycle?.reflections.forEach((reflection) => {
			const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
				weekNumber: reflection.weekNumber,
				effortScores: [],
				progressScores: []
			};

			if (reflection.effortScore !== null && reflection.effortScore !== undefined) {
				weekEntry.effortScores.push(reflection.effortScore);
			}
			if (reflection.progressScore !== null && reflection.progressScore !== undefined) {
				weekEntry.progressScores.push(reflection.progressScore);
			}

			reflectionTrendMap.set(reflection.weekNumber, weekEntry);
		});

		const trendWeeks = Array.from(reflectionTrendMap.values())
			.sort((a, b) => b.weekNumber - a.weekNumber)
			.slice(0, 4);

		const effortSeries: number[] = [];
		const progressSeries: number[] = [];

		const reflectionTrend = trendWeeks.map((week) => {
			const effortAverage =
				week.effortScores.length > 0
					? Number(
							(
								week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length
							).toFixed(1)
						)
					: null;
			if (effortAverage !== null) effortSeries.push(effortAverage);

			const progressAverage =
				week.progressScores.length > 0
					? Number(
							(
								week.progressScores.reduce((sum, score) => sum + score, 0) /
								week.progressScores.length
							).toFixed(1)
						)
					: null;
			if (progressAverage !== null) progressSeries.push(progressAverage);

			return {
				weekNumber: week.weekNumber,
				effortScore: effortAverage,
				progressScore: progressAverage
			};
		});

		const effortStd = stdDev(effortSeries);
		const progressStd = stdDev(progressSeries);
		const stdValues = [effortStd, progressStd].filter((value): value is number => value !== null);
		const combinedStd =
			stdValues.length > 0
				? stdValues.reduce((sum, value) => sum + value, 0) / stdValues.length
				: null;
		const consistencyScore =
			combinedStd !== null ? Math.max(0, Math.round(100 - combinedStd * 10)) : null;

		let respondedStakeholders = 0;
		const stakeholders =
			objective?.stakeholders.map((stakeholder) => {
				const lastFeedback = stakeholder.feedbacks[0] ?? null;
				let feedbackWeek: number | null = null;
				if (lastFeedback?.submittedAt && cycle) {
					feedbackWeek = weekNumberForDate(cycle.startDate, lastFeedback.submittedAt);
					if (currentWeek !== null && feedbackWeek === currentWeek) {
						respondedStakeholders += 1;
					}
				}
				return {
					id: stakeholder.id,
					name: stakeholder.name,
					email: stakeholder.email,
					lastFeedback: lastFeedback
						? {
								submittedAt: lastFeedback.submittedAt?.toISOString() ?? null,
								effortScore: lastFeedback.effortScore,
								progressScore: lastFeedback.progressScore,
								weekNumber: feedbackWeek
							}
						: null
				};
			}) ?? [];

		const alignmentRatio = objective?.stakeholders.length
			? respondedStakeholders / objective.stakeholders.length
			: null;

		const avgEffort =
			effortSeries.length > 0
				? Number(
						(effortSeries.reduce((sum, value) => sum + value, 0) / effortSeries.length).toFixed(1)
					)
				: null;
		const avgProgress =
			progressSeries.length > 0
				? Number(
						(progressSeries.reduce((sum, value) => sum + value, 0) / progressSeries.length).toFixed(
							1
						)
					)
				: null;

		return {
			id: individual.id,
			name: individual.name ?? individual.email,
			email: individual.email,
			objective: objective
				? {
						id: objective.id,
						title: objective.title,
						description: objective.description ?? '',
						cycle: cycle
							? {
									id: cycle.id,
									label: cycle.label ?? 'Cycle',
									startDate: toIsoDate(cycle.startDate),
									endDate: toIsoDate(cycle.endDate ?? null),
									status: cycle.status,
									completion,
									weeksElapsed,
									currentWeek: currentWeek ?? null,
									recentReflections: reflectionTrend
								}
							: null,
						subgoalCount: objective.subgoals.length,
						stakeholderCount: stakeholders.length,
						respondedStakeholders,
						insights: cycle
							? {
									avgEffort,
									avgProgress,
									consistencyScore,
									alignmentRatio
								}
							: null
					}
				: null,
			stakeholders,
			archived: relationship.archivedAt !== null,
			joinedAt: relationship.createdAt.toISOString(),
			archivedAt: relationship.archivedAt?.toISOString() ?? null
		};
		})
		.filter((value): value is NonNullable<typeof value> => value !== null);

	const invitations = await prisma.coachInvite.findMany({
		where: { coachId: dbUser.id },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			email: true,
			name: true,
			message: true,
			expiresAt: true,
			acceptedAt: true,
			cancelledAt: true,
			individual: {
				select: {
					id: true,
					name: true,
					email: true
				}
			},
			createdAt: true
		}
	});

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		clients: clientSummaries,
		invitations: invitations.map((invite) => ({
			id: invite.id,
			email: invite.email,
			name: invite.name,
			message: invite.message,
			expiresAt: invite.expiresAt.toISOString(),
			acceptedAt: invite.acceptedAt?.toISOString() ?? null,
			cancelledAt: invite.cancelledAt?.toISOString() ?? null,
			individual: invite.individual
				? {
						id: invite.individual.id,
						name: invite.individual.name ?? invite.individual.email,
						email: invite.individual.email
					}
				: null,
			createdAt: invite.createdAt.toISOString()
		})),
		rosterSummary: {
			total: coachClients.length,
			active: coachClients.filter((entry) => entry.archivedAt === null).length,
			archived: coachClients.filter((entry) => entry.archivedAt !== null).length,
			pendingInvites: invitations.filter(
				(invite) => !invite.acceptedAt && !invite.cancelledAt && invite.expiresAt > new Date()
			).length
		}
	};
};

export const actions: Actions = {
	createInvite: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');

		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const name = String(formData.get('name') ?? '').trim();
		const message = String(formData.get('message') ?? '').trim();

		if (!email || !email.includes('@')) {
			return fail(400, { error: 'Please provide a valid email address.' });
		}

		const existingInvite = await prisma.coachInvite.findFirst({
			where: {
				coachId: dbUser.id,
				email,
				cancelledAt: null,
				acceptedAt: null
			}
		});

		if (existingInvite) {
			return fail(400, {
				error: 'An active invitation already exists for this email.',
				inviteId: existingInvite.id
			});
		}

		const tokenRaw = createInviteToken();
		const tokenHash = generateTokenHash(tokenRaw);
		const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

		const invite = await prisma.$transaction(async (tx) => {
			const createdInvite = await tx.coachInvite.create({
				data: {
					coachId: dbUser.id,
					email,
					name: name.length > 0 ? name : null,
					message: message.length > 0 ? message : null,
					tokenHash,
					expiresAt
				}
			});

			await tx.token.create({
				data: {
					type: 'COACH_INVITE' satisfies TokenType,
					tokenHash,
					userId: dbUser.id,
					expiresAt
				}
			});

			return createdInvite;
		});

		const inviteUrl = new URL(`/coach/invite/${tokenRaw}`, event.url.origin).toString();

		return {
			success: true,
			inviteId: invite.id,
			inviteUrl
		};
	},
	cancelInvite: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');
		const formData = await event.request.formData();
		const inviteId = String(formData.get('inviteId') ?? '');

		if (!inviteId) {
			return fail(400, { error: 'Missing invitation identifier.' });
		}

		const invite = await prisma.coachInvite.findUnique({
			where: { id: inviteId }
		});

		if (!invite || invite.coachId !== dbUser.id) {
			return fail(404, { error: 'Invitation not found.' });
		}

		if (invite.acceptedAt) {
			return fail(400, { error: 'Invitation has already been accepted.' });
		}

		if (invite.cancelledAt) {
			return { success: true };
		}

		await prisma.$transaction(async (tx) => {
			await tx.coachInvite.update({
				where: { id: inviteId },
				data: {
					cancelledAt: new Date()
				}
			});

			await tx.token.deleteMany({
				where: {
					tokenHash: invite.tokenHash,
					type: 'COACH_INVITE'
				}
			});
		});

		return { success: true };
	}
};
