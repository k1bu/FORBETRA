export type SmsPayload = {
	to: string;
	body: string;
};

export const sendSms = async (payload: SmsPayload) => {
	if (process.env.NODE_ENV === 'development') {
		console.info('[sms:mock]', payload);
		return;
	}

	// TODO: integrate with Twilio or preferred provider
	// Example Twilio usage:
	// const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
	// await client.messages.create({
	// 	body: payload.body,
	// 	to: payload.to,
	// 	from: process.env.TWILIO_FROM_NUMBER!
	// });
	throw new Error('SMS sending not yet implemented in production.');
};
