import { fail, redirect } from '@sveltejs/kit';
import { onboardingContexts } from '$lib/content/onboardingTemplates';
import { requireRole } from '$lib/server/auth';
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import { onboardingSchema } from '$lib/validation/onboarding';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import type { Actions, PageServerLoad } from './$types';
import type { ZodIssue } from 'zod';

const MAX_SUBGOALS = 5;
const MAX_STAKEHOLDERS = 5;

const formatErrors = (issues: ZodIssue[]) =>
	issues.reduce(
		(acc, issue) => {
			const path = issue.path.join('.');
			if (!acc[path]) {
				acc[path] = [];
			}
			acc[path].push(issue.message);
			return acc;
		},
		{} as Record<string, string[]>
	);

export const load: PageServerLoad = async (event) => {
	const isPreview = event.url.searchParams.get('preview') === 'true';
	const { dbUser } = requireRole(event, isPreview ? ['INDIVIDUAL', 'ADMIN'] : 'INDIVIDUAL');

	const existingObjective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { orderBy: { createdAt: 'asc' } },
			stakeholders: { orderBy: { createdAt: 'asc' } },
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1
			}
		}
	});

	// If editing, load existing data; otherwise show blank form
	let existingData: {
		objectiveId: string;
		objectiveTitle: string;
		objectiveDescription: string;
		subgoals: Array<{ id?: string; label: string; description: string }>;
		stakeholders: Array<{ id?: string; name: string; email: string; relationship: string }>;
		cycleLabel: string;
		cycleStartDate: string;
		cycleDurationWeeks: number;
		checkInFrequency: string;
		stakeholderCadence: string;
	} | null = null;
	let isPrePopulated = false;

	if (existingObjective && !isPreview) {
		const cycle = existingObjective.cycles[0] ?? null;
		const durationWeeks =
			cycle?.endDate && cycle?.startDate
				? Math.round(
						(cycle.endDate.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
					)
				: 12;

		existingData = {
			objectiveId: existingObjective.id,
			objectiveTitle: existingObjective.title,
			objectiveDescription: existingObjective.description ?? '',
			subgoals: existingObjective.subgoals.map((s) => ({
				id: s.id,
				label: s.label,
				description: s.description ?? ''
			})),
			stakeholders: existingObjective.stakeholders.map((s) => ({
				id: s.id,
				name: s.name,
				email: s.email,
				relationship: s.relationship ?? ''
			})),
			cycleLabel: cycle?.label ?? '',
			cycleStartDate:
				cycle?.startDate.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
			cycleDurationWeeks: durationWeeks,
			checkInFrequency: cycle?.checkInFrequency ?? 'mon,tue,wed,thu,fri',
			stakeholderCadence: cycle?.stakeholderCadence ?? 'weekly'
		};
	}

	// Check for coach invite with pre-fill payload (only if no existing objective)
	if (!existingData && !isPreview) {
		const coachInvite = await prisma.coachInvite.findFirst({
			where: {
				email: dbUser.email.toLowerCase(),
				acceptedAt: { not: null },
				payload: { not: Prisma.DbNull }
			},
			orderBy: { updatedAt: 'desc' },
			select: { payload: true }
		});

		if (coachInvite?.payload && typeof coachInvite.payload === 'object') {
			const p = coachInvite.payload as Record<string, unknown>;
			if (p.objectiveTitle) {
				existingData = {
					objectiveId: '',
					objectiveTitle: (p.objectiveTitle as string) ?? '',
					objectiveDescription: (p.objectiveDescription as string) ?? '',
					subgoals: Array.isArray(p.subgoals)
						? (p.subgoals as Record<string, unknown>[]).map((s) => ({
								label: (s.label as string) ?? '',
								description: (s.description as string) ?? ''
							}))
						: [],
					stakeholders: Array.isArray(p.stakeholders)
						? (p.stakeholders as Record<string, unknown>[]).map((s) => ({
								name: (s.name as string) ?? '',
								email: (s.email as string) ?? '',
								relationship: ''
							}))
						: [],
					cycleLabel: (p.objectiveTitle as string) ?? '',
					cycleStartDate: new Date().toISOString().slice(0, 10),
					cycleDurationWeeks: (p.cycleDurationWeeks as number) ?? 12,
					checkInFrequency: (p.checkInFrequency as string) ?? '3x',
					stakeholderCadence: (p.stakeholderCadence as string) ?? 'weekly'
				};
				isPrePopulated = true;
			}
		}
	}

	return {
		user: {
			name: dbUser.name,
			email: dbUser.email
		},
		defaults: {
			startDate: new Date().toISOString().slice(0, 10),
			durationWeeks: 12
		},
		contexts: onboardingContexts,
		existingData,
		isEditing: !!existingData && !isPrePopulated,
		isPrePopulated
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();

		const objectiveId = (formData.get('objectiveId') ?? '').toString().trim();
		const isEditMode = objectiveId.length > 0;

		const objectiveTitle = (formData.get('objectiveTitle') ?? '').toString().trim();
		const objectiveDescription = (formData.get('objectiveDescription') ?? '').toString().trim();
		const cycleLabel = (formData.get('cycleLabel') ?? '').toString().trim();
		const cycleStartDate = (formData.get('cycleStartDate') ?? '').toString();
		const cycleDurationWeeksRaw = (formData.get('cycleDurationWeeks') ?? '').toString();
		const cycleDurationWeeksValue = Number.parseInt(cycleDurationWeeksRaw, 10);
		const reminderDays = (formData.get('reminderDays') ?? 'wednesday_friday').toString() as
			| 'wednesday_friday'
			| 'tuesday_thursday';
		const checkInFrequency = (formData.get('checkInFrequency') ?? 'mon,tue,wed,thu,fri').toString();
		const stakeholderCadenceRaw = (formData.get('stakeholderCadence') ?? 'weekly').toString();
		const stakeholderCadence = stakeholderCadenceRaw;
		const stakeholderFeedbackTime = (formData.get('stakeholderFeedbackTime') ?? '09:00')
			.toString()
			.trim();
		const revealScores = (formData.get('revealScores') ?? 'true').toString() === 'true';
		const phone = (formData.get('phone') ?? '').toString().trim() || null;
		const notificationTime = (formData.get('notificationTime') ?? '09:00').toString().trim();
		const deliveryMethod = (formData.get('deliveryMethod') ?? 'email').toString().trim();
		const sendStakeholderIntro =
			(formData.get('sendStakeholderIntro') ?? 'true').toString() !== 'false';

		const subgoals = Array.from({ length: MAX_SUBGOALS }, (_, index) => {
			const label = (formData.get(`subgoalLabel${index + 1}`) ?? '').toString().trim();
			const description = (formData.get(`subgoalDescription${index + 1}`) ?? '').toString().trim();
			return { label, description };
		}).filter((subgoal) => subgoal.label.length > 0 || subgoal.description.length > 0);

		const stakeholders = Array.from({ length: MAX_STAKEHOLDERS }, (_, index) => {
			const name = (formData.get(`stakeholderName${index + 1}`) ?? '').toString().trim();
			const email = (formData.get(`stakeholderEmail${index + 1}`) ?? '').toString().trim();
			const relationship = (formData.get(`stakeholderRelationship${index + 1}`) ?? '')
				.toString()
				.trim();
			const phone = (formData.get(`stakeholderPhone${index + 1}`) ?? '').toString().trim();
			return { name, email, relationship, phone };
		}).filter((stakeholder) => stakeholder.name && stakeholder.email);

		const submission = {
			objectiveTitle,
			objectiveDescription,
			subgoals,
			stakeholders,
			cycleLabel,
			cycleStartDate,
			cycleDurationWeeks: cycleDurationWeeksRaw,
			checkInFrequency,
			stakeholderCadence
		};

		const parsed = onboardingSchema.safeParse({
			objectiveTitle: submission.objectiveTitle,
			objectiveDescription:
				submission.objectiveDescription.length > 0 ? submission.objectiveDescription : undefined,
			subgoals: submission.subgoals.map((subgoal) => ({
				label: subgoal.label,
				description: subgoal.description.length > 0 ? subgoal.description : undefined
			})),
			stakeholders:
				submission.stakeholders.length > 0
					? submission.stakeholders.map((stakeholder) => ({
							name: stakeholder.name,
							email: stakeholder.email,
							relationship:
								stakeholder.relationship.length > 0 ? stakeholder.relationship : undefined
						}))
					: [],
			cycleLabel: submission.cycleLabel.length > 0 ? submission.cycleLabel : undefined,
			cycleStartDate: submission.cycleStartDate,
			cycleDurationWeeks: cycleDurationWeeksValue,
			checkInFrequency: submission.checkInFrequency,
			stakeholderCadence: submission.stakeholderCadence
		});

		if (!parsed.success) {
			console.error(
				'[onboarding:validation] Validation failed:',
				JSON.stringify(parsed.error.issues, null, 2)
			);
			return fail(400, {
				errors: formatErrors(parsed.error.issues),
				values: submission
			});
		}

		const data = parsed.data;

		try {
			if (isEditMode) {
				// --- EDIT MODE: update existing objective ---
				await prisma.$transaction(async (tx) => {
					// Update objective
					await tx.objective.update({
						where: { id: objectiveId },
						data: {
							title: data.objectiveTitle,
							description: data.objectiveDescription ?? null
						}
					});

					// Soft-replace subgoals: deactivate old ones, create new ones
					await tx.subgoal.updateMany({
						where: { objectiveId },
						data: { active: false }
					});

					for (const subgoal of data.subgoals) {
						await tx.subgoal.create({
							data: {
								objectiveId,
								label: subgoal.label,
								description: subgoal.description ?? null
							}
						});
					}

					// Upsert stakeholders: match by email, create new ones
					const existingStakeholders = await tx.stakeholder.findMany({
						where: { objectiveId },
						select: { id: true, email: true }
					});
					const existingEmailMap = new Map(
						existingStakeholders.map((s) => [s.email.toLowerCase(), s.id])
					);

					if (data.stakeholders && data.stakeholders.length > 0) {
						for (const stakeholder of data.stakeholders) {
							const matchedStakeholderInput = stakeholders.find(
								(s) => s.email.toLowerCase() === stakeholder.email.toLowerCase()
							);
							const stakeholderPhone = matchedStakeholderInput?.phone || null;
							const existingId = existingEmailMap.get(stakeholder.email.toLowerCase());
							if (existingId) {
								await tx.stakeholder.update({
									where: { id: existingId },
									data: {
										name: stakeholder.name,
										relationship: stakeholder.relationship ?? null,
										phone: stakeholderPhone
									}
								});
							} else {
								await tx.stakeholder.create({
									data: {
										individualId: dbUser.id,
										objectiveId,
										name: stakeholder.name,
										email: stakeholder.email,
										relationship: stakeholder.relationship ?? null,
										phone: stakeholderPhone
									}
								});

								if (sendStakeholderIntro) {
									// Send welcome email to new stakeholder
									try {
										const template = emailTemplates.welcomeStakeholder({
											individualName: dbUser.name || undefined,
											stakeholderName: stakeholder.name || undefined,
											appUrl:
												process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
													? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
													: 'https://app.forbetra.com'
										});
										await sendEmail({
											to: stakeholder.email,
											...template
										});
									} catch (error) {
										console.error('[email:error] Failed to send stakeholder welcome email', error);
									}

									// Send welcome SMS to new stakeholder
									await trySendSms(
										stakeholderPhone,
										smsTemplates.welcomeStakeholder({
											stakeholderName: stakeholder.name || undefined,
											individualName: dbUser.name || undefined,
											appUrl: event.url.origin
										})
									);
								}
							}
						}
					}

					// Update cycle config
					const existingCycle = await tx.cycle.findFirst({
						where: { objectiveId },
						orderBy: { startDate: 'desc' }
					});

					if (existingCycle) {
						const startDate = new Date(data.cycleStartDate);
						const endDate = new Date(startDate);
						endDate.setDate(endDate.getDate() + data.cycleDurationWeeks * 7);

						await tx.cycle.update({
							where: { id: existingCycle.id },
							data: {
								label:
									data.cycleLabel && data.cycleLabel.trim().length > 0
										? data.cycleLabel.trim()
										: existingCycle.label,
								startDate,
								endDate,
								checkInFrequency: data.checkInFrequency,
								stakeholderCadence: data.stakeholderCadence,
								stakeholderFeedbackTime,
								revealScores
							}
						});
					}

					// Update reminder days
					await tx.user.update({
						where: { id: dbUser.id },
						data: { reminderDays, phone, notificationTime, deliveryMethod }
					});
				});

				// Edit mode: skip initial-ratings, go directly to complete
				throw redirect(303, '/onboarding/complete');
			} else {
				// --- CREATE MODE: original logic ---
				const acceptedCoachIds: string[] = [];
				await prisma.$transaction(async (tx) => {
					const objective = await tx.objective.create({
						data: {
							userId: dbUser.id,
							title: data.objectiveTitle,
							description: data.objectiveDescription ?? null
						}
					});

					for (const subgoal of data.subgoals) {
						await tx.subgoal.create({
							data: {
								objectiveId: objective.id,
								label: subgoal.label,
								description: subgoal.description ?? null
							}
						});
					}

					if (data.stakeholders && data.stakeholders.length > 0) {
						for (const stakeholder of data.stakeholders) {
							const matchedStakeholderInput = stakeholders.find(
								(s) => s.email.toLowerCase() === stakeholder.email.toLowerCase()
							);
							const stakeholderPhone = matchedStakeholderInput?.phone || null;
							await tx.stakeholder.create({
								data: {
									individualId: dbUser.id,
									objectiveId: objective.id,
									name: stakeholder.name,
									email: stakeholder.email,
									relationship: stakeholder.relationship ?? null,
									phone: stakeholderPhone
								}
							});

							if (sendStakeholderIntro) {
								try {
									const template = emailTemplates.welcomeStakeholder({
										individualName: dbUser.name || undefined,
										stakeholderName: stakeholder.name || undefined,
										appUrl:
											process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
												? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
												: 'https://app.forbetra.com'
									});
									await sendEmail({
										to: stakeholder.email,
										...template
									});
								} catch (error) {
									console.error('[email:error] Failed to send stakeholder welcome email', error);
								}

								// Send welcome SMS to stakeholder
								await trySendSms(
									stakeholderPhone,
									smsTemplates.welcomeStakeholder({
										stakeholderName: stakeholder.name || undefined,
										individualName: dbUser.name || undefined,
										appUrl: event.url.origin
									})
								);
							}
						}
					}

					const startDate = new Date(data.cycleStartDate);
					if (isNaN(startDate.getTime())) {
						throw new Error(`Invalid start date: ${data.cycleStartDate}`);
					}
					const endDate = new Date(startDate);
					endDate.setDate(endDate.getDate() + data.cycleDurationWeeks * 7);
					if (isNaN(endDate.getTime())) {
						throw new Error(`Invalid end date calculation for start date: ${data.cycleStartDate}`);
					}

					await tx.cycle.create({
						data: {
							userId: dbUser.id,
							objectiveId: objective.id,
							label:
								data.cycleLabel && data.cycleLabel.trim().length > 0
									? data.cycleLabel.trim()
									: 'Cycle 1',
							startDate,
							endDate,
							status: 'ACTIVE',
							checkInFrequency: data.checkInFrequency,
							stakeholderCadence: data.stakeholderCadence,
							stakeholderFeedbackTime,
							revealScores
						}
					});

					// Store preferences in User model
					await tx.user.update({
						where: { id: dbUser.id },
						data: { reminderDays, phone, notificationTime, deliveryMethod }
					});

					const pendingInvites = await tx.coachInvite.findMany({
						where: {
							email: dbUser.email.toLowerCase(),
							acceptedAt: null,
							cancelledAt: null,
							expiresAt: {
								gt: new Date()
							}
						},
						select: {
							id: true,
							coachId: true,
							tokenHash: true
						}
					});

					for (const invite of pendingInvites) {
						await tx.coachInvite.update({
							where: { id: invite.id },
							data: {
								acceptedAt: new Date(),
								individualId: dbUser.id
							}
						});

						await tx.coachClient.upsert({
							where: {
								coachId_individualId: {
									coachId: invite.coachId,
									individualId: dbUser.id
								}
							},
							update: {
								archivedAt: null
							},
							create: {
								coachId: invite.coachId,
								individualId: dbUser.id
							}
						});

						await tx.token.updateMany({
							where: {
								tokenHash: invite.tokenHash,
								type: 'COACH_INVITE'
							},
							data: {
								usedAt: new Date()
							}
						});

						acceptedCoachIds.push(invite.coachId);
					}
				});

				// Notify coaches whose invites were auto-accepted during onboarding
				for (const coachId of acceptedCoachIds) {
					try {
						const coach = await prisma.user.findUnique({
							where: { id: coachId },
							select: { email: true, name: true, phone: true }
						});

						if (coach) {
							const template = emailTemplates.coachClientAccepted({
								coachName: coach.name ?? 'Coach',
								clientName: dbUser.name ?? dbUser.email,
								clientEmail: dbUser.email
							});
							await sendEmail({
								to: coach.email,
								subject: template.subject,
								html: template.html,
								text: template.text
							});

							// Send SMS to coach
							await trySendSms(
								coach.phone,
								smsTemplates.coachClientAccepted({
									clientName: dbUser.name ?? dbUser.email
								})
							);
						}
					} catch (error) {
						console.warn('[onboarding:coach-notify] Failed to send coach notification', error);
					}
				}

				throw redirect(303, '/onboarding/initial-ratings');
			}
		} catch (error) {
			// Re-throw redirects
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error;
			}
			console.error('[onboarding:error] Failed to save:', error);
			const errorMessage =
				process.env.NODE_ENV === 'development' && error instanceof Error
					? `Failed to save: ${error.message}`
					: 'Failed to save your onboarding data. Please try again.';
			return fail(500, {
				errors: { _general: [errorMessage] },
				values: submission
			});
		}
	}
};
