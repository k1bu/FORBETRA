import type { RequestHandler } from '@sveltejs/kit';
import { remindStakeholderFeedback } from '$jobs/remind-stakeholder-feedback';
import { rateLimit } from '$lib/server/rateLimit';

const isAuthorized = (request: Request) => {
	const secret = process.env.JOB_SECRET_TOKEN;
	if (!secret) return false;

	const header = request.headers.get('authorization');
	return header === `Bearer ${secret}`;
};

export const GET: RequestHandler = async ({ request, url }) => {
	if (!isAuthorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!rateLimit(`job:${url.pathname}`, 1, 60_000)) {
		return new Response('Too many requests', { status: 429 });
	}

	await remindStakeholderFeedback();

	return new Response(null, { status: 204 });
};
