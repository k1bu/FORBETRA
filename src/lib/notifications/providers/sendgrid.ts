import sgMail from '@sendgrid/mail';
import type { EmailPayload, EmailProvider } from '../email';

type SendGridProviderOptions = {
	apiKey: string;
	fromEmail: string;
};

let configuredApiKey: string | null = null;

const ensureConfigured = (apiKey: string) => {
	if (configuredApiKey === apiKey) return;
	sgMail.setApiKey(apiKey);
	configuredApiKey = apiKey;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

export class SendGridProvider implements EmailProvider {
	private readonly apiKey: string;
	private readonly fromEmail: string;

	constructor(options: SendGridProviderOptions) {
		this.apiKey = options.apiKey;
		this.fromEmail = options.fromEmail;
	}

	async send(payload: EmailPayload): Promise<void> {
		ensureConfigured(this.apiKey);

		await sgMail.send({
			to: payload.to,
			from: this.fromEmail,
			subject: payload.subject,
			html: payload.html,
			text: payload.text || stripHtml(payload.html)
		});
	}
}
