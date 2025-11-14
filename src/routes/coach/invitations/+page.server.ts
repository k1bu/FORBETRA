import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import { randomBytes, createHash } from 'crypto';
import type { Actions, PageServerLoad } from './$types';
import type { Prisma, TokenType } from '@prisma/client';

const generateTokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

const createInviteToken = () => randomBytes(32).toString('hex');

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'COACH');

	const invitations = await prisma.coachInvite.findMany({
		where: { coachId: dbUser.id },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			email: true,
			name: true,
			message: true,
			expiresAt: true,
			acceptedAt: true,
			cancelledAt: true,
			individual: {
				select: {
					id: true,
					name: true,
					email: true
				}
			},
			createdAt: true
		}
	});

	return {
		coach: {
			name: dbUser.name ?? 'Coach'
		},
		invitations: invitations.map((invite) => ({
			id: invite.id,
			email: invite.email,
			name: invite.name,
			message: invite.message,
			expiresAt: invite.expiresAt.toISOString(),
			acceptedAt: invite.acceptedAt?.toISOString() ?? null,
			cancelledAt: invite.cancelledAt?.toISOString() ?? null,
			individual: invite.individual
				? {
						id: invite.individual.id,
						name: invite.individual.name ?? invite.individual.email,
						email: invite.individual.email
					}
				: null,
			createdAt: invite.createdAt.toISOString()
		}))
	};
};

export const actions: Actions = {
	createInvite: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');

		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const name = String(formData.get('name') ?? '').trim();
		const message = String(formData.get('message') ?? '').trim();

		if (!email || !email.includes('@')) {
			return fail(400, {
				error: 'Please provide a valid email address.',
				values: { email, name, message }
			});
		}

		const existingInvite = await prisma.coachInvite.findFirst({
			where: {
				coachId: dbUser.id,
				email
			}
		});

		if (existingInvite && !existingInvite.cancelledAt && !existingInvite.acceptedAt) {
			return fail(400, {
				error: 'An active invitation already exists for this email.',
				inviteId: existingInvite.id,
				values: { email, name, message }
			});
		}

		const tokenRaw = createInviteToken();
		const tokenHash = generateTokenHash(tokenRaw);
		const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

		try {
			const invite = await prisma.$transaction(async (tx) => {
				if (existingInvite) {
					await tx.token.deleteMany({
						where: {
							tokenHash: existingInvite.tokenHash,
							type: 'COACH_INVITE'
						}
					});

					const updatedInvite = await tx.coachInvite.update({
						where: { id: existingInvite.id },
						data: {
							name: name.length > 0 ? name : existingInvite.name,
							message: message.length > 0 ? message : existingInvite.message,
							tokenHash,
							expiresAt,
							acceptedAt: null,
							cancelledAt: null,
							individualId: null
						}
					});

					await tx.token.create({
						data: {
							type: 'COACH_INVITE' satisfies TokenType,
							tokenHash,
							userId: dbUser.id,
							expiresAt
						}
					});

					return updatedInvite;
				}

				const createdInvite = await tx.coachInvite.create({
					data: {
						coachId: dbUser.id,
						email,
						name: name.length > 0 ? name : null,
						message: message.length > 0 ? message : null,
						tokenHash,
						expiresAt
					}
				});

				await tx.token.create({
					data: {
						type: 'COACH_INVITE' satisfies TokenType,
						tokenHash,
						userId: dbUser.id,
						expiresAt
					}
				});

				return createdInvite;
			});

			const inviteUrl = new URL(`/coach/invite/${tokenRaw}`, event.url.origin).toString();

			return {
				success: true,
				inviteId: invite.id,
				inviteUrl
			};
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				return fail(400, {
					error: 'An invitation already exists for this email. Cancel or reuse the existing invite.',
					values: { email, name, message }
				});
			}

			console.error('Failed to create coach invite', error);
			throw error;
		}
	},
	cancelInvite: async (event) => {
		const { dbUser } = requireRole(event, 'COACH');
		const formData = await event.request.formData();
		const inviteId = String(formData.get('inviteId') ?? '');

		if (!inviteId) {
			return fail(400, { error: 'Missing invitation identifier.' });
		}

		const invite = await prisma.coachInvite.findUnique({
			where: { id: inviteId }
		});

		if (!invite || invite.coachId !== dbUser.id) {
			return fail(404, { error: 'Invitation not found.' });
		}

		if (invite.acceptedAt) {
			return fail(400, { error: 'Invitation has already been accepted.' });
		}

		if (invite.cancelledAt) {
			return { success: true };
		}

		await prisma.$transaction(async (tx) => {
			await tx.coachInvite.update({
				where: { id: inviteId },
				data: {
					cancelledAt: new Date()
				}
			});

			await tx.token.deleteMany({
				where: {
					tokenHash: invite.tokenHash,
					type: 'COACH_INVITE'
				}
			});
		});

		return { success: true };
	}
};

