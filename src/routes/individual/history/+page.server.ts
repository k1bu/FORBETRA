import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				select: {
					id: true,
					label: true,
					startDate: true,
					reflections: {
						where: { userId: dbUser.id },
						orderBy: [{ weekNumber: 'desc' }, { checkInDate: 'desc' }],
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true,
							effortScore: true,
							performanceScore: true,
							notes: true,
							checkInDate: true,
							feedbacks: {
								select: {
									id: true,
									effortScore: true,
									performanceScore: true,
									comment: true,
									submittedAt: true,
									stakeholder: {
										select: {
											name: true
										}
									}
								}
							}
						}
					}
				}
			}
		}
	});

	if (!objective || objective.cycles.length === 0) {
		throw redirect(302, '/individual');
	}

	const cycle = objective.cycles[0];

	// Group reflections by week number
	const weekMap = new Map<number, {
		reflections: Array<{
			id: string;
			type: string;
			effortScore: number | null;
			performanceScore: number | null;
			notes: string | null;
			checkInDate: string;
			feedbacks: Array<{
				stakeholderName: string;
				effortScore: number | null;
				performanceScore: number | null;
				comment: string | null;
			}>;
		}>;
	}>();

	for (const r of cycle.reflections) {
		if (!weekMap.has(r.weekNumber)) {
			weekMap.set(r.weekNumber, { reflections: [] });
		}
		weekMap.get(r.weekNumber)!.reflections.push({
			id: r.id,
			type: r.reflectionType,
			effortScore: r.effortScore,
			performanceScore: r.performanceScore,
			notes: r.notes,
			checkInDate: r.checkInDate.toISOString(),
			feedbacks: r.feedbacks.map((f) => ({
				stakeholderName: f.stakeholder.name,
				effortScore: f.effortScore,
				performanceScore: f.performanceScore,
				comment: f.comment
			}))
		});
	}

	// Convert to sorted array (newest first)
	const weeks = Array.from(weekMap.entries())
		.map(([weekNumber, data]) => ({
			weekNumber,
			reflections: data.reflections
		}))
		.sort((a, b) => b.weekNumber - a.weekNumber);

	return {
		objectiveTitle: objective.title,
		cycleLabel: cycle.label ?? 'Current Cycle',
		weeks
	};
};
