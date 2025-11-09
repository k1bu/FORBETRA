import { requireAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { session, dbUser } = requireAuth(event);

	return {
		userId: session.userId,
		role: dbUser.role
	};
};
