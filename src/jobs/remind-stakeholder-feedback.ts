import prisma from '$lib/server/prisma';

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

	const reminders: Array<{
		stakeholderEmail: string;
		stakeholderName: string;
		individualEmail: string;
		link: string;
		expiresAt: string;
	}> = [];

	for (const stakeholder of stakeholders) {
		const pending = stakeholder.tokens.filter((token) => token.expiresAt > new Date());
		if (pending.length === 0) continue;

		pending.forEach((token) => {
			reminders.push({
				stakeholderEmail: stakeholder.email,
				stakeholderName: stakeholder.name,
				individualEmail: stakeholder.individual.email,
				link: `/stakeholder/feedback/${token.tokenHash}`,
				expiresAt: token.expiresAt.toISOString()
			});
		});
	}

	console.info('[job:remind-stakeholder-feedback]', reminders);
};
