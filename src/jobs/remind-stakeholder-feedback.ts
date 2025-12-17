import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';

export const remindStakeholderFeedback = async () => {
	const stakeholders = await prisma.stakeholder.findMany({
		include: {
			individual: {
				select: {
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

	const baseUrl =
		process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
			? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
			: 'https://app.forbetra.com';

	for (const stakeholder of stakeholders) {
		const pending = stakeholder.tokens.filter((token) => token.expiresAt > new Date());
		if (pending.length === 0) continue;

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
