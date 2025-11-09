import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { SessionAuthObject } from '@clerk/backend';
import type { User, UserRole } from '@prisma/client';

export type AuthContext = {
	session: SessionAuthObject;
	dbUser: User;
};

const signInRedirect = '/sign-in';

const normalizeRoles = (roles: UserRole | UserRole[]): Set<UserRole> =>
	new Set(Array.isArray(roles) ? roles : [roles]);

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
		throw redirect(307, signInRedirect);
	}

	const dbUser = event.locals.dbUser;

	if (!dbUser) {
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
		throw redirect(303, '/');
	}

	return context;
};
