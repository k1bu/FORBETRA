import { redirect } from '@sveltejs/kit';
import { getOptionalAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { session, dbUser } = getOptionalAuth(event);

	// Redirect individuals to their hub
	if (dbUser?.role === 'INDIVIDUAL') {
		throw redirect(303, '/individual');
	}

	// Redirect coaches to their hub
	if (dbUser?.role === 'COACH') {
		throw redirect(303, '/coach');
	}

	return {
		userId: session.userId,
		dbUser
	};
};
