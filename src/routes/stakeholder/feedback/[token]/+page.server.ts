import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { stakeholderFeedbackSchema } from '$lib/validation/feedback';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import type { Actions, PageServerLoad } from './$types';

const sanitizeToken = (value: string | undefined) => {
	if (!value) return null;
	return /^[a-f0-9]{64}$/i.test(value) ? value : null;
};

export const load: PageServerLoad = async ({ params, url }) => {
	const isPreview = url.searchParams.get('preview') === 'true';
	const tokenParam = sanitizeToken(params.token);

	// Preview mode - return mock data
	if (isPreview && params.token === 'preview') {
		return {
			token: 'preview',
			stakeholder: {
				name: 'Sample Stakeholder'
			},
			reflection: {
				type: 'RATING_B' as const,
				weekNumber: 3,
				checkInDate: new Date().toISOString(),
				cycleLabel: 'Q1 2026 Leadership Cycle',
				participantName: 'John Doe',
				objectiveTitle: 'Improve executive presence'
			},
			isPreview: true,
			previousRatings: {
				weekNumber: 2,
				effortScore: 7,
				performanceScore: 6
			},
			historicRatings: [
				{ weekNumber: 2, effortScore: 7, performanceScore: 6 },
				{ weekNumber: 1, effortScore: 6, performanceScore: 5 }
			]
		};
	}

	if (!tokenParam) {
		throw redirect(302, '/stakeholder/invalid');
	}

	const token = await prisma.token.findUnique({
		where: { tokenHash: tokenParam },
		include: {
			stakeholder: true,
			reflection: {
				select: {
					id: true,
					reflectionType: true,
					weekNumber: true,
					checkInDate: true,
					cycleId: true,
					cycle: {
						select: {
							label: true,
							objective: {
								select: {
									title: true
								}
							}
						}
					},
					user: {
						select: {
							name: true
						}
					}
				}
			}
		}
	});

	if (!token || !token.stakeholder || !token.reflection || token.expiresAt < new Date()) {
		throw redirect(302, '/stakeholder/invalid');
	}

	// Fetch previous feedback ratings from this stakeholder (only if not Week 1)
	let previousRatings: {
		weekNumber: number;
		effortScore: number | null;
		performanceScore: number | null;
	} | null = null;
	let historicRatings: Array<{
		weekNumber: number;
		effortScore: number | null;
		performanceScore: number | null;
	}> = [];

	if (token.reflection.weekNumber > 1 && token.stakeholderId) {
		// Get all feedback submitted by this stakeholder for any reflection in the same cycle
		const allFeedbacks = await prisma.feedback.findMany({
			where: {
				stakeholderId: token.stakeholderId,
				reflection: {
					cycleId: token.reflection.cycleId,
					weekNumber: { lt: token.reflection.weekNumber }
				}
			},
			orderBy: {
				submittedAt: 'desc'
			},
			select: {
				effortScore: true,
				performanceScore: true,
				reflection: {
					select: {
						weekNumber: true
					}
				}
			}
		});

		if (allFeedbacks.length > 0) {
			// Get last feedback (most recent)
			const lastFeedback = allFeedbacks[0];
			previousRatings = {
				weekNumber: lastFeedback.reflection.weekNumber,
				effortScore: lastFeedback.effortScore,
				performanceScore: lastFeedback.performanceScore
			};

			// Build historic ratings map by week
			const historicMap = new Map<
				number,
				{ effortScore: number | null; performanceScore: number | null }
			>();

			allFeedbacks.forEach((feedback) => {
				const week = feedback.reflection.weekNumber;
				if (!historicMap.has(week)) {
					historicMap.set(week, { effortScore: null, performanceScore: null });
				}
				const weekData = historicMap.get(week)!;
				if (feedback.effortScore !== null) weekData.effortScore = feedback.effortScore;
				if (feedback.performanceScore !== null)
					weekData.performanceScore = feedback.performanceScore;
			});

			// Convert to array sorted by week number (descending)
			historicRatings = Array.from(historicMap.entries())
				.map(([weekNumber, scores]) => ({ weekNumber, ...scores }))
				.sort((a, b) => b.weekNumber - a.weekNumber);
		}
	}

	return {
		token: token.tokenHash,
		stakeholder: {
			name: token.stakeholder.name
		},
		reflection: {
			type: token.reflection.reflectionType,
			weekNumber: token.reflection.weekNumber,
			checkInDate: token.reflection.checkInDate.toISOString(),
			cycleLabel: token.reflection.cycle.label ?? 'Cycle',
			participantName: token.reflection.user.name ?? 'Participant',
			objectiveTitle: token.reflection.cycle.objective?.title?.trim() || 'the objective'
		},
		isPreview: false,
		previousRatings,
		historicRatings
	};
};

export const actions: Actions = {
	default: async ({ params, request, url }) => {
		const isPreview = url.searchParams.get('preview') === 'true';

		// Prevent submission in preview mode
		if (isPreview && params.token === 'preview') {
			return fail(400, { error: 'Preview mode - submissions are disabled.' });
		}

		const tokenParam = sanitizeToken(params.token);

		if (!tokenParam) {
			return fail(400, { error: 'Invalid or expired feedback token.' });
		}

		const formData = await request.formData();
		const payload = Object.fromEntries(formData) as Record<string, string>;
		payload.token = tokenParam;

		const parsed = stakeholderFeedbackSchema.safeParse(payload);

		if (!parsed.success) {
			const errors = parsed.error.flatten();
			return fail(400, {
				error: errors.fieldErrors.comment?.[0] ?? 'Invalid feedback submission.'
			});
		}

		const data = parsed.data;

		const token = await prisma.token.findUnique({
			where: { tokenHash: data.token },
			select: {
				id: true,
				usedAt: true,
				expiresAt: true,
				stakeholderId: true,
				reflectionId: true
			}
		});

		if (!token || token.usedAt || !token.reflectionId || !token.stakeholderId) {
			return fail(400, { error: 'This feedback link is no longer valid.' });
		}

		if (token.expiresAt < new Date()) {
			return fail(400, { error: 'This feedback link has expired.' });
		}

		// Fetch stakeholder and reflection details for notification
		const stakeholder = await prisma.stakeholder.findUnique({
			where: { id: token.stakeholderId! },
			select: { name: true, individual: { select: { id: true, name: true, email: true } } }
		});

		const reflection = await prisma.reflection.findUnique({
			where: { id: token.reflectionId! },
			select: {
				effortScore: true,
				performanceScore: true,
				user: {
					select: {
						name: true
					}
				},
				cycle: {
					select: {
						objective: {
							select: {
								title: true
							}
						}
					}
				}
			}
		});

		await prisma.$transaction(async (tx) => {
			await tx.feedback.upsert({
				where: {
					stakeholderId_reflectionId: {
						stakeholderId: token.stakeholderId!,
						reflectionId: token.reflectionId!
					}
				},
				update: {
					effortScore: data.effortScore ?? null,
					performanceScore: data.performanceScore ?? null,
					comment: data.comment ?? null,
					submittedAt: new Date()
				},
				create: {
					stakeholderId: token.stakeholderId!,
					reflectionId: token.reflectionId!,
					effortScore: data.effortScore ?? null,
					performanceScore: data.performanceScore ?? null,
					comment: data.comment ?? null,
					submittedAt: new Date()
				}
			});

			await tx.token.update({
				where: { id: token.id },
				data: { usedAt: new Date() }
			});
		});

		// Send notification email to individual when stakeholder submits feedback
		if (stakeholder?.individual && reflection) {
			try {
				const template = emailTemplates.stakeholderFeedbackReceived({
					individualName: stakeholder.individual.name || undefined,
					stakeholderName: stakeholder.name || undefined,
					appUrl: url.origin
				});
				await sendEmail({
					to: stakeholder.individual.email,
					...template
				});
			} catch (error) {
				console.error('[email:error] Failed to send stakeholder feedback notification', error);
				// Don't fail the request if email fails
			}
		}

		return {
			success: true,
			individualScores: reflection
				? {
						effortScore: reflection.effortScore,
						performanceScore: reflection.performanceScore,
						participantName: reflection.user.name ?? 'Participant'
					}
				: null
		};
	}
};
