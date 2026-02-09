import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { Webhook } from 'svix';

type ClerkWebhookEvent = {
	type: string;
	data: Record<string, unknown>;
};

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

const missingSecretResponse = new Response('Webhook secret not configured', { status: 500 });
const badRequestResponse = new Response('Bad request', { status: 400 });

const verifyClerkWebhook = async (request: Request): Promise<ClerkWebhookEvent | null> => {
	if (!WEBHOOK_SECRET) {
		return null;
	}

	const payload = await request.text();
	const svixId = request.headers.get('svix-id');
	const svixTimestamp = request.headers.get('svix-timestamp');
	const svixSignature = request.headers.get('svix-signature');

	if (!svixId || !svixTimestamp || !svixSignature) {
		return null;
	}

	try {
		const wh = new Webhook(WEBHOOK_SECRET);
		return wh.verify(payload, {
			'svix-id': svixId,
			'svix-timestamp': svixTimestamp,
			'svix-signature': svixSignature
		}) as ClerkWebhookEvent;
	} catch (error) {
		console.error('Failed to verify Clerk webhook signature', error);
		return null;
	}
};

export const POST: RequestHandler = async ({ request }) => {
	if (!WEBHOOK_SECRET) {
		return missingSecretResponse;
	}

	const event = await verifyClerkWebhook(request);

	if (!event) {
		return badRequestResponse;
	}

	if (event.type === 'user.deleted') {
		const clerkUserId = typeof event.data?.id === 'string' ? event.data.id : null;

		if (!clerkUserId) {
			console.warn('Received Clerk user.deleted webhook without an id');
		} else {
			try {
				await prisma.user.delete({
					where: { clerkUserId }
				});
			} catch (error) {
				console.error(
					'Failed to delete Prisma user for Clerk user.deleted webhook. Manual reconciliation may be required.',
					{ clerkUserId, error }
				);
			}
		}
	}

	return new Response(null, { status: 204 });
};
