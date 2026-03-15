import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import { computeWeekNumber } from '$lib/server/coachUtils';

// Track overdue reminders sent this week to avoid spamming
const overdueRemindersSent = new Map<string, number>();

function getWeekKey(): string {
	const now = new Date();
	const year = now.getFullYear();
	const startOfYear = new Date(year, 0, 1);
	const weekNum = Math.ceil(
		((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
	);
	return `${year}-W${weekNum}`;
}

export const remindOverduePrompts = async () => {
	const weekKey = getWeekKey();

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
			// Limit overdue reminders to max 2 per user per week
			const userWeekKey = `${objective.user.id}:${weekKey}`;
			const sentCount = overdueRemindersSent.get(userWeekKey) ?? 0;
			if (sentCount >= 2) {
				console.info(
					`[job:remind-overdue-prompts] Already sent ${sentCount} reminders to ${objective.user.email} this week, skipping`
				);
				continue;
			}
			overdueRemindersSent.set(userWeekKey, sentCount + 1);

			const delivery = objective.user.deliveryMethod ?? 'both';

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

			if (delivery !== 'sms') {
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
			}

			// Send SMS reminder
			if (delivery !== 'email') {
				await trySendSms(objective.user.phone, smsTemplates.reminderOverdue({ appUrl }));
			}
		}
	}
};
