import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { computeWeekNumber } from '$lib/server/coachUtils';

export const remindStakeholderFeedback = async () => {
	const stakeholders = await prisma.stakeholder.findMany({
		include: {
			individual: {
				select: {
					id: true,
					email: true,
					name: true
				}
			},
			tokens: {
				where: { type: 'FEEDBACK_INVITE', usedAt: null },
				orderBy: { expiresAt: 'asc' }
			}
		}
	});

	// Build a map of individual's active cycle cadence for biweekly check
	const individualCycles = new Map<string, { stakeholderCadence: string; startDate: Date }>();
	for (const stakeholder of stakeholders) {
		const individualId = stakeholder.individual.id;
		if (!individualCycles.has(individualId)) {
			const cycle = await prisma.cycle.findFirst({
				where: { userId: individualId, status: 'ACTIVE' },
				orderBy: { startDate: 'desc' },
				select: { stakeholderCadence: true, startDate: true }
			});
			if (cycle) {
				individualCycles.set(individualId, {
					stakeholderCadence: cycle.stakeholderCadence,
					startDate: cycle.startDate
				});
			}
		}
	}

	const baseUrl =
		process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
			? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
			: 'https://app.forbetra.com';

	for (const stakeholder of stakeholders) {
		const pending = stakeholder.tokens.filter((token) => token.expiresAt > new Date());
		if (pending.length === 0) continue;

		// Check biweekly cadence — skip on even weeks
		const cycleInfo = individualCycles.get(stakeholder.individual.id);
		if (cycleInfo && cycleInfo.stakeholderCadence === 'biweekly') {
			const currentWeek = computeWeekNumber(cycleInfo.startDate);
			if (currentWeek % 2 === 0) {
				continue; // Only send on odd-numbered weeks
			}
		}

		// Get the most recent pending token
		const latestToken = pending[0];
		const feedbackLink = `${baseUrl}/stakeholder/feedback/${latestToken.tokenHash}`;

		try {
			const template = emailTemplates.reminderStakeholderFeedback({
				individualName: stakeholder.individual.name || undefined,
				stakeholderName: stakeholder.name || undefined,
				feedbackLink
			});
			await sendEmail({
				to: stakeholder.email,
				...template
			});
			console.info('[job:remind-stakeholder-feedback] Sent reminder to', stakeholder.email);
		} catch (error) {
			console.error(
				'[job:remind-stakeholder-feedback] Failed to send reminder to',
				stakeholder.email,
				error
			);
		}
	}
};
