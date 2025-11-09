import { getOptionalAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const { session, dbUser } = getOptionalAuth(event);

	return {
		userId: session.userId,
		dbUser
	};
};
