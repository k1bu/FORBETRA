import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import { computeWeekNumber } from '$lib/server/coachUtils';

export const remindOverduePrompts = async () => {
	const objectives = await prisma.objective.findMany({
		where: { active: true },
		include: {
			user: true,
			cycles: {
				where: { status: 'ACTIVE' },
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

		// Determine expected reflection types based on check-in frequency
		const freq = cycle.checkInFrequency ?? '3x';
		let expectedTypes: readonly ('RATING_A' | 'RATING_B')[];
		if (freq === '1x') {
			expectedTypes = ['RATING_A'] as const;
		} else {
			expectedTypes = ['RATING_A', 'RATING_B'] as const;
		}

		const overdue: string[] = [];
		expectedTypes.forEach((type) => {
			if (!submittedTypes.has(type)) {
				overdue.push(type.toLowerCase());
			}
		});

		if (overdue.length > 0) {
			// Compute current streak for motivational messaging
			let currentStreak = 0;
			try {
				const completedSet = new Set(
					cycle.reflections.map((r) => `${r.weekNumber}-${r.reflectionType}`)
				);
				const streakExpected: Array<{ week: number; type: string }> = [];
				for (let w = 1; w <= currentWeek; w++) {
					if (freq === '1x') {
						streakExpected.push({ week: w, type: 'RATING_A' });
					} else {
						streakExpected.push({ week: w, type: 'RATING_A' });
						streakExpected.push({ week: w, type: 'RATING_B' });
					}
				}
				for (let i = streakExpected.length - 1; i >= 0; i--) {
					const expected = streakExpected[i];
					if (completedSet.has(`${expected.week}-${expected.type}`)) {
						currentStreak++;
					} else {
						break;
					}
				}
			} catch {
				// Streak computation is non-critical
			}

			const appUrl =
				process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
					? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
					: 'https://app.forbetra.com';

			try {
				const template = emailTemplates.reminderOverdue({
					individualName: objective.user.name || undefined,
					objectiveTitle: objective.title,
					currentStreak,
					appUrl
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

			// Send SMS reminder
			await trySendSms(
				objective.user.phone,
				smsTemplates.reminderOverdue({ appUrl })
			);
		}
	}
};
