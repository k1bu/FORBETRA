/**
 * Weekly Insight Generation Job
 *
 * Finds all active cycles and generates WEEKLY_SYNTHESIS insights
 * for the current week. Runs Sunday evening.
 */

import prisma from '$lib/server/prisma';
import { generateWeeklySynthesis } from '$lib/server/ai/generateInsight';
import { computeWeekNumber } from '$lib/server/coachUtils';

export async function generateWeeklyInsights(): Promise<{
	generated: number;
	skipped: number;
	failed: number;
}> {
	console.log('[insights:weekly] Starting weekly insight generation...');

	const activeCycles = await prisma.cycle.findMany({
		where: { status: 'ACTIVE' },
		select: {
			id: true,
			userId: true,
			startDate: true
		}
	});

	let generated = 0;
	let skipped = 0;
	let failed = 0;

	for (const cycle of activeCycles) {
		const weekNumber = computeWeekNumber(cycle.startDate);

		// Check if a WEEKLY_SYNTHESIS already exists for this week
		const existing = await prisma.insight.findFirst({
			where: {
				userId: cycle.userId,
				cycleId: cycle.id,
				weekNumber,
				type: 'WEEKLY_SYNTHESIS'
			}
		});

		if (existing) {
			skipped++;
			continue;
		}

		try {
			const insightId = await generateWeeklySynthesis(cycle.userId, cycle.id, weekNumber);
			if (insightId) {
				generated++;
			} else {
				failed++;
			}
		} catch (error) {
			console.error(`[insights:weekly] Failed for cycle ${cycle.id}`, error);
			failed++;
		}
	}

	console.log(
		`[insights:weekly] Done. Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`
	);
	return { generated, skipped, failed };
}
