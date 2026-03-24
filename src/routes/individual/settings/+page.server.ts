import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { clerkClient } from 'svelte-clerk/server';
import type { Actions, PageServerLoad } from './$types';
import { validatePhone, normalizePhone } from '$lib/utils/phone';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const activeCycle = await prisma.cycle.findFirst({
		where: {
			objective: { userId: dbUser.id, active: true },
			status: 'ACTIVE'
		},
		select: { id: true, revealScores: true }
	});

	return {
		user: {
			name: dbUser.name ?? '',
			email: dbUser.email,
			phone: dbUser.phone ?? '',
			timezone: dbUser.timezone ?? '',
			notificationTime: dbUser.notificationTime ?? '09:00',
			deliveryMethod: dbUser.deliveryMethod ?? 'email',
			role: dbUser.role
		},
		activeCycle: activeCycle ? { id: activeCycle.id, revealScores: activeCycle.revealScores } : null
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const phone = formData.get('phone')?.toString().trim() ?? '';
		const timezone = formData.get('timezone')?.toString().trim() ?? '';
		const notificationTime = formData.get('notificationTime')?.toString().trim() ?? '09:00';
		const deliveryMethod = formData.get('deliveryMethod')?.toString().trim() ?? 'email';

		if (!name) {
			return fail(400, { error: 'Display name is required.', section: 'profile' });
		}
		if (name.length > 100) {
			return fail(400, {
				error: 'Display name must be 100 characters or fewer.',
				section: 'profile'
			});
		}
		if (phone && !validatePhone(phone)) {
			return fail(400, {
				error: 'Enter a valid phone number (7\u201315 digits, e.g. +1 555 123 4567).',
				section: 'profile'
			});
		}

		try {
			const updatedUser = await prisma.user.update({
				where: { id: dbUser.id },
				data: {
					name: name || null,
					phone: phone ? normalizePhone(phone) : null,
					timezone: timezone || null,
					notificationTime,
					deliveryMethod
				}
			});

			if (updatedUser.clerkUserId && name) {
				try {
					await clerkClient.users.updateUser(updatedUser.clerkUserId, {
						firstName: name.split(' ')[0],
						lastName: name.split(' ').slice(1).join(' ') || undefined
					});
				} catch (error) {
					console.warn('Failed to sync name to Clerk', error);
				}
			}

			return { success: true, message: 'Profile updated.', section: 'profile' };
		} catch (error) {
			console.error('Failed to update profile', error);
			return fail(500, { error: 'Unable to save profile. Please try again.', section: 'profile' });
		}
	},

	toggleReveal: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');
		const formData = await event.request.formData();
		const revealScores = formData.get('revealScores') === 'true';
		const cycleId = formData.get('cycleId')?.toString();

		if (!cycleId) {
			return fail(400, { error: 'No active cycle found.', section: 'reveal' });
		}

		// Verify ownership
		const cycle = await prisma.cycle.findFirst({
			where: {
				id: cycleId,
				objective: { userId: dbUser.id }
			}
		});

		if (!cycle) {
			return fail(404, { error: 'Cycle not found.', section: 'reveal' });
		}

		await prisma.cycle.update({
			where: { id: cycleId },
			data: { revealScores }
		});

		return {
			success: true,
			message: revealScores
				? 'Reviewers can now see your self-scores.'
				: 'Your self-scores are now hidden from reviewers.',
			section: 'reveal'
		};
	}
};
