import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { clerkClient } from 'svelte-clerk/server';
import type { Actions, PageServerLoad } from './$types';
import type { UserRole } from '@prisma/client';

const ALLOWED_ROLES: UserRole[] = ['INDIVIDUAL', 'COACH', 'STAKEHOLDER', 'ADMIN', 'ORG_ADMIN'];

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');

	const { id } = event.params;

	const user = await prisma.user.findUnique({
		where: { id },
		include: {
			objectives: {
				include: {
					subgoals: { orderBy: { order: 'asc' } },
					cycles: {
						orderBy: { startDate: 'desc' },
						include: {
							reflections: {
								orderBy: { submittedAt: 'desc' },
								take: 20,
								select: {
									id: true,
									reflectionType: true,
									weekNumber: true,
									effortScore: true,
									performanceScore: true,
									submittedAt: true
								}
							},
							coachNotes: {
								orderBy: { createdAt: 'desc' },
								take: 10,
								select: {
									id: true,
									content: true,
									weekNumber: true,
									createdAt: true,
									coach: { select: { name: true } }
								}
							},
							_count: { select: { reflections: true } }
						}
					},
					stakeholders: {
						include: {
							_count: { select: { feedbacks: true } }
						}
					}
				}
			},
			coachClientsManaged: {
				include: { individual: { select: { id: true, name: true, email: true } } }
			},
			coachClientsOwned: {
				include: { coach: { select: { name: true, email: true } } }
			}
		}
	});

	if (!user) {
		throw redirect(303, '/admin/users');
	}

	return { user, roles: ALLOWED_ROLES };
};

export const actions: Actions = {
	updateUser: async (event) => {
		requireRole(event, 'ADMIN');
		const { id } = event.params;
		const formData = await event.request.formData();

		const name = (formData.get('name') as string)?.trim() || null;
		const email = (formData.get('email') as string)?.trim();
		const roleRaw = formData.get('role');

		if (!email) {
			return fail(400, { error: 'Email is required.' });
		}

		if (!roleRaw || typeof roleRaw !== 'string') {
			return fail(400, { error: 'Role is required.' });
		}

		const role = roleRaw.toUpperCase() as UserRole;
		if (!ALLOWED_ROLES.includes(role)) {
			return fail(400, { error: 'Invalid role.' });
		}

		try {
			const updated = await prisma.user.update({
				where: { id },
				data: { name, email, role }
			});

			if (updated.clerkUserId) {
				try {
					await clerkClient.users.updateUser(updated.clerkUserId, {
						publicMetadata: { role }
					});
				} catch {
					// Clerk sync failure is non-fatal
				}
			}

			return { success: true, message: 'User updated.' };
		} catch (error: any) {
			if (error.code === 'P2002') {
				return fail(400, { error: 'A user with this email already exists.' });
			}
			return fail(500, { error: 'Failed to update user.' });
		}
	}
};
