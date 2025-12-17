import sgMail from '@sendgrid/mail';

export type EmailPayload = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

export const sendEmail = async (payload: EmailPayload) => {
	if (process.env.NODE_ENV === 'development') {
		console.info('[email:mock]', payload);
		return;
	}

	const apiKey = process.env.SENDGRID_API_KEY;
	const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@forbetra.com';

	if (!apiKey) {
		console.error('[email] SENDGRID_API_KEY not configured');
		throw new Error('Email service not configured');
	}

	sgMail.setApiKey(apiKey);

	try {
		await sgMail.send({
			to: payload.to,
			from: fromEmail,
			subject: payload.subject,
			html: payload.html,
			text: payload.text || payload.html.replace(/<[^>]*>/g, '') // Strip HTML for text fallback
		});
		console.info('[email:sent]', { to: payload.to, subject: payload.subject });
	} catch (error) {
		console.error('[email:error]', error);
		throw error;
	}
};
