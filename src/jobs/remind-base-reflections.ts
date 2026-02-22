import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';
import { computeWeekNumber } from '$lib/server/coachUtils';

export const remindBaseReflections = async () => {
	const now = new Date();
	const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const hour = now.getHours();

	// Only run at 9am (adjust for timezone if needed)
	if (hour !== 9) {
		console.info('[job:remind-base-reflections] Not 9am, skipping');
		return;
	}

	// Determine which reflection type to remind for based on day
	// Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5
	let reflectionType: 'INTENTION' | 'RATING_A' | 'RATING_B' | null = null;
	let reminderDays: 'wednesday_friday' | 'tuesday_thursday' | null = null;

	if (dayOfWeek === 1) {
		// Monday - always INTENTION
		reflectionType = 'INTENTION';
	} else if (dayOfWeek === 3) {
		// Wednesday - RATING_A for wednesday_friday users
		reflectionType = 'RATING_A';
		reminderDays = 'wednesday_friday';
	} else if (dayOfWeek === 5) {
		// Friday - RATING_B for wednesday_friday users
		reflectionType = 'RATING_B';
		reminderDays = 'wednesday_friday';
	} else if (dayOfWeek === 2) {
		// Tuesday - RATING_A for tuesday_thursday users
		reflectionType = 'RATING_A';
		reminderDays = 'tuesday_thursday';
	} else if (dayOfWeek === 4) {
		// Thursday - RATING_B for tuesday_thursday users
		reflectionType = 'RATING_B';
		reminderDays = 'tuesday_thursday';
	}

	if (!reflectionType) {
		console.info('[job:remind-base-reflections] Not a reminder day, skipping');
		return;
	}

	const baseUrl =
		process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
			? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
			: 'https://app.forbetra.com';

	// Find all active objectives with users who need reminders
	const objectives = await prisma.objective.findMany({
		where: {
			active: true,
			user: {
				reminderDays: reminderDays || undefined
			}
		},
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

		// Skip reminders based on check-in frequency
		const freq = cycle.checkInFrequency ?? '3x';
		if (freq === '1x' && reflectionType !== 'RATING_A') {
			// 1x frequency: only send for RATING_A (single combined check-in)
			continue;
		}
		if (freq === '2x' && reflectionType === 'RATING_B') {
			// 2x frequency: skip RATING_B (combine effort+performance into RATING_A)
			continue;
		}

		const currentWeek = computeWeekNumber(cycle.startDate);

		// Check if reflection already submitted for this week
		const existingReflection = cycle.reflections.find(
			(r) => r.weekNumber === currentWeek && r.reflectionType === reflectionType
		);

		if (existingReflection) {
			console.info(
				`[job:remind-base-reflections] Reflection already submitted for user ${objective.user.email}, week ${currentWeek}, type ${reflectionType}`
			);
			continue;
		}

		// Compute current streak for motivational messaging
		let currentStreak = 0;
		try {
			const completedSet = new Set(
				cycle.reflections.map((r) => `${r.weekNumber}-${r.reflectionType}`)
			);
			const freq = cycle.checkInFrequency ?? '3x';
			const expectedSequence: Array<{ week: number; type: string }> = [];
			for (let w = 1; w <= currentWeek; w++) {
				if (freq === '1x') {
					expectedSequence.push({ week: w, type: 'RATING_A' });
				} else if (freq === '2x') {
					expectedSequence.push({ week: w, type: 'INTENTION' });
					expectedSequence.push({ week: w, type: 'RATING_A' });
				} else {
					expectedSequence.push({ week: w, type: 'INTENTION' });
					expectedSequence.push({ week: w, type: 'RATING_A' });
					expectedSequence.push({ week: w, type: 'RATING_B' });
				}
			}
			for (let i = expectedSequence.length - 1; i >= 0; i--) {
				const expected = expectedSequence[i];
				if (completedSet.has(`${expected.week}-${expected.type}`)) {
					currentStreak++;
				} else {
					break;
				}
			}
		} catch {
			// Streak computation is non-critical
		}

		// Send reminder email
		try {
			const template = emailTemplates.reminderBase({
				individualName: objective.user.name || undefined,
				objectiveTitle: objective.title,
				reflectionType: reflectionType.toLowerCase(),
				weekNumber: currentWeek,
				appUrl: baseUrl,
				currentStreak
			});
			await sendEmail({
				to: objective.user.email,
				...template
			});
			console.info(
				`[job:remind-base-reflections] Sent ${reflectionType} reminder to ${objective.user.email} for week ${currentWeek}`
			);
		} catch (error) {
			console.error(
				`[job:remind-base-reflections] Failed to send reminder to ${objective.user.email}`,
				error
			);
		}

		// Send SMS reminder if user has a phone number
		await trySendSms(
			objective.user.phone,
			smsTemplates.reminderBase({
				reflectionType: reflectionType.toLowerCase(),
				weekNumber: currentWeek,
				appUrl: baseUrl
			})
		);
	}
};
