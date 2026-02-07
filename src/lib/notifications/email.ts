export type EmailPayload = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

export type EmailMode = 'send' | 'mock';
export type EmailProviderName = 'sendgrid' | 'postmark';

export interface EmailProvider {
	send(payload: EmailPayload): Promise<void>;
}

import { SendGridProvider } from './providers/sendgrid';
import { PostmarkProvider } from './providers/postmark';

const defaultFromEmail = 'noreply@forbetra.com';
const emailNotConfiguredError = 'Email service not configured';

export function getEmailMode(): EmailMode {
	const raw = process.env.EMAIL_MODE?.toLowerCase();
	if (raw === 'send' || raw === 'mock') return raw;

	return process.env.NODE_ENV === 'development' ? 'mock' : 'send';
}

const resolveProviderName = (): EmailProviderName => {
	const explicit = process.env.EMAIL_PROVIDER?.toLowerCase();
	if (explicit === 'sendgrid' || explicit === 'postmark') {
		return explicit;
	}

	// Prefer Postmark if it is configured
	if (process.env.POSTMARK_API_KEY) return 'postmark';
	if (process.env.SENDGRID_API_KEY) return 'sendgrid';

	throw new Error(emailNotConfiguredError);
};

export function getEmailProviderName(): string {
	try {
		return resolveProviderName();
	} catch {
		return 'unconfigured';
	}
}

export function isEmailConfigured(): boolean {
	let name: EmailProviderName;
	try {
		name = resolveProviderName();
	} catch {
		return false;
	}

	if (name === 'postmark') return Boolean(process.env.POSTMARK_API_KEY);
	return Boolean(process.env.SENDGRID_API_KEY);
}

let cachedProvider: { name: EmailProviderName; provider: EmailProvider } | null = null;

const getProvider = (): { name: EmailProviderName; provider: EmailProvider } => {
	if (cachedProvider) return cachedProvider;

	const name = resolveProviderName();

	if (name === 'postmark') {
		const apiKey = process.env.POSTMARK_API_KEY;
		const fromEmail = process.env.POSTMARK_FROM_EMAIL || defaultFromEmail;
		const messageStream = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';

		if (!apiKey) throw new Error(emailNotConfiguredError);

		cachedProvider = {
			name,
			provider: new PostmarkProvider({ apiKey, fromEmail, messageStream })
		};

		return cachedProvider;
	}

	// SendGrid
	const apiKey = process.env.SENDGRID_API_KEY;
	const fromEmail = process.env.SENDGRID_FROM_EMAIL || defaultFromEmail;

	if (!apiKey) throw new Error(emailNotConfiguredError);

	cachedProvider = {
		name,
		provider: new SendGridProvider({ apiKey, fromEmail })
	};

	return cachedProvider;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
	const mode = getEmailMode();
	if (mode === 'mock') {
		console.info('[email:mock]', payload);
		return;
	}

	const { provider } = getProvider();

	try {
		await provider.send(payload);
		console.info('[email:sent]', { to: payload.to, subject: payload.subject });
	} catch (error) {
		console.error('[email:error]', error);
		throw error;
	}
}
