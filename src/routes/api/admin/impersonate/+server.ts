import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

const IMPERSONATE_COOKIE = 'forbetra_impersonate';
const MAX_AGE = 4 * 60 * 60; // 4 hours

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const admin = locals.realUser ?? locals.dbUser;
	if (!admin || admin.role !== 'ADMIN') {
		throw error(403, 'Admin access required');
	}

	const { userId } = await request.json();
	if (!userId || typeof userId !== 'string') {
		throw error(400, 'userId is required');
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw error(404, 'User not found');
	}

	cookies.set(IMPERSONATE_COOKIE, userId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: MAX_AGE
	});

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, cookies }) => {
	const admin = locals.realUser ?? locals.dbUser;
	if (!admin || admin.role !== 'ADMIN') {
		throw error(403, 'Admin access required');
	}

	cookies.delete(IMPERSONATE_COOKIE, { path: '/' });

	return json({ success: true });
};
