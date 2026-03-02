import { describe, it, expect } from 'vitest';
import { smsTemplates } from './smsTemplates';

describe('smsTemplates', () => {
	it('welcomeIndividual returns a greeting with the name', () => {
		const result = smsTemplates.welcomeIndividual({ individualName: 'Alice' });
		expect(result).toContain('Alice');
		expect(result).toContain('Forbetra');
	});

	it('welcomeIndividual uses fallback name when missing', () => {
		const result = smsTemplates.welcomeIndividual({});
		expect(result).toContain('there');
	});

	it('reminderBase uses correct day label for rating_a', () => {
		const result = smsTemplates.reminderBase({
			reflectionType: 'rating_a',
			weekNumber: 3
		});
		expect(result).toContain('Wednesday');
		expect(result).toContain('Week 3');
	});

	it('reminderBase uses correct day label for rating_b', () => {
		const result = smsTemplates.reminderBase({
			reflectionType: 'rating_b',
			weekNumber: 5
		});
		expect(result).toContain('Friday');
	});

	it('all templates return non-empty strings', () => {
		const results = [
			smsTemplates.welcomeIndividual({}),
			smsTemplates.reminderBase({ reflectionType: 'rating_a', weekNumber: 1 }),
			smsTemplates.reminderOverdue({}),
			smsTemplates.welcomeStakeholder({}),
			smsTemplates.feedbackInvite({ feedbackLink: 'https://test.com' }),
			smsTemplates.stakeholderFeedbackReceived({}),
			smsTemplates.stakeholderThankYou({ weekNumber: 2 }),
			smsTemplates.reminderStakeholderFeedback({ feedbackLink: 'https://test.com' }),
			smsTemplates.stakeholderImpactSummary({
				weeksContributed: 4,
				totalFeedbacks: 8
			}),
			smsTemplates.cycleCompleted({}),
			smsTemplates.coachInvitation({ inviteUrl: 'https://test.com' }),
			smsTemplates.coachClientAccepted({ clientName: 'Bob' })
		];

		for (const result of results) {
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		}
	});

	it('stakeholderThankYou includes week number', () => {
		const result = smsTemplates.stakeholderThankYou({ weekNumber: 7 });
		expect(result).toContain('Week 7');
	});
});
