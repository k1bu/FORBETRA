import prisma from '$lib/server/prisma';

const computeWeekNumber = (startDate: Date) => {
	const diff = Date.now() - startDate.getTime();
	const weekMs = 7 * 24 * 60 * 60 * 1000;
	return Math.max(1, Math.floor(diff / weekMs) + 1);
};

export const remindOverduePrompts = async () => {
	const objectives = await prisma.objective.findMany({
		where: { active: true },
		include: {
			user: true,
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: true
				}
			}
		}
	});

	const messages: Array<{ email: string; objective: string; overdue: string[] }> = [];

	for (const objective of objectives) {
		const cycle = objective.cycles[0];
		if (!cycle) continue;

		const currentWeek = computeWeekNumber(cycle.startDate);
		const submittedTypes = new Set(
			cycle.reflections
				.filter((reflection) => reflection.weekNumber === currentWeek)
				.map((reflection) => reflection.reflectionType)
		);

		const overdue: string[] = [];
		(['INTENTION', 'EFFORT', 'PROGRESS'] as const).forEach((type) => {
			if (!submittedTypes.has(type)) {
				overdue.push(type.toLowerCase());
			}
		});

		if (overdue.length > 0) {
			messages.push({
				email: objective.user.email,
				objective: objective.title,
				overdue
			});
		}
	}

	console.info('[job:remind-overdue-prompts]', messages);
};
