/**
 * Coach Prep Generation Job
 *
 * For each coach, generates COACH_PREP insights for each active client.
 * Runs Monday morning before coaching sessions.
 */

import prisma from '$lib/server/prisma';
import { generateCoachPrep } from '$lib/server/ai/generateInsight';

export async function generateCoachPrepInsights(): Promise<{
	generated: number;
	skipped: number;
	failed: number;
}> {
	console.log('[insights:coach-prep] Starting coach prep generation...');

	const coachClients = await prisma.coachClient.findMany({
		where: { archivedAt: null },
		include: {
			individual: {
				select: {
					id: true,
					objectives: {
						where: { active: true },
						take: 1,
						include: {
							cycles: {
								where: { status: 'ACTIVE' },
								take: 1,
								select: { id: true }
							}
						}
					}
				}
			}
		}
	});

	let generated = 0;
	let skipped = 0;
	let failed = 0;

	for (const rel of coachClients) {
		const cycle = rel.individual.objectives[0]?.cycles[0];
		if (!cycle) {
			skipped++;
			continue;
		}

		// Check if COACH_PREP already exists for this week (within last 7 days)
		const recentPrep = await prisma.insight.findFirst({
			where: {
				userId: rel.individualId,
				cycleId: cycle.id,
				type: 'COACH_PREP',
				createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
			}
		});

		if (recentPrep) {
			skipped++;
			continue;
		}

		try {
			const insightId = await generateCoachPrep(rel.coachId, rel.individualId, cycle.id);
			if (insightId) {
				generated++;
			} else {
				failed++;
			}
		} catch (error) {
			console.error(
				`[insights:coach-prep] Failed for coach ${rel.coachId} -> individual ${rel.individualId}`,
				error
			);
			failed++;
		}
	}

	console.log(
		`[insights:coach-prep] Done. Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`
	);
	return { generated, skipped, failed };
}
