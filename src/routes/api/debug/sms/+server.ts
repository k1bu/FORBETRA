import type { RequestHandler } from '@sveltejs/kit';
import { getSmsMode, sendSms } from '$lib/notifications/sms';

type DebugSmsRequestBody = {
	to?: unknown;
	body?: unknown;
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

	let reqBody: DebugSmsRequestBody;
	try {
		reqBody = (await request.json()) as DebugSmsRequestBody;
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const to = typeof reqBody.to === 'string' ? reqBody.to.trim() : '';
	if (!to) {
		return json({ ok: false, error: '`to` is required' }, { status: 400 });
	}

	const body =
		typeof reqBody.body === 'string' && reqBody.body.trim()
			? reqBody.body.trim()
			: 'Forbetra test SMS.';

	try {
		await sendSms({ to, body });
		return json({ ok: true, mode: getSmsMode() });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ ok: false, error: message, mode: getSmsMode() },
			{ status: 500 }
		);
	}
};
