import type { RequestHandler } from '@sveltejs/kit';
import { generateWeeklyInsights } from '$jobs/generate-weekly-insights';

const isAuthorized = (request: Request) => {
	const secret = process.env.JOB_SECRET_TOKEN;
	if (!secret) return false;

	const header = request.headers.get('authorization');
	return header === `Bearer ${secret}`;
};

export const GET: RequestHandler = async ({ request }) => {
	if (!isAuthorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const result = await generateWeeklyInsights();

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
