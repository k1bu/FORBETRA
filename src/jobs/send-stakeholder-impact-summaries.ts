import prisma from '$lib/server/prisma';
import { sendEmail } from '$lib/notifications/email';
import { emailTemplates } from '$lib/notifications/emailTemplates';
import { trySendSms } from '$lib/notifications/sms';
import { smsTemplates } from '$lib/notifications/smsTemplates';

export const sendStakeholderImpactSummaries = async () => {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	// Find stakeholders who gave feedback in the last 30 days
	const recentFeedbacks = await prisma.feedback.findMany({
		where: {
			submittedAt: { gte: thirtyDaysAgo }
		},
		select: {
			stakeholderId: true,
			effortScore: true,
			performanceScore: true,
			submittedAt: true,
			reflection: {
				select: {
					weekNumber: true,
					user: {
						select: {
							name: true
						}
					}
				}
			},
			stakeholder: {
				select: {
					name: true,
					email: true,
					phone: true,
					individual: {
						select: {
							name: true
						}
					}
				}
			}
		}
	});

	if (recentFeedbacks.length === 0) {
		console.info('[job:stakeholder-impact] No recent feedbacks found, skipping');
		return;
	}

	// Group by stakeholder + individual pair
	const grouped = new Map<string, {
		stakeholderName: string;
		stakeholderEmail: string;
		stakeholderPhone: string | null;
		individualName: string;
		feedbacks: Array<{
			weekNumber: number;
			effortScore: number | null;
			performanceScore: number | null;
		}>;
	}>();

	for (const fb of recentFeedbacks) {
		if (!fb.stakeholder || !fb.reflection) continue;

		const key = fb.stakeholderId;
		if (!grouped.has(key)) {
			grouped.set(key, {
				stakeholderName: fb.stakeholder.name,
				stakeholderEmail: fb.stakeholder.email,
				stakeholderPhone: fb.stakeholder.phone,
				individualName: fb.stakeholder.individual?.name || 'your participant',
				feedbacks: []
			});
		}
		grouped.get(key)!.feedbacks.push({
			weekNumber: fb.reflection.weekNumber,
			effortScore: fb.effortScore,
			performanceScore: fb.performanceScore
		});
	}

	let sent = 0;
	for (const [, data] of grouped) {
		const { feedbacks, stakeholderName, stakeholderEmail, stakeholderPhone, individualName } = data;

		// Compute stats
		const uniqueWeeks = new Set(feedbacks.map((f) => f.weekNumber));
		const weeksContributed = uniqueWeeks.size;
		const totalFeedbacks = feedbacks.length;

		// Compute trend from sorted feedbacks
		const sorted = [...feedbacks].sort((a, b) => a.weekNumber - b.weekNumber);
		const effortScores = sorted.map((f) => f.effortScore).filter((s): s is number => s !== null);
		const performanceScores = sorted.map((f) => f.performanceScore).filter((s): s is number => s !== null);

		const computeTrend = (scores: number[]): 'up' | 'down' | 'stable' => {
			if (scores.length < 2) return 'stable';
			const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
			const secondHalf = scores.slice(Math.ceil(scores.length / 2));
			const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
			const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
			const diff = avgSecond - avgFirst;
			if (diff > 0.5) return 'up';
			if (diff < -0.5) return 'down';
			return 'stable';
		};

		const effortTrend = computeTrend(effortScores);
		const performanceTrend = computeTrend(performanceScores);

		try {
			const template = emailTemplates.stakeholderImpactSummary({
				stakeholderName: stakeholderName || undefined,
				individualName,
				weeksContributed,
				totalFeedbacks,
				effortTrend,
				performanceTrend
			});
			await sendEmail({
				to: stakeholderEmail,
				...template
			});
			sent++;
		} catch (error) {
			console.error(
				`[job:stakeholder-impact] Failed to send impact summary to ${stakeholderEmail}`,
				error
			);
		}

		// Send SMS impact summary
		await trySendSms(
			stakeholderPhone,
			smsTemplates.stakeholderImpactSummary({
				individualName,
				weeksContributed,
				totalFeedbacks
			})
		);
	}

	console.info(`[job:stakeholder-impact] Sent ${sent} impact summaries`);
};
