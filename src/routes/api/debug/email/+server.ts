import type { RequestHandler } from '@sveltejs/kit';
import {
	getEmailMode,
	getEmailProviderName,
	isEmailConfigured,
	sendEmail
} from '$lib/notifications/email';

type DebugEmailRequestBody = {
	to?: unknown;
	subject?: unknown;
	html?: unknown;
};

const json = (data: unknown, init?: ResponseInit) =>
	new Response(JSON.stringify(data), {
		...init,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...(init?.headers ?? {})
		}
	});

const isAuthorized = (request: Request) => {
	const secret = process.env.DEBUG_EMAIL_KEY;
	if (!secret) return false;
	return request.headers.get('x-debug-key') === secret;
};

export const POST: RequestHandler = async ({ request }) => {
	if (!isAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	let body: DebugEmailRequestBody;
	try {
		body = (await request.json()) as DebugEmailRequestBody;
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const to = typeof body.to === 'string' ? body.to.trim() : '';
	if (!to) {
		return json({ ok: false, error: '`to` is required' }, { status: 400 });
	}

	const subject =
		typeof body.subject === 'string' && body.subject.trim()
			? body.subject.trim()
			: 'FORBETRA test email';

	const html =
		typeof body.html === 'string' && body.html.trim()
			? body.html
			: `<p>FORBETRA debug test email.</p><p>Mode: ${getEmailMode()}</p><p>Provider: ${getEmailProviderName()}</p>`;

	try {
		await sendEmail({ to, subject, html });
		return json({
			ok: true,
			mode: getEmailMode(),
			provider: getEmailProviderName(),
			configured: isEmailConfigured()
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{
				ok: false,
				error: message,
				mode: getEmailMode(),
				provider: getEmailProviderName(),
				configured: isEmailConfigured()
			},
			{ status: 500 }
		);
	}
};
