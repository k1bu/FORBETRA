import { redirect, fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { randomBytes } from 'node:crypto';
import { sendEmail } from '$lib/notifications/email';
import { sendSms } from '$lib/notifications/sms';

type PromptType = 'INTENTION' | 'EFFORT' | 'PROGRESS';

const promptWeekdays: Record<PromptType, number> = {
	INTENTION: 1,
	EFFORT: 3,
	PROGRESS: 5
};

const getNextPrompt = (startDate: Date): { type: PromptType; date: Date } => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const candidates = (Object.keys(promptWeekdays) as PromptType[]).map((type) => {
		const targetDay = promptWeekdays[type];
		const candidate = new Date(today);

		while (candidate.getDay() !== targetDay) {
			candidate.setDate(candidate.getDate() + 1);
		}

		if (candidate <= today) {
			candidate.setDate(candidate.getDate() + 7);
		}

		return { type, date: candidate };
	});

	candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
	const next = candidates[0];

	if (next.date < startDate) {
		return { type: 'INTENTION', date: startDate };
	}

	return next;
};

const toIsoDate = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const weeksBetween = (start: Date, end: Date) =>
	Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));

const computeWeekNumber = (startDate: Date) => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');
	const baseUrl = event.url.origin;

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { orderBy: { createdAt: 'asc' } },
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
			},
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true,
							submittedAt: true,
							effortScore: true,
							progressScore: true,
							notes: true
						}
					}
				}
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	const cycle = objective.cycles[0] ?? null;
	const cycleEnd = cycle?.endDate ?? null;
	const totalWeeks = cycle && cycleEnd ? weeksBetween(cycle.startDate, cycleEnd) : 0;
	const weeksElapsed = cycle
		? Math.max(0, Math.floor((Date.now() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
		: 0;
	const completion =
		totalWeeks > 0 ? Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100)) : 0;
	const nextPrompt = cycle ? getNextPrompt(cycle.startDate) : null;
	const now = new Date();
	const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

	let respondedThisWeek = 0;
	const overduePrompts: { type: PromptType; weekNumber: number }[] = [];
	const reflectionTrendMap = new Map<
		number,
		{
			weekNumber: number;
			intention: boolean;
			effortScores: number[];
			progressScores: number[];
		}
	>();

	if (cycle) {
		cycle.reflections.forEach((reflection) => {
			const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
				weekNumber: reflection.weekNumber,
				intention: false,
				effortScores: [],
				progressScores: []
			};
			if (reflection.reflectionType === 'INTENTION') {
				weekEntry.intention = true;
			}
			if (reflection.reflectionType === 'EFFORT' && reflection.effortScore !== null) {
				weekEntry.effortScores.push(reflection.effortScore);
			}
			if (reflection.reflectionType === 'PROGRESS' && reflection.progressScore !== null) {
				weekEntry.progressScores.push(reflection.progressScore);
			}
			reflectionTrendMap.set(reflection.weekNumber, weekEntry);
		});

		if (currentWeek) {
			const submittedTypes = new Set(
				cycle.reflections
					.filter((reflection) => reflection.weekNumber === currentWeek)
					.map((reflection) => reflection.reflectionType as PromptType)
			);

			(['INTENTION', 'EFFORT', 'PROGRESS'] as PromptType[]).forEach((type) => {
				if (!submittedTypes.has(type)) {
					overduePrompts.push({ type, weekNumber: currentWeek });
				}
			});
		}
	}

	let effortSum = 0;
	let effortCount = 0;
	let progressSum = 0;
	let progressCount = 0;

	const stakeholders = objective.stakeholders.map((stakeholder) => {
		const pendingToken = stakeholder.tokens.find((token) => !token.usedAt && token.expiresAt > now);
		const latestFeedback = stakeholder.feedbacks[0] ?? null;
		const latestReflectionWeek = latestFeedback?.reflection?.weekNumber ?? null;
		const isCurrentWeekResponse =
			currentWeek !== null && latestReflectionWeek === currentWeek && !!latestFeedback?.submittedAt;

		if (isCurrentWeekResponse) {
			respondedThisWeek += 1;
			if (latestFeedback?.effortScore !== null && latestFeedback?.effortScore !== undefined) {
				effortSum += latestFeedback.effortScore;
				effortCount += 1;
			}
			if (latestFeedback?.progressScore !== null && latestFeedback?.progressScore !== undefined) {
				progressSum += latestFeedback.progressScore;
				progressCount += 1;
			}
		}

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

	const feedbackSummary = currentWeek
		? {
				weekNumber: currentWeek,
				totalStakeholders: objective.stakeholders.length,
				responded: respondedThisWeek,
				avgEffort: effortCount > 0 ? Number((effortSum / effortCount).toFixed(1)) : null,
				avgProgress: progressCount > 0 ? Number((progressSum / progressCount).toFixed(1)) : null
			}
		: null;

	const trendWeeks = Array.from(reflectionTrendMap.values())
		.sort((a, b) => b.weekNumber - a.weekNumber)
		.slice(0, 4);

	let trendEffortSum = 0;
	let trendEffortCount = 0;
	let trendProgressSum = 0;
	let trendProgressCount = 0;

	const reflectionTrend = trendWeeks.map((week) => {
		const effortAverage =
			week.effortScores.length > 0
				? Number(
						(
							week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length
						).toFixed(1)
					)
				: null;
		if (effortAverage !== null) {
			trendEffortSum += effortAverage;
			trendEffortCount += 1;
		}

		const progressAverage =
			week.progressScores.length > 0
				? Number(
						(
							week.progressScores.reduce((sum, score) => sum + score, 0) /
							week.progressScores.length
						).toFixed(1)
					)
				: null;
		if (progressAverage !== null) {
			trendProgressSum += progressAverage;
			trendProgressCount += 1;
		}

		return {
			weekNumber: week.weekNumber,
			intentionSubmitted: week.intention,
			effortScore: effortAverage,
			progressScore: progressAverage
		};
	});

	const reflectionTrendSummary = {
		weeks: reflectionTrend,
		avgEffort: trendEffortCount > 0 ? Number((trendEffortSum / trendEffortCount).toFixed(1)) : null,
		avgProgress:
			trendProgressCount > 0 ? Number((trendProgressSum / trendProgressCount).toFixed(1)) : null
	};

	const normalizedReflectionTrend = cycle
		? reflectionTrendSummary
		: { weeks: [], avgEffort: null, avgProgress: null };

	return {
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description
		},
		subgoals: objective.subgoals.map((subgoal) => ({
			id: subgoal.id,
			label: subgoal.label,
			description: subgoal.description
		})),
		stakeholders,
		feedbackSummary,
		reflectionTrend: normalizedReflectionTrend,
		overduePrompts,
		cycle: cycle
			? {
					id: cycle.id,
					label: cycle.label ?? 'Cycle',
					startDate: toIsoDate(cycle.startDate),
					endDate: toIsoDate(cycleEnd),
					status: cycle.status,
					weeksElapsed,
					totalWeeks,
					completion,
					reflectionsRecorded: cycle.reflections.length
				}
			: null,
		nextPrompt: nextPrompt
			? {
					type: nextPrompt.type,
					date: nextPrompt.date.toISOString()
				}
			: null
	};
};

export const actions: Actions = {
	generateFeedback: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const stakeholderId = formData.get('stakeholderId');

		if (typeof stakeholderId !== 'string' || stakeholderId.length === 0) {
			return fail(400, { error: 'Missing stakeholder selection.' });
		}

		const stakeholder = await prisma.stakeholder.findFirst({
			where: {
				id: stakeholderId,
				individualId: dbUser.id
			}
		});

		if (!stakeholder) {
			return fail(404, { error: 'Stakeholder not found.' });
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
			return fail(400, { error: 'No active objective available.' });
		}

		const primarySubgoal = objective.subgoals[0];

		if (!primarySubgoal) {
			return fail(400, { error: 'Add a subgoal before requesting feedback.' });
		}

		const cycle = objective.cycles[0];

		if (!cycle) {
			return fail(400, { error: 'No active cycle found.' });
		}

		const weekNumber = computeWeekNumber(cycle.startDate);

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
			success: true,
			feedbackLink,
			expiresAt: expiresAt.toISOString()
		};
	}
};
