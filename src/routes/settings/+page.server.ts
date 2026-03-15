import { redirect } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireAuth(event);

	if (dbUser.role === 'ADMIN' || dbUser.role === 'ORG_ADMIN') {
		throw redirect(303, '/admin/settings');
	}
	if (dbUser.role === 'COACH') {
		throw redirect(303, '/coach/settings');
	}
	if (dbUser.role === 'STAKEHOLDER') {
		// Stakeholders don't have a settings page — redirect to home
		throw redirect(303, '/');
	}
	throw redirect(303, '/individual/settings');
};
