import { sequence } from '@sveltejs/kit/hooks';
import prisma from '$lib/server/prisma';
import { clerkClient, withClerkHandler } from 'svelte-clerk/server';
import type { Prisma, UserRole } from '@prisma/client';

const DEFAULT_ROLE: UserRole = 'INDIVIDUAL';
const ALLOWED_ROLES = new Set<UserRole>(['INDIVIDUAL', 'COACH', 'STAKEHOLDER', 'ADMIN']);

const clerkHandle = withClerkHandler();

const linkPendingCoachInvites = async (user: { id: string; email: string; role: UserRole }) => {
	if (user.role !== 'INDIVIDUAL') return;

	const pendingInvites = await prisma.coachInvite.findMany({
		where: {
			email: user.email.toLowerCase(),
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

	if (pendingInvites.length === 0) return;

	await prisma.$transaction(async (tx) => {
		for (const invite of pendingInvites) {
			await tx.coachInvite.update({
				where: { id: invite.id },
				data: {
					acceptedAt: new Date(),
					individualId: user.id
				}
			});

			await tx.coachClient.upsert({
				where: {
					coachId_individualId: {
						coachId: invite.coachId,
						individualId: user.id
					}
				},
				update: {
					archivedAt: null
				},
				create: {
					coachId: invite.coachId,
					individualId: user.id
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
};

export const handle = sequence(clerkHandle, async ({ event, resolve }) => {
	const auth = event.locals.auth();

	if (!auth.userId) {
		event.locals.dbUser = null;
		return resolve(event);
	}

	const existingUser = await prisma.user.findUnique({
		where: { clerkUserId: auth.userId }
	});

	const clerkUser = await clerkClient.users.getUser(auth.userId);
	const primaryEmail =
		clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
			?.emailAddress ??
		clerkUser.emailAddresses[0]?.emailAddress ??
		'';

	const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;
	const metadataRoleRaw = clerkUser.publicMetadata?.role;
	const metadataRole =
		typeof metadataRoleRaw === 'string' ? (metadataRoleRaw.toUpperCase() as UserRole) : null;
	const resolvedRole =
		(metadataRole && ALLOWED_ROLES.has(metadataRole) ? metadataRole : undefined) ??
		existingUser?.role ??
		DEFAULT_ROLE;

	if (!primaryEmail) {
		console.error('Clerk user is missing an email address', { clerkUserId: auth.userId });
		event.locals.dbUser = existingUser ?? null;
		return resolve(event);
	}

	if (!existingUser) {
		const dbUser = await prisma.user.create({
			data: {
				clerkUserId: auth.userId,
				email: primaryEmail,
				name: fullName,
				role: resolvedRole
			}
		});

		await linkPendingCoachInvites(dbUser);

		event.locals.dbUser = dbUser;
		return resolve(event);
	}

	const updates: Prisma.UserUpdateInput = {};

	if (existingUser.email !== primaryEmail) {
		updates.email = primaryEmail;
	}

	if (existingUser.name !== fullName) {
		updates.name = fullName;
	}

	if (existingUser.role !== resolvedRole) {
		updates.role = resolvedRole;
	}

	if (Object.keys(updates).length === 0) {
		await linkPendingCoachInvites(existingUser);

		event.locals.dbUser = existingUser;
		return resolve(event);
	}

	const dbUser = await prisma.user.update({
		where: { id: existingUser.id },
		data: updates
	});

	await linkPendingCoachInvites(dbUser);

	event.locals.dbUser = dbUser;

	return resolve(event);
});
