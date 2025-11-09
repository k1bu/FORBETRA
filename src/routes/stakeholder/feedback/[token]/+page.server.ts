import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { stakeholderFeedbackSchema } from '$lib/validation/feedback';
import type { Actions, PageServerLoad } from './$types';

const sanitizeToken = (value: string | undefined) => {
	if (!value) return null;
	return /^[a-f0-9]{64}$/i.test(value) ? value : null;
};

export const load: PageServerLoad = async ({ params }) => {
	const tokenParam = sanitizeToken(params.token);

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
					cycle: {
						select: {
							label: true
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
			participantName: token.reflection.user.name ?? 'Participant'
		}
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
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
					progressScore: data.progressScore ?? null,
					comment: data.comment ?? null,
					submittedAt: new Date()
				},
				create: {
					stakeholderId: token.stakeholderId!,
					reflectionId: token.reflectionId!,
					effortScore: data.effortScore ?? null,
					progressScore: data.progressScore ?? null,
					comment: data.comment ?? null,
					submittedAt: new Date()
				}
			});

			await tx.token.update({
				where: { id: token.id },
				data: { usedAt: new Date() }
			});
		});

		return { success: true };
	}
};
