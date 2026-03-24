import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');

	const [individuals, coaches] = await Promise.all([
		prisma.user.findMany({
			where: { role: 'INDIVIDUAL' },
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				email: true,
				objectives: {
					where: { active: true },
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: {
						title: true,
						cycles: {
							orderBy: { startDate: 'desc' },
							take: 1,
							select: { status: true }
						}
					}
				}
			}
		}),
		prisma.user.findMany({
			where: { role: 'COACH' },
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				email: true,
				_count: { select: { coachClientsManaged: true } }
			}
		})
	]);

	// Pick best demo users (prefer seed data patterns)
	const bestIndividual =
		individuals.find((u) => u.email.includes('improving')) ??
		individuals.find((u) => u.objectives[0]?.cycles[0]?.status === 'ACTIVE') ??
		individuals[0];
	const bestCoach =
		coaches.sort((a, b) => b._count.coachClientsManaged - a._count.coachClientsManaged)[0] ??
		coaches[0];

	return {
		individuals: individuals.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			objectiveTitle: u.objectives[0]?.title ?? null,
			cycleStatus: u.objectives[0]?.cycles[0]?.status ?? null
		})),
		coaches: coaches.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			clientCount: u._count.coachClientsManaged
		})),
		defaults: {
			individualId: bestIndividual?.id ?? '',
			coachId: bestCoach?.id ?? ''
		}
	};
};
