import type { RequestHandler } from '@sveltejs/kit';
import { remindStakeholderFeedback } from '$jobs/remind-stakeholder-feedback';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token || token !== process.env.JOB_SECRET_TOKEN) {
		return new Response('Unauthorized', { status: 401 });
	}

	await remindStakeholderFeedback();

	return new Response(null, { status: 204 });
};
