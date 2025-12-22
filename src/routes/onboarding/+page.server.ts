import { fail, redirect } from '@sveltejs/kit';
import { onboardingContexts } from '$lib/content/onboardingTemplates';
import { requireRole } from '$lib/server/auth';
import prisma from '$lib/server/prisma';
import { onboardingSchema } from '$lib/validation/onboarding';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
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
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const existingObjective = await prisma.objective.findFirst({
		where: { userId: dbUser.id },
		select: { id: true }
	});

	if (existingObjective) {
		throw redirect(303, '/onboarding/complete');
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
		contexts: onboardingContexts
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();

		const objectiveTitle = (formData.get('objectiveTitle') ?? '').toString().trim();
		const objectiveDescription = (formData.get('objectiveDescription') ?? '').toString().trim();
		const cycleLabel = (formData.get('cycleLabel') ?? '').toString().trim();
		const cycleStartDate = (formData.get('cycleStartDate') ?? '').toString();
		const cycleDurationWeeksRaw = (formData.get('cycleDurationWeeks') ?? '').toString();
		const cycleDurationWeeksValue = Number.parseInt(cycleDurationWeeksRaw, 10);
		const reminderDays = (formData.get('reminderDays') ?? 'wednesday_friday').toString() as
			| 'wednesday_friday'
			| 'tuesday_thursday';

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
			return { name, email, relationship };
		}).filter((stakeholder) => stakeholder.name && stakeholder.email); // Only include stakeholders with both name and email (required by validation)

		const submission = {
			objectiveTitle,
			objectiveDescription,
			subgoals,
			stakeholders,
			cycleLabel,
			cycleStartDate,
			cycleDurationWeeks: cycleDurationWeeksRaw
		};

		const parsed = onboardingSchema.safeParse({
			objectiveTitle: submission.objectiveTitle,
			objectiveDescription:
				submission.objectiveDescription.length > 0 ? submission.objectiveDescription : undefined,
			subgoals: submission.subgoals.map((subgoal) => ({
				label: subgoal.label,
				description: subgoal.description.length > 0 ? subgoal.description : undefined
			})),
			stakeholders: submission.stakeholders.map((stakeholder) => ({
				name: stakeholder.name,
				email: stakeholder.email,
				relationship: stakeholder.relationship.length > 0 ? stakeholder.relationship : undefined
			})),
			cycleLabel: submission.cycleLabel.length > 0 ? submission.cycleLabel : undefined,
			cycleStartDate: submission.cycleStartDate,
			cycleDurationWeeks: cycleDurationWeeksValue
		});

		if (!parsed.success) {
			console.error(
				'[onboarding:validation] Validation failed:',
				JSON.stringify(parsed.error.issues, null, 2)
			);
			console.error('[onboarding:validation] Submission data:', {
				objectiveTitle: submission.objectiveTitle,
				subgoalsCount: submission.subgoals.length,
				stakeholdersCount: submission.stakeholders.length,
				cycleStartDate: submission.cycleStartDate,
				cycleDurationWeeks: cycleDurationWeeksValue
			});
			return fail(400, {
				errors: formatErrors(parsed.error.issues),
				values: submission
			});
		}

		const data = parsed.data;

		try {
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
						await tx.stakeholder.create({
							data: {
								individualId: dbUser.id,
								objectiveId: objective.id,
								name: stakeholder.name,
								email: stakeholder.email,
								relationship: stakeholder.relationship ?? null
							}
						});

						// Send welcome email to stakeholder (after transaction)
						// We'll do this outside the transaction to avoid blocking
						setTimeout(async () => {
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
						}, 0);
					}
				}

				const startDate = new Date(data.cycleStartDate);
				const endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + data.cycleDurationWeeks * 7);

				await tx.cycle.create({
					data: {
						userId: dbUser.id,
						objectiveId: objective.id,
						label: data.cycleLabel && data.cycleLabel.length > 0 ? data.cycleLabel : 'Cycle 1',
						startDate,
						endDate,
						status: 'ACTIVE'
					}
				});

				// Store reminder days preference in User model
				await tx.user.update({
					where: { id: dbUser.id },
					data: { reminderDays }
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
				}
			});
		} catch (error) {
			console.error('[onboarding:error] Failed to create objective:', error);
			return fail(500, {
				errors: { _general: ['Failed to save your onboarding data. Please try again.'] },
				values: submission
			});
		}

		throw redirect(303, '/onboarding/initial-ratings');
	}
};
