import { redirect } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { dbUser } = requireRole(event, ['ADMIN', 'ORG_ADMIN']);

	// ORG_ADMIN users can only access the organizations page
	if (dbUser.role === 'ORG_ADMIN' && !event.url.pathname.startsWith('/admin/organizations')) {
		throw redirect(303, '/admin/organizations');
	}
};
