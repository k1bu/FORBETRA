import type { RequestEvent } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import type { SessionAuthObject } from '@clerk/backend';
import type { User, UserRole } from '@prisma/client';

export type AuthContext = {
	session: SessionAuthObject;
	dbUser: User;
};

const signInRedirect = '/sign-in';

const normalizeRoles = (roles: UserRole | UserRole[]): Set<UserRole> =>
	new Set(Array.isArray(roles) ? roles : [roles]);

const isApiRoute = (event: RequestEvent): boolean => event.url.pathname.startsWith('/api/');

export const getOptionalAuth = (
	event: RequestEvent
): { session: SessionAuthObject; dbUser: User | null } => {
	return {
		session: event.locals.auth(),
		dbUser: event.locals.dbUser ?? null
	};
};

export const requireAuth = (event: RequestEvent): AuthContext => {
	const session = event.locals.auth();

	if (!session.userId) {
		if (isApiRoute(event)) throw error(401, 'Authentication required');
		throw redirect(307, signInRedirect);
	}

	const dbUser = event.locals.dbUser;

	if (!dbUser) {
		if (isApiRoute(event)) throw error(401, 'User not found');
		throw redirect(307, '/onboarding');
	}

	return { session, dbUser };
};

export const requireRole = (
	event: RequestEvent,
	allowedRoles: UserRole | UserRole[]
): AuthContext => {
	const context = requireAuth(event);
	const roles = normalizeRoles(allowedRoles);

	if (!roles.has(context.dbUser.role)) {
		if (isApiRoute(event)) throw error(403, 'Insufficient permissions');
		throw redirect(303, '/');
	}

	return context;
};
