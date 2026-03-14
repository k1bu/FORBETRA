import { redirect, fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { computeWeekNumber, FEEDBACK_TOKEN_EXPIRY_DAYS } from '$lib/server/coachUtils';
import { randomBytes } from 'node:crypto';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import { Prisma } from '@prisma/client';
import { validatePhone, normalizePhone } from '$lib/utils/phone';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');
	const baseUrl = event.url.origin;

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { orderBy: { createdAt: 'asc' } },
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true,
							effortScore: true,
							performanceScore: true
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
						include: {
							reflection: { select: { weekNumber: true } }
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
	const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;
	const cycleEnd = cycle?.endDate ?? null;
	const totalWeeks =
		cycleEnd && cycle
			? Math.max(
					1,
					Math.ceil((cycleEnd.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
				)
			: (currentWeek ?? 1);

	// Reviewer list
	const reviewers = objective.stakeholders.map((stakeholder) => {
		const pendingToken = stakeholder.tokens.find(
			(token) => !token.usedAt && token.expiresAt > currentTime
		);
		const latestFeedback = stakeholder.feedbacks[0] ?? null;

		return {
			id: stakeholder.id,
			name: stakeholder.name,
			email: stakeholder.email,
			phone: stakeholder.phone,
			lastFeedbackDate: latestFeedback?.submittedAt?.toISOString() ?? null,
			pendingFeedbackLink: pendingToken
				? `${baseUrl}/stakeholder/feedback/${pendingToken.tokenHash}`
				: null
		};
	});

	// Perception gaps (current week) — from scorecard logic
	const avg = (arr: number[]) =>
		arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;

	// Load all feedbacks for this cycle
	const allFeedbacks = cycle
		? await prisma.feedback.findMany({
				where: {
					stakeholder: { objectiveId: objective.id },
					reflection: { cycleId: cycle.id }
				},
				select: {
					stakeholderId: true,
					effortScore: true,
					performanceScore: true,
					reflection: { select: { weekNumber: true } }
				}
			})
		: [];

	// Self scores for current week
	const selfReflections = cycle
		? cycle.reflections.filter((r) => r.weekNumber === currentWeek)
		: [];
	const selfEfforts = selfReflections
		.map((r) => r.effortScore)
		.filter((v): v is number => v !== null);
	const selfPerfs = selfReflections
		.map((r) => r.performanceScore)
		.filter((v): v is number => v !== null);
	const myEffort = avg(selfEfforts);
	const myPerformance = avg(selfPerfs);

	// Group feedbacks by stakeholder and week
	const shWeekMap = new Map<string, Map<number, { efforts: number[]; performances: number[] }>>();
	for (const fb of allFeedbacks) {
		if (!fb.reflection) continue;
		const wk = fb.reflection.weekNumber;
		const shId = fb.stakeholderId;
		if (!shWeekMap.has(shId)) shWeekMap.set(shId, new Map());
		const shWeeks = shWeekMap.get(shId)!;
		if (!shWeeks.has(wk)) shWeeks.set(wk, { efforts: [], performances: [] });
		const w = shWeeks.get(wk)!;
		if (fb.effortScore !== null) w.efforts.push(fb.effortScore);
		if (fb.performanceScore !== null) w.performances.push(fb.performanceScore);
	}

	// Self scores per week for trend computation
	const selfWeekMap = new Map<number, { effort: number | null; performance: number | null }>();
	if (cycle) {
		for (let wk = 1; wk <= totalWeeks; wk++) {
			const refs = cycle.reflections.filter((r) => r.weekNumber === wk);
			const effs = refs.map((r) => r.effortScore).filter((v): v is number => v !== null);
			const prfs = refs.map((r) => r.performanceScore).filter((v): v is number => v !== null);
			selfWeekMap.set(wk, { effort: avg(effs), performance: avg(prfs) });
		}
	}

	function computeTrend(
		shWeeks: Map<number, { efforts: number[]; performances: number[] }>,
		getSelf: (wk: number) => number | null,
		getStk: (wk: number, data: { efforts: number[]; performances: number[] }) => number | null
	): 'widening' | 'closing' | 'stable' | null {
		const pairedGaps: number[] = [];
		const weeks = Array.from(shWeeks.keys()).sort((a, b) => a - b);
		for (const wk of weeks) {
			const s = getSelf(wk);
			const stk = getStk(wk, shWeeks.get(wk)!);
			if (s !== null && stk !== null) pairedGaps.push(Math.abs(s - stk));
		}
		if (pairedGaps.length < 2) return null;
		const recent = pairedGaps.slice(-3);
		let totalDelta = 0;
		for (let i = 1; i < recent.length; i++) totalDelta += recent[i] - recent[i - 1];
		const avgDelta = totalDelta / (recent.length - 1);
		if (avgDelta > 0.5) return 'widening';
		if (avgDelta < -0.5) return 'closing';
		return 'stable';
	}

	const perceptionGaps = objective.stakeholders.map((sh) => {
		const shWeeks = shWeekMap.get(sh.id);
		const viewData = shWeeks?.get(currentWeek ?? 0);

		const stkEffort = viewData ? avg(viewData.efforts) : null;
		const stkPerf = viewData ? avg(viewData.performances) : null;

		const effortGap =
			myEffort !== null && stkEffort !== null ? Number((myEffort - stkEffort).toFixed(1)) : null;
		const perfGap =
			myPerformance !== null && stkPerf !== null
				? Number((myPerformance - stkPerf).toFixed(1))
				: null;

		const effortGapTrend = shWeeks
			? computeTrend(
					shWeeks,
					(wk) => selfWeekMap.get(wk)?.effort ?? null,
					(_wk, data) => avg(data.efforts)
				)
			: null;
		const performanceGapTrend = shWeeks
			? computeTrend(
					shWeeks,
					(wk) => selfWeekMap.get(wk)?.performance ?? null,
					(_wk, data) => avg(data.performances)
				)
			: null;

		return {
			stakeholderId: sh.id,
			stakeholderName: sh.name,
			effortGap,
			performanceGap: perfGap,
			effortGapTrend,
			performanceGapTrend,
			maxAbsGap: Math.max(Math.abs(effortGap ?? 0), Math.abs(perfGap ?? 0))
		};
	});

	return {
		objective: { id: objective.id, title: objective.title },
		reviewers,
		myEffort,
		myPerformance,
		perceptionGaps,
		currentWeek
	};
};

/** Shared helper: validates reviewer, checks gating, creates token, sends email + SMS. */
async function createFeedbackToken(
	dbUser: { id: string; name: string | null },
	stakeholderId: string,
	origin: string
): Promise<
	| { ok: true; feedbackLink: string; expiresAt: string; smsSent: boolean }
	| { ok: false; status: number; error: string }
> {
	const stakeholder = await prisma.stakeholder.findFirst({
		where: { id: stakeholderId, individualId: dbUser.id }
	});

	if (!stakeholder) {
		return { ok: false, status: 404, error: 'Reviewer not found.' };
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
		return { ok: false, status: 400, error: 'No active goal available.' };
	}

	const primarySubgoal = objective.subgoals[0];
	if (!primarySubgoal) {
		return { ok: false, status: 400, error: 'Add a focus area before requesting feedback.' };
	}

	const cycle = objective.cycles[0];
	if (!cycle) {
		return { ok: false, status: 400, error: 'No active cycle found.' };
	}

	const weekNumber = Math.max(
		1,
		Math.floor((new Date().getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
	);

	const cadence = cycle.stakeholderCadence ?? 'weekly';
	if (cadence !== 'every_checkin') {
		let windowStart: Date;
		if (cadence === 'monthly') {
			windowStart = new Date();
			windowStart.setDate(1);
			windowStart.setHours(0, 0, 0, 0);
		} else {
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
			return {
				ok: false,
				status: 400,
				error: `Feedback already requested from ${stakeholder.name} ${period}.`
			};
		}
	}

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
			return {
				ok: false,
				status: 400,
				error: `${stakeholder.name} already has ${activeRequestCount} pending feedback requests.`
			};
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
			metadata: { generatedBy: dbUser.id }
		}
	});

	const feedbackLink = `${origin}/stakeholder/feedback/${tokenValue}`;

	try {
		const template = emailTemplates.feedbackInvite({
			individualName: dbUser.name || undefined,
			stakeholderName: stakeholder.name || undefined,
			objectiveTitle: objective.title || undefined,
			feedbackLink
		});
		await sendEmail({ to: stakeholder.email, ...template });
	} catch (error) {
		console.error('[email:error] Failed to send feedback invite', error);
	}

	let smsSent = false;
	if (stakeholder.phone) {
		await trySendSms(
			stakeholder.phone,
			smsTemplates.feedbackInvite({
				individualName: dbUser.name || undefined,
				feedbackLink
			})
		);
		smsSent = true;
	}

	return { ok: true, feedbackLink, expiresAt: expiresAt.toISOString(), smsSent };
}

export const actions: Actions = {
	addStakeholder: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();
		const phone = String(formData.get('phone') ?? '').trim();

		const values = { name, email, phone };

		if (!name || !email) {
			return fail(400, { action: 'stakeholder', error: 'Name and email are required.', values });
		}

		if (phone && !validatePhone(phone)) {
			return fail(400, {
				action: 'stakeholder',
				error: 'Enter a valid phone number (7\u201315 digits, e.g. +1 555 123 4567).',
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
				error: 'Create a goal before adding reviewers.',
				values
			});
		}

		try {
			const stakeholder = await prisma.stakeholder.create({
				data: {
					individualId: dbUser.id,
					objectiveId: objective.id,
					name,
					email,
					phone: phone.length > 0 ? normalizePhone(phone) : null
				}
			});

			try {
				const template = emailTemplates.welcomeStakeholder({
					individualName: dbUser.name || undefined,
					stakeholderName: name || undefined,
					appUrl: event.url.origin
				});
				await sendEmail({ to: email, ...template });
			} catch (error) {
				console.error('[email:error] Failed to send reviewer welcome email', error);
			}

			if (stakeholder.phone) {
				await trySendSms(
					stakeholder.phone,
					smsTemplates.welcomeStakeholder({
						individualName: dbUser.name || undefined,
						appUrl: event.url.origin
					})
				);
			}
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				return fail(400, {
					action: 'stakeholder',
					error: 'You already have a reviewer with that email.',
					values
				});
			}
			throw error;
		}

		return { action: 'stakeholder', success: true };
	},

	generateFeedback: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');
		const formData = await event.request.formData();
		const stakeholderId = formData.get('stakeholderId');

		if (typeof stakeholderId !== 'string' || stakeholderId.length === 0) {
			return fail(400, { action: 'feedback', error: 'Missing reviewer selection.' });
		}

		const result = await createFeedbackToken(dbUser, stakeholderId, event.url.origin);
		if (!result.ok) {
			return fail(result.status as 400 | 404, { action: 'feedback', error: result.error });
		}

		return {
			action: 'feedback',
			success: true,
			feedbackLink: result.feedbackLink,
			expiresAt: result.expiresAt,
			smsSent: result.smsSent
		};
	},

	addPhoneAndGenerateFeedback: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');
		const formData = await event.request.formData();
		const stakeholderId = formData.get('stakeholderId');
		const phone = String(formData.get('phone') ?? '').trim();

		if (typeof stakeholderId !== 'string' || stakeholderId.length === 0) {
			return fail(400, { action: 'feedback', error: 'Missing reviewer selection.' });
		}

		if (!phone || !validatePhone(phone)) {
			return fail(400, {
				action: 'feedback',
				error: 'Enter a valid phone number (7\u201315 digits, e.g. +1 555 123 4567).',
				phonePromptFor: stakeholderId
			});
		}

		await prisma.stakeholder.update({
			where: { id: stakeholderId },
			data: { phone: normalizePhone(phone) }
		});

		const result = await createFeedbackToken(dbUser, stakeholderId, event.url.origin);
		if (!result.ok) {
			return fail(result.status as 400 | 404, { action: 'feedback', error: result.error });
		}

		return {
			action: 'feedback',
			success: true,
			feedbackLink: result.feedbackLink,
			expiresAt: result.expiresAt,
			smsSent: result.smsSent
		};
	}
};
