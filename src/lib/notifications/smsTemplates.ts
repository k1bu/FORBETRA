const baseUrl =
	process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
		? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
		: 'https://app.forbetra.com';

export const smsTemplates = {
	welcomeIndividual: (data: { individualName?: string; appUrl?: string }) => {
		const name = data.individualName || 'there';
		return `Welcome to Forbetra, ${name}! Your development journey starts now. Get started: ${data.appUrl || baseUrl}\n\nReply STOP to opt out`;
	},

	reminderBase: (data: {
		reflectionType: string;
		weekNumber: number;
		appUrl?: string;
	}) => {
		const dayLabel =
			data.reflectionType === 'intention'
				? 'Monday'
				: data.reflectionType === 'rating_a'
					? 'Wednesday'
					: 'Friday';
		const url =
			data.reflectionType === 'intention'
				? `${data.appUrl || baseUrl}/prompts/monday`
				: `${data.appUrl || baseUrl}/reflections/checkin?type=${data.reflectionType.toUpperCase()}`;
		return `Forbetra: Time for your ${dayLabel} check-in (Week ${data.weekNumber}). ${url}`;
	},

	reminderOverdue: (data: { appUrl?: string }) => {
		return `Forbetra: You have overdue reflections. Catch up now: ${data.appUrl || baseUrl}/individual`;
	},

	welcomeStakeholder: (data: {
		stakeholderName?: string;
		individualName?: string;
		appUrl?: string;
	}) => {
		const name = data.individualName || 'someone';
		return `Forbetra: ${name} added you as a stakeholder. You'll occasionally be asked to rate their progress — takes <60 seconds.\n\nReply STOP to opt out`;
	},

	feedbackInvite: (data: {
		individualName?: string;
		feedbackLink: string;
	}) => {
		const name = data.individualName || 'your participant';
		return `Forbetra: ${name} needs your feedback. Takes <60 seconds: ${data.feedbackLink}\n\nReply STOP to opt out`;
	},

	stakeholderFeedbackReceived: (data: {
		stakeholderName?: string;
		appUrl?: string;
	}) => {
		const name = data.stakeholderName || 'A stakeholder';
		return `Forbetra: ${name} just shared feedback on your progress. View insights: ${data.appUrl || baseUrl}/individual/insights`;
	},

	stakeholderThankYou: (data: {
		individualName?: string;
		weekNumber: number;
	}) => {
		const name = data.individualName || 'your participant';
		return `Forbetra: Thanks for your Week ${data.weekNumber} feedback on ${name}. Your perspective helps them grow.`;
	},

	reminderStakeholderFeedback: (data: {
		individualName?: string;
		feedbackLink: string;
	}) => {
		const name = data.individualName || 'your participant';
		return `Forbetra reminder: ${name} is waiting for your feedback. Takes <60 sec: ${data.feedbackLink}\n\nReply STOP to opt out`;
	},

	stakeholderImpactSummary: (data: {
		individualName?: string;
		weeksContributed: number;
		totalFeedbacks: number;
	}) => {
		const name = data.individualName || 'your participant';
		return `Forbetra: Your monthly impact on ${name} — ${data.weeksContributed} weeks, ${data.totalFeedbacks} feedbacks. Thank you!`;
	},

	cycleCompleted: (data: {
		objectiveTitle?: string;
		appUrl?: string;
	}) => {
		const obj = data.objectiveTitle ? ` for "${data.objectiveTitle}"` : '';
		return `Forbetra: Your cycle${obj} is complete! View your growth report: ${data.appUrl || baseUrl}/individual/insights`;
	},

	coachInvitation: (data: {
		coachName?: string;
		inviteUrl: string;
	}) => {
		const coach = data.coachName || 'Your coach';
		return `Forbetra: ${coach} invited you to join their development program. Get started: ${data.inviteUrl}`;
	},

	coachClientAccepted: (data: {
		clientName: string;
		appUrl?: string;
	}) => {
		return `Forbetra: ${data.clientName} accepted your invitation and joined your roster. ${data.appUrl || baseUrl}/coach/roster`;
	}
};
