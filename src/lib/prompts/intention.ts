export type IntentionPrompt = {
	week: number;
	heading: string;
	question: string;
};

export const MONDAY_PROMPTS: IntentionPrompt[] = [
	{
		week: 1,
		heading: 'Identity anchor',
		question:
			"Completing this identity anchor is one of the most important steps for your entire improvement cycle. Research shows that connecting your objective to your identity—who you're becoming, not just what you're doing—significantly increases success rates. Take time to reflect deeply on how achieving your objective will transform how you show up and perform."
	},
	{
		week: 2,
		heading: 'Momentum check',
		question:
			'What is the single action you can take this week that will create disproportionate progress toward your objective?'
	},
	{
		week: 3,
		heading: 'Stakeholder alignment',
		question:
			'How will you bring your stakeholder into your plan this week so they can support or unblock you?'
	},
	{
		week: 4,
		heading: 'Energy audit',
		question:
			'Where will you invest your best energy this week—and what will you deprioritize to protect it?'
	},
	{
		week: 5,
		heading: 'Skill rep',
		question:
			'Which skill or behavior are you deliberately practicing this week, and how will you measure that practice?'
	},
	{
		week: 6,
		heading: 'Obstacle planning',
		question: 'Identify the most likely obstacle this week. How will you respond when it shows up?'
	},
	{
		week: 7,
		heading: 'Feedback loop',
		question:
			'Who will you ask for feedback this week, and what question will you use to keep it actionable?'
	},
	{
		week: 8,
		heading: 'Well-being reset',
		question:
			'What commitment will you make to recharge yourself so you can sustain performance this week?'
	},
	{
		week: 9,
		heading: 'Stretch moment',
		question:
			'Where will you intentionally push the edge of your comfort zone this week, and why does it matter?'
	},
	{
		week: 10,
		heading: 'Systems tune-up',
		question:
			'What existing routine or system needs a tweak this week to keep progress compounding?'
	},
	{
		week: 11,
		heading: 'Storytelling',
		question:
			'How will you communicate your progress to your team or stakeholders this week in a way that builds alignment?'
	},
	{
		week: 12,
		heading: 'Integration',
		question:
			'What lesson from this cycle are you intentionally practicing this week so it becomes part of how you operate?'
	}
];

export const getIntentionPromptForWeek = (week: number): IntentionPrompt => {
	if (week <= 0) {
		return MONDAY_PROMPTS[0];
	}

	if (week > MONDAY_PROMPTS.length) {
		const index = (week - 1) % MONDAY_PROMPTS.length;
		return MONDAY_PROMPTS[index];
	}

	return MONDAY_PROMPTS[week - 1];
};
