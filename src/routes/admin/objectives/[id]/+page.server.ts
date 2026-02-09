import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireRole(event, 'ADMIN');
	const { id } = event.params;

	const objective = await prisma.objective.findUnique({
		where: { id },
		include: {
			user: { select: { id: true, name: true, email: true, role: true } },
			subgoals: { orderBy: { order: 'asc' } },
			cycles: {
				orderBy: { startDate: 'desc' },
				include: {
					_count: { select: { reflections: true, coachNotes: true } },
					reflections: {
						orderBy: [{ weekNumber: 'desc' }, { submittedAt: 'desc' }],
						take: 30,
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true,
							effortScore: true,
							performanceScore: true,
							submittedAt: true
						}
					}
				}
			},
			stakeholders: {
				include: {
					_count: { select: { feedbacks: true } },
					feedbacks: {
						orderBy: { submittedAt: 'desc' },
						take: 1,
						select: { submittedAt: true }
					}
				}
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/admin/objectives');
	}

	return { objective };
};
