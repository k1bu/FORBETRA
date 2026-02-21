import type { RequestHandler } from '@sveltejs/kit';
import { remindBaseReflections } from '$jobs/remind-base-reflections';

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

	await remindBaseReflections();

	return new Response(null, { status: 204 });
};
