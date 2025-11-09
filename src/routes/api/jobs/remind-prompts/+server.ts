import type { RequestHandler } from '@sveltejs/kit';
import { remindOverduePrompts } from '$jobs/remind-overdue-prompts';

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

	await remindOverduePrompts();

	return new Response(null, { status: 204 });
};
