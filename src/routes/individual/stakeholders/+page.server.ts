import { redirect, fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { randomBytes } from 'node:crypto';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import { Prisma } from '@prisma/client';
import { FEEDBACK_TOKEN_EXPIRY_DAYS } from '$lib/server/coachUtils';

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
		const pendingToken = stakeholder.tokens.find(
			(token) => !token.usedAt && token.expiresAt > currentTime
		);
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
						performanceScore: latestFeedback.performanceScore,
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

		// Cadence gating: check if feedback request is allowed this period
		const cadence = cycle.stakeholderCadence ?? 'weekly';
		if (cadence !== 'every_checkin') {
			let windowStart: Date;
			if (cadence === 'monthly') {
				windowStart = new Date();
				windowStart.setDate(1);
				windowStart.setHours(0, 0, 0, 0);
			} else {
				// weekly: start of current week (Monday)
				windowStart = new Date();
				const dayOfWeek = windowStart.getDay();
				const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
				windowStart.setDate(windowStart.getDate() + mondayOffset);
				windowStart.setHours(0, 0, 0, 0);
			}

			const existingToken = await prisma.token.findFirst({
				where: {
					type: 'FEEDBACK_INVITE',
					stakeholderId: stakeholder.id,
					createdAt: { gte: windowStart }
				}
			});

			if (existingToken) {
				const period = cadence === 'monthly' ? 'this month' : 'this week';
				return fail(400, {
					action: 'feedback',
					error: `Feedback already requested from ${stakeholder.name} ${period}. Your coach set the cadence to ${cadence === 'monthly' ? 'monthly' : 'weekly'}.`
				});
			}
		}

		// Auto-throttle: skip if stakeholder has too many pending requests
		if (cycle.autoThrottle) {
			const activeRequestCount = await prisma.token.count({
				where: {
					type: 'FEEDBACK_INVITE',
					stakeholderId: stakeholder.id,
					usedAt: null,
					expiresAt: { gt: new Date() }
				}
			});

			if (activeRequestCount >= 3) {
				return fail(400, {
					action: 'feedback',
					error: `${stakeholder.name} already has ${activeRequestCount} pending feedback requests. Auto-throttle is limiting new requests to prevent survey fatigue.`
				});
			}
		}

		const reflection = await prisma.reflection.upsert({
			where: {
				cycleId_weekNumber_reflectionType_subgoalId: {
					cycleId: cycle.id,
					weekNumber,
					reflectionType: 'RATING_B',
					subgoalId: primarySubgoal.id
				}
			},
			update: {},
			create: {
				cycleId: cycle.id,
				userId: dbUser.id,
				subgoalId: primarySubgoal.id,
				reflectionType: 'RATING_B',
				weekNumber,
				checkInDate: new Date()
			}
		});

		const tokenValue = randomBytes(32).toString('hex');
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + FEEDBACK_TOKEN_EXPIRY_DAYS);

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

		// Send feedback invite email
		try {
			const objective = await prisma.objective.findFirst({
				where: { userId: dbUser.id, active: true },
				select: { title: true }
			});

			const template = emailTemplates.feedbackInvite({
				individualName: dbUser.name || undefined,
				stakeholderName: stakeholder.name || undefined,
				objectiveTitle: objective?.title || undefined,
				feedbackLink
			});
			await sendEmail({
				to: stakeholder.email,
				...template
			});
		} catch (error) {
			console.error('[email:error] Failed to send feedback invite', error);
			// Don't fail the request if email fails
		}

		// Send feedback invite SMS to stakeholder
		await trySendSms(
			stakeholder.phone,
			smsTemplates.feedbackInvite({
				individualName: dbUser.name || undefined,
				feedbackLink
			})
		);

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

		let stakeholder;
		try {
			stakeholder = await prisma.stakeholder.create({
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

		// Send welcome email to new stakeholder
		try {
			const objectiveData = await prisma.objective.findUnique({
				where: { id: objective.id },
				select: { title: true }
			});

			const template = emailTemplates.welcomeStakeholder({
				individualName: dbUser.name || undefined,
				stakeholderName: name || undefined,
				appUrl: event.url.origin
			});
			await sendEmail({
				to: email,
				...template
			});
		} catch (error) {
			console.error('[email:error] Failed to send stakeholder welcome email', error);
			// Don't fail the request if email fails
		}

		return {
			action: 'stakeholder',
			success: true
		};
	}
};
