import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';
import { clerkClient } from 'svelte-clerk/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireAuth(event);

	return {
		user: {
			name: dbUser.name ?? '',
			email: dbUser.email,
			phone: dbUser.phone ?? '',
			timezone: dbUser.timezone ?? '',
			reminderDays: dbUser.reminderDays ?? 'wednesday_friday'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireAuth(event);

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const phone = formData.get('phone')?.toString().trim() ?? '';
		const timezone = formData.get('timezone')?.toString().trim() ?? '';
		const reminderDays = formData.get('reminderDays')?.toString().trim() ?? 'wednesday_friday';

		if (!name) {
			return fail(400, { error: 'Display name is required.' });
		}

		if (name.length > 100) {
			return fail(400, { error: 'Display name must be 100 characters or fewer.' });
		}

		if (reminderDays !== 'wednesday_friday' && reminderDays !== 'tuesday_thursday') {
			return fail(400, { error: 'Invalid reminder schedule.' });
		}

		try {
			const updatedUser = await prisma.user.update({
				where: { id: dbUser.id },
				data: {
					name: name || null,
					phone: phone || null,
					timezone: timezone || null,
					reminderDays
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

			return { success: true, message: 'Settings saved.' };
		} catch (error) {
			console.error('Failed to update settings', error);
			return fail(500, { error: 'Unable to save settings. Please try again.' });
		}
	}
};
