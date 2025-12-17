export type EmailTemplateData = {
	individualName?: string;
	stakeholderName?: string;
	objectiveTitle?: string;
	cycleLabel?: string;
	feedbackLink?: string;
	weekNumber?: number;
	reflectionType?: string;
	appUrl?: string;
};

const baseUrl =
	process.env.PUBLIC_APP_URL || process.env.VERCEL_URL
		? `https://${process.env.PUBLIC_APP_URL || process.env.VERCEL_URL}`
		: 'https://app.forbetra.com';

export const emailTemplates = {
	welcomeIndividual: (data: EmailTemplateData) => ({
		subject: 'Welcome to FORBETRA! 🎯',
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to FORBETRA</h1>
				</div>
				<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
					<p style="font-size: 16px; margin-top: 0;">Hi ${data.individualName || 'there'},</p>
					<p style="font-size: 16px;">You're all set! Your development journey starts now.</p>
					<p style="font-size: 16px;">FORBETRA helps you turn development goals into measurable behaviors through structured reflection and stakeholder feedback.</p>
					<div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
						<p style="margin: 0; font-size: 14px; color: #64748b;"><strong>What's next?</strong></p>
						<ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; color: #64748b;">
							<li>Complete your onboarding to set up your first objective</li>
							<li>Add stakeholders who can provide feedback</li>
							<li>Start your weekly reflection cycle</li>
						</ul>
					</div>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${data.appUrl || baseUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Get Started</a>
					</div>
					<p style="font-size: 14px; color: #64748b; margin-top: 30px;">Questions? Just reply to this email.</p>
				</div>
			</body>
			</html>
		`,
		text: `Welcome to FORBETRA!\n\nHi ${data.individualName || 'there'},\n\nYou're all set! Your development journey starts now.\n\nFORBETRA helps you turn development goals into measurable behaviors through structured reflection and stakeholder feedback.\n\nWhat's next?\n- Complete your onboarding to set up your first objective\n- Add stakeholders who can provide feedback\n- Start your weekly reflection cycle\n\nGet started: ${data.appUrl || baseUrl}\n\nQuestions? Just reply to this email.`
	}),

	welcomeStakeholder: (data: EmailTemplateData) => ({
		subject: `You've been invited to support ${data.individualName || 'someone'}'s growth journey`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">You're Invited</h1>
				</div>
				<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
					<p style="font-size: 16px; margin-top: 0;">Hi ${data.stakeholderName || 'there'},</p>
					<p style="font-size: 16px;"><strong>${data.individualName || 'Someone'}</strong> has invited you to be a stakeholder in their development journey.</p>
					<p style="font-size: 16px;">Your role is simple: twice a week, you'll receive a quick link to share feedback on their progress. It takes less than 60 seconds.</p>
					<div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
						<p style="margin: 0; font-size: 14px; color: #64748b;"><strong>What to expect:</strong></p>
						<ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; color: #64748b;">
							<li>Brief feedback requests (2 quick questions)</li>
							<li>No account creation required</li>
							<li>Your feedback helps them track real progress</li>
						</ul>
					</div>
					<p style="font-size: 16px;">You'll receive your first feedback request when ${data.individualName || 'they'} submits their first reflection.</p>
					<p style="font-size: 14px; color: #64748b; margin-top: 30px;">Thank you for supporting their growth!</p>
				</div>
			</body>
			</html>
		`,
		text: `You've been invited to support ${data.individualName || 'someone'}'s growth journey\n\nHi ${data.stakeholderName || 'there'},\n\n${data.individualName || 'Someone'} has invited you to be a stakeholder in their development journey.\n\nYour role is simple: twice a week, you'll receive a quick link to share feedback on their progress. It takes less than 60 seconds.\n\nWhat to expect:\n- Brief feedback requests (2 quick questions)\n- No account creation required\n- Your feedback helps them track real progress\n\nYou'll receive your first feedback request when ${data.individualName || 'they'} submits their first reflection.\n\nThank you for supporting their growth!`
	}),

	feedbackInvite: (data: EmailTemplateData) => ({
		subject: `Quick feedback request for ${data.individualName || 'your participant'}`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Quick Feedback Request</h1>
				</div>
				<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
					<p style="font-size: 16px; margin-top: 0;">Hi ${data.stakeholderName || 'there'},</p>
					<p style="font-size: 16px;"><strong>${data.individualName || 'Your participant'}</strong> just completed a reflection and would love your feedback.</p>
					${data.objectiveTitle ? `<p style="font-size: 14px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 20px 0;"><strong>Objective:</strong> ${data.objectiveTitle}</p>` : ''}
					<p style="font-size: 16px;">This will take less than 60 seconds — just two quick questions about effort and progress.</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${data.feedbackLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Share Feedback</a>
					</div>
					<p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">This link expires in 7 days</p>
				</div>
			</body>
			</html>
		`,
		text: `Quick feedback request for ${data.individualName || 'your participant'}\n\nHi ${data.stakeholderName || 'there'},\n\n${data.individualName || 'Your participant'} just completed a reflection and would love your feedback.\n\n${data.objectiveTitle ? `Objective: ${data.objectiveTitle}\n\n` : ''}This will take less than 60 seconds — just two quick questions about effort and progress.\n\nShare feedback: ${data.feedbackLink}\n\nThis link expires in 7 days`
	}),

	stakeholderFeedbackReceived: (data: EmailTemplateData) => ({
		subject: `${data.stakeholderName || 'A stakeholder'} shared feedback on your progress`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">New Feedback Received</h1>
				</div>
				<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
					<p style="font-size: 16px; margin-top: 0;">Hi ${data.individualName || 'there'},</p>
					<p style="font-size: 16px;"><strong>${data.stakeholderName || 'A stakeholder'}</strong> just shared feedback on your progress.</p>
					<p style="font-size: 16px;">View your updated insights and see how your self-assessment aligns with their perspective.</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${data.appUrl || baseUrl}/individual/insights" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Insights</a>
					</div>
					<p style="font-size: 14px; color: #64748b; margin-top: 30px;">Keep up the great work!</p>
				</div>
			</body>
			</html>
		`,
		text: `${data.stakeholderName || 'A stakeholder'} shared feedback on your progress\n\nHi ${data.individualName || 'there'},\n\n${data.stakeholderName || 'A stakeholder'} just shared feedback on your progress.\n\nView your updated insights and see how your self-assessment aligns with their perspective.\n\nView insights: ${data.appUrl || baseUrl}/individual/insights\n\nKeep up the great work!`
	}),

	reminderBase: (data: EmailTemplateData) => {
		const dayLabel =
			data.reflectionType === 'INTENTION'
				? 'Monday'
				: data.reflectionType === 'RATING_A'
					? 'Wednesday'
					: 'Friday';
		return {
			subject: `Reminder: Time for your ${dayLabel} reflection`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
						<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Time for Your Reflection</h1>
					</div>
					<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
						<p style="font-size: 16px; margin-top: 0;">Hi ${data.individualName || 'there'},</p>
						<p style="font-size: 16px;">It's ${dayLabel} — time for your weekly reflection!</p>
						${data.objectiveTitle ? `<p style="font-size: 14px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 20px 0;"><strong>Objective:</strong> ${data.objectiveTitle}</p>` : ''}
						<p style="font-size: 16px;">Take a moment to reflect on your effort and progress this week.</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${data.appUrl || baseUrl}/reflections/${data.reflectionType?.toLowerCase() || 'checkin'}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Complete Reflection</a>
						</div>
						<p style="font-size: 14px; color: #64748b; margin-top: 30px;">This helps you stay consistent and track your growth.</p>
					</div>
				</body>
				</html>
			`,
			text: `Reminder: Time for your ${dayLabel} reflection\n\nHi ${data.individualName || 'there'},\n\nIt's ${dayLabel} — time for your weekly reflection!\n\n${data.objectiveTitle ? `Objective: ${data.objectiveTitle}\n\n` : ''}Take a moment to reflect on your effort and progress this week.\n\nComplete reflection: ${data.appUrl || baseUrl}/reflections/${data.reflectionType?.toLowerCase() || 'checkin'}\n\nThis helps you stay consistent and track your growth.`
		};
	},

	reminderOverdue: (data: EmailTemplateData) => ({
		subject: `Reminder: You have overdue reflections`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Overdue Reflections</h1>
				</div>
				<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
					<p style="font-size: 16px; margin-top: 0;">Hi ${data.individualName || 'there'},</p>
					<p style="font-size: 16px;">You have some overdue reflections that need your attention.</p>
					${data.objectiveTitle ? `<p style="font-size: 14px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 20px 0;"><strong>Objective:</strong> ${data.objectiveTitle}</p>` : ''}
					<div style="text-align: center; margin: 30px 0;">
						<a href="${data.appUrl || baseUrl}/individual" style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Dashboard</a>
					</div>
					<p style="font-size: 14px; color: #64748b; margin-top: 30px;">Catching up helps maintain your progress tracking.</p>
				</div>
			</body>
			</html>
		`,
		text: `Reminder: You have overdue reflections\n\nHi ${data.individualName || 'there'},\n\nYou have some overdue reflections that need your attention.\n\n${data.objectiveTitle ? `Objective: ${data.objectiveTitle}\n\n` : ''}View dashboard: ${data.appUrl || baseUrl}/individual\n\nCatching up helps maintain your progress tracking.`
	}),

	reminderStakeholderFeedback: (data: EmailTemplateData) => ({
		subject: `Reminder: Feedback request for ${data.individualName || 'your participant'}`,
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Feedback Reminder</h1>
				</div>
				<div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
					<p style="font-size: 16px; margin-top: 0;">Hi ${data.stakeholderName || 'there'},</p>
					<p style="font-size: 16px;">You have a pending feedback request from <strong>${data.individualName || 'your participant'}</strong>.</p>
					<p style="font-size: 16px;">This will take less than 60 seconds — just two quick questions.</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${data.feedbackLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Share Feedback</a>
					</div>
					<p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">This link expires soon</p>
				</div>
			</body>
			</html>
		`,
		text: `Reminder: Feedback request for ${data.individualName || 'your participant'}\n\nHi ${data.stakeholderName || 'there'},\n\nYou have a pending feedback request from ${data.individualName || 'your participant'}.\n\nThis will take less than 60 seconds — just two quick questions.\n\nShare feedback: ${data.feedbackLink}\n\nThis link expires soon`
	})
};
