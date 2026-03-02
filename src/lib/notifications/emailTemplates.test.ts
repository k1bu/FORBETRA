import { describe, it, expect } from 'vitest';
import { emailTemplates } from './emailTemplates';

describe('emailTemplates', () => {
	it('welcomeIndividual returns subject and html', () => {
		const result = emailTemplates.welcomeIndividual({ individualName: 'Alice' });
		expect(result.subject).toBe('Welcome to Forbetra');
		expect(result.html).toContain('Alice');
		expect(result.text).toContain('Alice');
	});

	it('welcomeIndividual handles missing name gracefully', () => {
		const result = emailTemplates.welcomeIndividual({});
		expect(result.html).toContain('there');
		expect(result.text).toContain('there');
	});

	it('feedbackInvite includes the individual name in subject', () => {
		const result = emailTemplates.feedbackInvite({
			individualName: 'Bob',
			feedbackLink: 'https://example.com/feedback'
		});
		expect(result.subject).toContain('Bob');
		expect(result.html).toContain('https://example.com/feedback');
	});

	it('stakeholderFeedbackReceived produces valid output', () => {
		const result = emailTemplates.stakeholderFeedbackReceived({
			individualName: 'Carol',
			stakeholderName: 'Dave'
		});
		expect(result.subject).toContain('Dave');
		expect(result.html).toContain('Carol');
		expect(result.html).toContain('Dave');
	});

	it('all templates return non-empty subject and html', () => {
		const templates = [
			emailTemplates.welcomeIndividual({}),
			emailTemplates.welcomeStakeholder({}),
			emailTemplates.feedbackInvite({ feedbackLink: 'https://test.com' }),
			emailTemplates.stakeholderFeedbackReceived({}),
			emailTemplates.reminderBase({}),
			emailTemplates.reminderOverdue({}),
			emailTemplates.cycleCompleted({}),
			emailTemplates.reminderStakeholderFeedback({ feedbackLink: 'https://test.com' }),
			emailTemplates.stakeholderThankYou({ weekNumber: 3 }),
			emailTemplates.coachInvitation({
				coachName: 'Coach',
				inviteUrl: 'https://test.com'
			}),
			emailTemplates.coachClientAccepted({
				coachName: 'Coach',
				clientName: 'Client',
				clientEmail: 'c@test.com'
			}),
			emailTemplates.coachStakeholderFeedbackReceived({
				coachName: 'Coach',
				individualName: 'Client'
			})
		];

		for (const template of templates) {
			expect(template.subject.length).toBeGreaterThan(0);
			expect(template.html.length).toBeGreaterThan(0);
			expect(template.text.length).toBeGreaterThan(0);
		}
	});

	it('escapes HTML in user-provided names', () => {
		const result = emailTemplates.welcomeIndividual({
			individualName: '<script>alert("xss")</script>'
		});
		expect(result.html).not.toContain('<script>');
		expect(result.html).toContain('&lt;script&gt;');
	});
});
