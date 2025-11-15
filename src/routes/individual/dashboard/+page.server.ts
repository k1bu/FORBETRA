import { redirect, fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { randomBytes } from 'node:crypto';
import { sendEmail } from '$lib/notifications/email';
import { sendSms } from '$lib/notifications/sms';
import { Prisma } from '@prisma/client';

const stdDev = (values: number[]) => {
	if (values.length === 0) return null;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	const variance =
		values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
	return Math.sqrt(variance);
};

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

// Helper to compute week number from start date
const computeWeekNumber = (startDate: Date): number => {
	const now = new Date();
	const diff = now.getTime() - startDate.getTime();
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / msPerWeek) + 1);
};

// Get the date for a specific weekday in a given week (1 = Monday, 3 = Wednesday, 5 = Friday)
const getDateForWeekday = (weekday: number, startDate: Date, weekNumber: number): Date => {
	// Find the Monday of the week that contains startDate
	const startDayOfWeek = startDate.getDay();
	const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek; // Monday is day 1
	const cycleMonday = new Date(startDate);
	cycleMonday.setDate(startDate.getDate() + mondayOffset);
	cycleMonday.setHours(0, 0, 0, 0);

	// Calculate the Monday of the target week (weekNumber weeks from cycle start)
	const targetMonday = new Date(cycleMonday);
	targetMonday.setDate(cycleMonday.getDate() + (weekNumber - 1) * 7);

	// Add days to get to the target weekday (Wednesday = 3, Friday = 5)
	const targetDate = new Date(targetMonday);
	targetDate.setDate(targetMonday.getDate() + (weekday - 1));
	targetDate.setHours(0, 0, 0, 0);

	return targetDate;
};

// Get the state of a weekly experience
type ExperienceState = 'open' | 'completed' | 'missed' | 'upcoming';

type WeeklyExperience = {
	type: 'INTENTION' | 'EFFORT' | 'PROGRESS';
	label: string;
	state: ExperienceState;
	availableDate: Date | null;
	deadlineDate: Date | null;
	reflectionId: string | null;
	url: string | null;
};

const getWeeklyExperiences = async (
	cycle: {
		id: string;
		startDate: Date;
		reflections: Array<{ id: string; reflectionType: string; weekNumber: number }>;
	},
	userId: string,
	currentWeek: number,
	prismaClient: typeof prisma
): Promise<WeeklyExperience[]> => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const mondayDate = getDateForWeekday(1, cycle.startDate, currentWeek);
	const tuesdayDate = getDateForWeekday(2, cycle.startDate, currentWeek);
	const wednesdayDate = getDateForWeekday(3, cycle.startDate, currentWeek);
	const thursdayDate = getDateForWeekday(4, cycle.startDate, currentWeek);
	const fridayDate = getDateForWeekday(5, cycle.startDate, currentWeek);

	// Get next Monday date (for deadline calculation)
	const nextMondayDate = new Date(mondayDate);
	nextMondayDate.setDate(mondayDate.getDate() + 7);

	// Check if next Monday intention is submitted (locks check-ins)
	const nextWeekIntention = await prismaClient.reflection.findFirst({
		where: {
			cycleId: cycle.id,
			userId,
			reflectionType: 'INTENTION',
			weekNumber: currentWeek + 1
		}
	});
	const isLocked = !!nextWeekIntention;

	// Get submitted reflections for current week
	const submittedReflections = cycle.reflections.filter((r) => r.weekNumber === currentWeek);
	const hasIntention = submittedReflections.some((r) => r.reflectionType === 'INTENTION');
	const hasEffort = submittedReflections.some((r) => r.reflectionType === 'EFFORT');
	const hasProgress = submittedReflections.some((r) => r.reflectionType === 'PROGRESS');

	const intentionReflection = submittedReflections.find((r) => r.reflectionType === 'INTENTION');
	const effortReflection = submittedReflections.find((r) => r.reflectionType === 'EFFORT');
	const progressReflection = submittedReflections.find((r) => r.reflectionType === 'PROGRESS');

	const experiences: WeeklyExperience[] = [];

	// 1. Monday Intention Prompt
	let intentionState: ExperienceState;
	if (hasIntention) {
		intentionState = 'completed';
	} else if (today < mondayDate) {
		intentionState = 'upcoming';
	} else if (isLocked) {
		// If next Monday intention is submitted, this week's intention is missed
		intentionState = 'missed';
	} else {
		intentionState = 'open';
	}

	experiences.push({
		type: 'INTENTION',
		label: 'Monday intention prompt',
		state: intentionState,
		availableDate: mondayDate,
		deadlineDate: isLocked ? nextMondayDate : null,
		reflectionId: intentionReflection?.id ?? null,
		url: intentionState === 'open' || intentionState === 'completed' ? '/prompts/monday' : null
	});

	// 2. First Check-in (EFFORT) - Available Tuesday/Wednesday until Friday
	let effortState: ExperienceState;
	if (hasEffort) {
		effortState = 'completed';
	} else if (today < tuesdayDate) {
		effortState = 'upcoming';
	} else if (today > fridayDate || isLocked) {
		// Missed if past Friday or next Monday intention submitted
		effortState = 'missed';
	} else {
		effortState = 'open';
	}

	experiences.push({
		type: 'EFFORT',
		label: 'First check-in',
		state: effortState,
		availableDate: tuesdayDate,
		deadlineDate: fridayDate,
		reflectionId: effortReflection?.id ?? null,
		url:
			effortState === 'open' || effortState === 'completed'
				? '/reflections/checkin?type=EFFORT'
				: null
	});

	// 3. Second Check-in (PROGRESS) - Available Thursday/Friday until next Monday intention
	let progressState: ExperienceState;
	if (hasProgress) {
		progressState = 'completed';
	} else if (today < thursdayDate) {
		progressState = 'upcoming';
	} else if (isLocked) {
		// Missed if next Monday intention submitted
		progressState = 'missed';
	} else {
		progressState = 'open';
	}

	experiences.push({
		type: 'PROGRESS',
		label: 'Second check-in',
		state: progressState,
		availableDate: thursdayDate,
		deadlineDate: isLocked ? nextMondayDate : null,
		reflectionId: progressReflection?.id ?? null,
		url:
			progressState === 'open' || progressState === 'completed'
				? '/reflections/checkin?type=PROGRESS'
				: null
	});

	return experiences;
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
		? Math.max(
				0,
				Math.floor((new Date().getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
			)
		: 0;
	const completion =
		totalWeeks > 0 ? Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100)) : 0;
	const nextPrompt = cycle ? getNextPrompt(cycle.startDate) : null;
	const currentTime = new Date();
	const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

	let respondedThisWeek = 0;
	const reflectionTrendMap = new Map<
		number,
		{
			weekNumber: number;
			intention: boolean;
			effortScores: number[];
			progressScores: number[];
		}
	>();

	// Get identity anchor (week 1 intention)
	let identityAnchor: string | null = null;
	if (cycle) {
		const week1Intention = cycle.reflections.find(
			(r) => r.reflectionType === 'INTENTION' && r.weekNumber === 1
		);
		if (week1Intention && week1Intention.notes) {
			identityAnchor = week1Intention.notes;
		}
	}

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
			// Both EFFORT and PROGRESS check-ins now capture both scores
			if (reflection.reflectionType === 'EFFORT' || reflection.reflectionType === 'PROGRESS') {
				if (reflection.effortScore !== null) {
					weekEntry.effortScores.push(reflection.effortScore);
				}
				if (reflection.progressScore !== null) {
					weekEntry.progressScores.push(reflection.progressScore);
				}
			}
			reflectionTrendMap.set(reflection.weekNumber, weekEntry);
		});
	}

	// Initialize weeklyExperiences if cycle doesn't exist
	const weeklyExperiences: Array<{
		type: 'INTENTION' | 'EFFORT' | 'PROGRESS';
		label: string;
		state: 'open' | 'completed' | 'missed' | 'upcoming';
		availableDate: string | null;
		deadlineDate: string | null;
		reflectionId: string | null;
		url: string | null;
	}> =
		cycle && currentWeek
			? (await getWeeklyExperiences(cycle, dbUser.id, currentWeek, prisma)).map((exp) => ({
					...exp,
					availableDate: exp.availableDate ? exp.availableDate.toISOString() : null,
					deadlineDate: exp.deadlineDate ? exp.deadlineDate.toISOString() : null
				}))
			: [];

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

	const effortSeries = reflectionTrend
		.map((week) => week.effortScore)
		.filter((value): value is number => value !== null);
	const progressSeries = reflectionTrend
		.map((week) => week.progressScore)
		.filter((value): value is number => value !== null);

	const effortStd = stdDev(effortSeries);
	const progressStd = stdDev(progressSeries);

	const stdValues = [effortStd, progressStd].filter((value): value is number => value !== null);
	const combinedStd =
		stdValues.length > 0
			? stdValues.reduce((sum, value) => sum + value, 0) / stdValues.length
			: null;
	const consistencyScore =
		combinedStd !== null ? Math.max(0, Math.round(100 - combinedStd * 10)) : null;

	const alignmentRatio =
		objective.stakeholders.length > 0 ? respondedThisWeek / objective.stakeholders.length : null;

	// Calculate engagement metrics (completion rate, streaks) - positive framing
	let completionRate: number | null = null;
	let currentStreak: number = 0;
	let bestStreak: number = 0;
	let totalExpected: number = 0;
	let totalCompleted: number = 0;

	if (cycle && currentWeek) {
		// Calculate completion rate
		totalExpected = currentWeek * 3; // 3 experiences per week
		totalCompleted = cycle.reflections.length;
		completionRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

		// Calculate streaks (consecutive individual check-ins/prompts)
		// Sort reflections chronologically by week and type order (INTENTION, EFFORT, PROGRESS)
		const typeOrder: Record<string, number> = { INTENTION: 0, EFFORT: 1, PROGRESS: 2 };
		const sortedReflections = [...cycle.reflections].sort((a, b) => {
			if (a.weekNumber !== b.weekNumber) {
				return a.weekNumber - b.weekNumber;
			}
			return (typeOrder[a.reflectionType] ?? 999) - (typeOrder[b.reflectionType] ?? 999);
		});

		// Create a set of completed reflections for quick lookup
		const completedReflections = new Set<string>();
		sortedReflections.forEach((r) => {
			completedReflections.add(`${r.weekNumber}-${r.reflectionType}`);
		});

		// Calculate current streak (from most recent backwards, checking for consecutive sequence)
		// Build expected sequence: Week 1: INTENTION, EFFORT, PROGRESS; Week 2: INTENTION, EFFORT, PROGRESS; etc.
		const expectedSequence: Array<{ week: number; type: string }> = [];
		for (let week = 1; week <= currentWeek; week++) {
			expectedSequence.push({ week, type: 'INTENTION' });
			expectedSequence.push({ week, type: 'EFFORT' });
			expectedSequence.push({ week, type: 'PROGRESS' });
		}

		// Count consecutive completed reflections from the end
		let streak = 0;
		for (let i = expectedSequence.length - 1; i >= 0; i--) {
			const expected = expectedSequence[i];
			const key = `${expected.week}-${expected.type}`;
			if (completedReflections.has(key)) {
				streak++;
			} else {
				break;
			}
		}
		currentStreak = streak;

		// Calculate best streak (longest consecutive sequence)
		let maxStreak = 0;
		let runningStreak = 0;

		// Check all expected reflections in chronological order
		for (let week = 1; week <= currentWeek; week++) {
			const types: Array<'INTENTION' | 'EFFORT' | 'PROGRESS'> = ['INTENTION', 'EFFORT', 'PROGRESS'];
			for (const type of types) {
				const key = `${week}-${type}`;
				if (completedReflections.has(key)) {
					runningStreak++;
					maxStreak = Math.max(maxStreak, runningStreak);
				} else {
					runningStreak = 0;
				}
			}
		}
		bestStreak = maxStreak;
	}

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
		identityAnchor,
		stakeholders,
		feedbackSummary,
		reflectionTrend: normalizedReflectionTrend,
		insights: {
			avgEffort: normalizedReflectionTrend.avgEffort,
			avgProgress: normalizedReflectionTrend.avgProgress,
			consistencyScore,
			alignmentRatio
		},
		engagement: {
			completionRate,
			currentStreak,
			bestStreak,
			totalCompleted,
			totalExpected
		},
		weeklyExperiences,
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
