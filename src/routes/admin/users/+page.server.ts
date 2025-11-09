import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { clerkClient } from 'svelte-clerk/server';
import type { Actions, PageServerLoad } from './$types';
import type { UserRole } from '@prisma/client';

const ALLOWED_ROLES: UserRole[] = ['INDIVIDUAL', 'COACH', 'STAKEHOLDER', 'ADMIN'];

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');

	const users = await prisma.user.findMany({
		orderBy: { createdAt: 'asc' },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			clerkUserId: true,
			createdAt: true,
			updatedAt: true
		}
	});

	return {
		users,
		roles: ALLOWED_ROLES
	};
};

export const actions: Actions = {
	default: async (event) => {
		requireRole(event, 'ADMIN');

		const formData = await event.request.formData();
		const userId = formData.get('userId');
		const role = formData.get('role');

		if (typeof userId !== 'string' || typeof role !== 'string') {
			return fail(400, { error: 'Invalid submission payload.' });
		}

		const normalizedRole = role.toUpperCase() as UserRole;

		if (!ALLOWED_ROLES.includes(normalizedRole)) {
			return fail(400, { error: 'Unsupported role selection.' });
		}

		try {
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { role: normalizedRole }
			});

			if (updatedUser.clerkUserId) {
				await clerkClient.users.updateUser(updatedUser.clerkUserId, {
					publicMetadata: {
						role: normalizedRole
					}
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Failed to update user role', error);
			return fail(500, { error: 'Unable to update role. Please try again.' });
		}
	}
};
