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

	// TODO: integrate with Postmark or preferred provider
	// Example Postmark usage:
	// const client = new ServerClient(process.env.POSTMARK_API_TOKEN!);
	// await client.sendEmail({
	// 	From: process.env.POSTMARK_FROM_EMAIL!,
	// 	To: payload.to,
	// 	Subject: payload.subject,
	// 	HtmlBody: payload.html,
	// 	TextBody: payload.text
	// });
	throw new Error('Email sending not yet implemented in production.');
};
