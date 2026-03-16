import type { RequestHandler } from '@sveltejs/kit';
import { generateCoachPrepInsights } from '$jobs/generate-coach-prep';
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

	if (!(await rateLimit(`job:${url.pathname}`, 1, 60_000))) {
		return new Response('Too many requests', { status: 429 });
	}

	try {
		const result = await generateCoachPrepInsights();
		return new Response(JSON.stringify({ status: 'success', ...result }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('[job:coach-prep] Failed', error);
		return new Response(JSON.stringify({ status: 'error', error: String(error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
