import type { RequestHandler } from '@sveltejs/kit';
import { completeExpiredCycles } from '$jobs/complete-expired-cycles';

const isAuthorized = (request: Request) => {
	const secret = process.env.JOB_SECRET_TOKEN;
	if (!secret) return false;

	const header = request.headers.get('authorization');
	if (header && header === `Bearer ${secret}`) {
		return true;
	}

	const token = new URL(request.url).searchParams.get('token');
	return token === secret;
};

export const GET: RequestHandler = async ({ request }) => {
	if (!isAuthorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const result = await completeExpiredCycles();

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
