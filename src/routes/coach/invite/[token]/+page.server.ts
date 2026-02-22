import prisma from '$lib/server/prisma';
import { getOptionalAuth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { createHash } from 'crypto';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import type { Actions, PageServerLoad } from './$types';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const sanitizeToken = (value: string | null | undefined) => {
	if (!value) return null;
	const token = value.trim();
	if (token.length === 0 || token.length > 128) return null;
	if (!/^[a-f0-9]+$/i.test(token)) return null;
	return token;
};

type InviteStatus = 'invalid' | 'expired' | 'cancelled' | 'accepted' | 'valid';

const resolveInviteStatus = (
	expiresAt: Date,
	acceptedAt: Date | null,
	cancelledAt: Date | null
): InviteStatus => {
	if (cancelledAt) return 'cancelled';
	if (acceptedAt) return 'accepted';
	if (expiresAt < new Date()) return 'expired';
	return 'valid';
};

export const load: PageServerLoad = async (event) => {
	const { dbUser } = getOptionalAuth(event);
	const tokenParam = sanitizeToken(event.params.token);

	if (!tokenParam) {
		return {
			status: 'invalid' as InviteStatus,
			invite: null,
			user: dbUser
				? {
						id: dbUser.id,
						email: dbUser.email,
						role: dbUser.role,
						name: dbUser.name
					}
				: null
		};
	}

	const tokenHash = hashToken(tokenParam);

	const invite = await prisma.coachInvite.findFirst({
		where: { tokenHash },
		select: {
			id: true,
			email: true,
			name: true,
			message: true,
			coachId: true,
			expiresAt: true,
			acceptedAt: true,
			cancelledAt: true,
			individualId: true,
			createdAt: true,
			coach: {
				select: {
					id: true,
					name: true,
					email: true
				}
			}
		}
	});

	if (!invite) {
		return {
			status: 'invalid' as InviteStatus,
			invite: null,
			user: dbUser
				? {
						id: dbUser.id,
						email: dbUser.email,
						role: dbUser.role,
						name: dbUser.name
					}
				: null
		};
	}

	const status = resolveInviteStatus(invite.expiresAt, invite.acceptedAt, invite.cancelledAt);

	return {
		status,
		token: tokenParam,
		invite: {
			id: invite.id,
			email: invite.email,
			name: invite.name,
			message: invite.message,
			coach: {
				id: invite.coach.id,
				name: invite.coach.name ?? invite.coach.email,
				email: invite.coach.email
			},
			expiresAt: invite.expiresAt.toISOString(),
			acceptedAt: invite.acceptedAt?.toISOString() ?? null,
			cancelledAt: invite.cancelledAt?.toISOString() ?? null,
			createdAt: invite.createdAt.toISOString(),
			individualId: invite.individualId
		},
		user: dbUser
			? {
					id: dbUser.id,
					email: dbUser.email,
					role: dbUser.role,
					name: dbUser.name
				}
			: null
	};
};

export const actions: Actions = {
	accept: async (event) => {
		const formData = await event.request.formData();
		const rawToken = sanitizeToken(formData.get('token')?.toString());

		if (!rawToken) {
			return fail(400, { error: 'Invalid invitation token.' });
		}

		const { dbUser } = getOptionalAuth(event);

		if (!dbUser) {
			return fail(401, { error: 'Please sign in or create an account to accept this invitation.' });
		}

		if (dbUser.role !== 'INDIVIDUAL') {
			return fail(403, {
				error: 'Only individual accounts can accept a coach invitation. Please contact support.'
			});
		}

		const tokenHash = hashToken(rawToken);

		const invite = await prisma.coachInvite.findFirst({
			where: { tokenHash },
			select: {
				id: true,
				coachId: true,
				expiresAt: true,
				acceptedAt: true,
				cancelledAt: true,
				individualId: true,
				tokenHash: true
			}
		});

		if (!invite) {
			return fail(400, { error: 'This invitation is no longer valid.' });
		}

		const status = resolveInviteStatus(invite.expiresAt, invite.acceptedAt, invite.cancelledAt);

		if (status === 'expired') {
			return fail(400, { error: 'This invitation has expired.' });
		}

		if (status === 'cancelled') {
			return fail(400, { error: 'This invitation has been cancelled.' });
		}

		if (status === 'accepted' && invite.individualId && invite.individualId !== dbUser.id) {
			return fail(400, { error: 'This invitation has already been accepted by another user.' });
		}

		await prisma.$transaction(async (tx) => {
			await tx.coachInvite.update({
				where: { id: invite.id },
				data: {
					acceptedAt: new Date(),
					individualId: dbUser.id,
					cancelledAt: null
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
		});

		// Notify the coach that their invite was accepted
		try {
			const coach = await prisma.user.findUnique({
				where: { id: invite.coachId },
				select: { email: true, name: true }
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
			}
		} catch (error) {
			console.warn('Failed to send coach notification email', error);
		}

		return {
			success: true
		};
	}
};

