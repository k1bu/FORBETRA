import type { RequestHandler } from '@sveltejs/kit';
import { remindOverduePrompts } from '$jobs/remind-overdue-prompts';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token || token !== process.env.JOB_SECRET_TOKEN) {
		return new Response('Unauthorized', { status: 401 });
	}

	await remindOverduePrompts();

	return new Response(null, { status: 204 });
};
