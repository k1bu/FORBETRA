import twilio from 'twilio';

export type SmsPayload = {
	to: string;
	body: string;
};

let client: ReturnType<typeof twilio> | null = null;

const getClient = () => {
	if (!client) {
		const sid = process.env.TWILIO_ACCOUNT_SID;
		const token = process.env.TWILIO_AUTH_TOKEN;
		if (!sid || !token) {
			throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
		}
		client = twilio(sid, token);
	}
	return client;
};

export const sendSms = async (payload: SmsPayload) => {
	if (process.env.NODE_ENV === 'development') {
		console.info('[sms:mock]', payload);
		return;
	}

	const fromNumber = process.env.TWILIO_FROM_NUMBER;
	if (!fromNumber) {
		throw new Error('Missing TWILIO_FROM_NUMBER');
	}

	const twilioClient = getClient();
	await twilioClient.messages.create({
		body: payload.body,
		to: payload.to,
		from: fromNumber
	});

	console.info(`[sms:sent] SMS sent to ${payload.to}`);
};
