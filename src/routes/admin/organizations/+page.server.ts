import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireRole(event, ['ADMIN', 'ORG_ADMIN']);

	const organizations = await prisma.organization.findMany({
		orderBy: { createdAt: 'desc' },
		include: {
			members: {
				orderBy: { createdAt: 'asc' },
				include: {
					user: {
						select: {
							id: true,
							email: true,
							name: true,
							role: true
						}
					}
				}
			}
		}
	});

	return { organizations };
};

export const actions: Actions = {
	createOrg: async (event) => {
		requireRole(event, ['ADMIN', 'ORG_ADMIN']);

		const formData = await event.request.formData();
		const name = (formData.get('name') ?? '').toString().trim();
		const domain = (formData.get('domain') ?? '').toString().trim().toLowerCase() || null;

		if (!name) {
			return fail(400, { error: 'Organization name is required.' });
		}

		if (domain) {
			const existing = await prisma.organization.findUnique({ where: { domain } });
			if (existing) {
				return fail(400, { error: `Domain "${domain}" is already claimed by "${existing.name}".` });
			}
		}

		await prisma.organization.create({
			data: { name, domain }
		});

		return { success: true, message: `Organization "${name}" created.` };
	},

	addMember: async (event) => {
		requireRole(event, ['ADMIN', 'ORG_ADMIN']);

		const formData = await event.request.formData();
		const orgId = (formData.get('orgId') ?? '').toString().trim();
		const email = (formData.get('email') ?? '').toString().trim().toLowerCase();
		const role = (formData.get('role') ?? 'MEMBER').toString().toUpperCase();

		if (!orgId || !email) {
			return fail(400, { error: 'Organization and email are required.' });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return fail(400, { error: `No user found with email "${email}".` });
		}

		const validRoles = ['MEMBER', 'ORG_ADMIN'];
		const memberRole = validRoles.includes(role) ? role : 'MEMBER';

		try {
			await prisma.organizationMember.upsert({
				where: {
					organizationId_userId: {
						organizationId: orgId,
						userId: user.id
					}
				},
				update: { role: memberRole as 'MEMBER' | 'ORG_ADMIN' },
				create: {
					organizationId: orgId,
					userId: user.id,
					role: memberRole as 'MEMBER' | 'ORG_ADMIN'
				}
			});

			return { success: true, message: `${user.name || user.email} added as ${memberRole}.` };
		} catch (error) {
			console.error('[org:error] Failed to add member', error);
			return fail(500, { error: 'Failed to add member.' });
		}
	},

	removeMember: async (event) => {
		requireRole(event, ['ADMIN', 'ORG_ADMIN']);

		const formData = await event.request.formData();
		const memberId = (formData.get('memberId') ?? '').toString().trim();

		if (!memberId) {
			return fail(400, { error: 'Member ID is required.' });
		}

		try {
			await prisma.organizationMember.delete({ where: { id: memberId } });
			return { success: true, message: 'Member removed.' };
		} catch (error) {
			console.error('[org:error] Failed to remove member', error);
			return fail(500, { error: 'Failed to remove member.' });
		}
	}
};
