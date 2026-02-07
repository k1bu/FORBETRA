import { ServerClient } from 'postmark';
import type { EmailPayload, EmailProvider } from '../email';

type PostmarkProviderOptions = {
	apiKey: string;
	fromEmail: string;
	messageStream: string;
};

let cachedClient: { apiKey: string; client: ServerClient } | null = null;

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const getClient = (apiKey: string): ServerClient => {
	if (cachedClient?.apiKey === apiKey) return cachedClient.client;
	const client = new ServerClient(apiKey);
	cachedClient = { apiKey, client };
	return client;
};

export class PostmarkProvider implements EmailProvider {
	private readonly apiKey: string;
	private readonly fromEmail: string;
	private readonly messageStream: string;

	constructor(options: PostmarkProviderOptions) {
		this.apiKey = options.apiKey;
		this.fromEmail = options.fromEmail;
		this.messageStream = options.messageStream;
	}

	async send(payload: EmailPayload): Promise<void> {
		const client = getClient(this.apiKey);

		await client.sendEmail({
			From: this.fromEmail,
			To: payload.to,
			Subject: payload.subject,
			HtmlBody: payload.html,
			TextBody: payload.text || stripHtml(payload.html),
			MessageStream: this.messageStream
		});
	}
}
