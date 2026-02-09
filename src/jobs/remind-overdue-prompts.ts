import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';

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
		(['INTENTION', 'RATING_A', 'RATING_B'] as const).forEach((type) => {
			if (!submittedTypes.has(type)) {
				overdue.push(type.toLowerCase());
			}
		});

		if (overdue.length > 0) {
			try {
				const template = emailTemplates.reminderOverdue({
					individualName: objective.user.name || undefined,
					objectiveTitle: objective.title,
					appUrl:
						process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
							? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
							: 'https://app.forbetra.com'
				});
				await sendEmail({
					to: objective.user.email,
					...template
				});
				console.info('[job:remind-overdue-prompts] Sent reminder to', objective.user.email);
			} catch (error) {
				console.error(
					'[job:remind-overdue-prompts] Failed to send reminder to',
					objective.user.email,
					error
				);
			}
		}
	}

	// Also send stakeholder feedback reminders in the same job
	await remindStakeholderFeedback();
};

async function remindStakeholderFeedback() {
	// TODO: implement stakeholder feedback reminders
}
