import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { objective, cycle } = await parent();

	if (!cycle) {
		throw redirect(302, '/individual');
	}

	// History needs feedbacks per reflection — fetch separately
	const reflections = await prisma.reflection.findMany({
		where: { cycleId: cycle.id, userId: objective.userId },
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
					behavioralObservation: true,
					suggestion: true,
					submittedAt: true,
					stakeholder: {
						select: { name: true }
					}
				}
			}
		}
	});

	// Group reflections by week number
	const weekMap = new Map<
		number,
		{
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
					behavioralObservation: string | null;
					suggestion: string | null;
				}>;
			}>;
		}
	>();

	for (const r of reflections) {
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
				comment: f.comment,
				behavioralObservation: f.behavioralObservation,
				suggestion: f.suggestion
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
