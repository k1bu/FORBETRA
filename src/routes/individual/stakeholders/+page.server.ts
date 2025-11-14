import { redirect, fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { randomBytes } from 'node:crypto';
import { sendEmail } from '$lib/notifications/email';
import { sendSms } from '$lib/notifications/sms';
import { Prisma } from '@prisma/client';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');
	const baseUrl = event.url.origin;

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1
			},
			stakeholders: {
				orderBy: { createdAt: 'asc' },
				include: {
					feedbacks: {
						orderBy: { submittedAt: 'desc' },
						take: 1,
						include: {
							reflection: {
								select: {
									weekNumber: true
								}
							}
						}
					},
					tokens: {
						where: { type: 'FEEDBACK_INVITE' },
						orderBy: { createdAt: 'desc' },
						take: 3
					}
				}
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0] ?? null;
	const currentTime = new Date();
	const currentWeek = cycle
		? Math.max(
				1,
				Math.floor((currentTime.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
			)
		: null;

	const stakeholders = objective.stakeholders.map((stakeholder) => {
		const pendingToken = stakeholder.tokens.find((token) => !token.usedAt && token.expiresAt > currentTime);
		const latestFeedback = stakeholder.feedbacks[0] ?? null;
		const latestReflectionWeek = latestFeedback?.reflection?.weekNumber ?? null;
		const isCurrentWeekResponse =
			currentWeek !== null && latestReflectionWeek === currentWeek && !!latestFeedback?.submittedAt;

		return {
			id: stakeholder.id,
			name: stakeholder.name,
			email: stakeholder.email,
			relationship: stakeholder.relationship,
			pendingFeedbackLink: pendingToken
				? `${baseUrl}/stakeholder/feedback/${pendingToken.tokenHash}`
				: null,
			pendingFeedbackExpiresAt: pendingToken?.expiresAt?.toISOString() ?? null,
			lastFeedback: latestFeedback
				? {
						submittedAt: latestFeedback.submittedAt?.toISOString() ?? null,
						effortScore: latestFeedback.effortScore,
						progressScore: latestFeedback.progressScore,
						weekNumber: latestReflectionWeek,
						isCurrentWeek: isCurrentWeekResponse
					}
				: null
		};
	});

	return {
		objective: {
			id: objective.id,
			title: objective.title
		},
		stakeholders
	};
};

export const actions: Actions = {
	generateFeedback: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const stakeholderId = formData.get('stakeholderId');

		if (typeof stakeholderId !== 'string' || stakeholderId.length === 0) {
			return fail(400, { action: 'feedback', error: 'Missing stakeholder selection.' });
		}

		const stakeholder = await prisma.stakeholder.findFirst({
			where: {
				id: stakeholderId,
				individualId: dbUser.id
			}
		});

		if (!stakeholder) {
			return fail(404, { action: 'feedback', error: 'Stakeholder not found.' });
		}

		const objective = await prisma.objective.findFirst({
			where: { userId: dbUser.id, active: true },
			orderBy: { createdAt: 'desc' },
			include: {
				subgoals: { orderBy: { createdAt: 'asc' } },
				cycles: { orderBy: { startDate: 'desc' }, take: 1 }
			}
		});

		if (!objective) {
			return fail(400, { action: 'feedback', error: 'No active objective available.' });
		}

		const primarySubgoal = objective.subgoals[0];

		if (!primarySubgoal) {
			return fail(400, { action: 'feedback', error: 'Add a subgoal before requesting feedback.' });
		}

		const cycle = objective.cycles[0];

		if (!cycle) {
			return fail(400, { action: 'feedback', error: 'No active cycle found.' });
		}

		const weekNumber = Math.max(
			1,
			Math.floor((new Date().getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
		);

		const reflection = await prisma.reflection.upsert({
			where: {
				cycleId_weekNumber_reflectionType_subgoalId: {
					cycleId: cycle.id,
					weekNumber,
					reflectionType: 'PROGRESS',
					subgoalId: primarySubgoal.id
				}
			},
			update: {},
			create: {
				cycleId: cycle.id,
				userId: dbUser.id,
				subgoalId: primarySubgoal.id,
				reflectionType: 'PROGRESS',
				weekNumber,
				checkInDate: new Date()
			}
		});

		const tokenValue = randomBytes(32).toString('hex');
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		await prisma.token.create({
			data: {
				tokenHash: tokenValue,
				type: 'FEEDBACK_INVITE',
				expiresAt,
				stakeholderId: stakeholder.id,
				reflectionId: reflection.id,
				userId: dbUser.id,
				metadata: {
					generatedBy: dbUser.id
				}
			}
		});

		const feedbackLink = `${event.url.origin}/stakeholder/feedback/${tokenValue}`;

		if (process.env.NODE_ENV === 'development') {
			await sendEmail({
				to: stakeholder.email ?? 'unknown@example.com',
				subject: 'FORBETRA feedback link',
				html: `<p>Hi ${stakeholder.name},</p><p>Please share feedback: <a href="${feedbackLink}">${feedbackLink}</a>.</p>`,
				text: `Hi ${stakeholder.name}, please share feedback: ${feedbackLink}`
			});

			if (stakeholder.phone) {
				await sendSms({
					to: stakeholder.phone,
					body: `Share feedback for ${dbUser.name ?? 'your client'}: ${feedbackLink}`
				});
			}
		}

		return {
			action: 'feedback',
			success: true,
			feedbackLink,
			expiresAt: expiresAt.toISOString()
		};
	},
	addStakeholder: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();
		const relationship = String(formData.get('relationship') ?? '').trim();

		const values = { name, email, relationship };

		if (!name || !email) {
			return fail(400, {
				action: 'stakeholder',
				error: 'Add a name and valid email to invite a stakeholder.',
				values
			});
		}

		const objective = await prisma.objective.findFirst({
			where: { userId: dbUser.id, active: true },
			orderBy: { createdAt: 'desc' },
			select: { id: true }
		});

		if (!objective) {
			return fail(400, {
				action: 'stakeholder',
				error: 'Create an objective before adding stakeholders.',
				values
			});
		}

		try {
			await prisma.stakeholder.create({
				data: {
					individualId: dbUser.id,
					objectiveId: objective.id,
					name,
					email,
					relationship: relationship.length > 0 ? relationship : null
				}
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				return fail(400, {
					action: 'stakeholder',
					error: 'You already have a stakeholder with that email.',
					values
				});
			}
			throw error;
		}

		return {
			action: 'stakeholder',
			success: true
		};
	}
};

