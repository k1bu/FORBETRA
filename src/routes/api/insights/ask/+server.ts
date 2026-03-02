import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import prisma from '$lib/server/prisma';
import anthropic from '$lib/server/ai/client';
import { computeWeekNumber } from '$lib/server/coachUtils';
import { rateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	if (!rateLimit(`insight:${dbUser.id}`, 5, 60_000)) {
		return json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
	}

	const body = await event.request.json();
	const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? [];

	if (!messages.length || messages[messages.length - 1].role !== 'user') {
		return json({ error: 'Missing user message' }, { status: 400 });
	}

	if (messages.length > 20) {
		return json({ error: 'Too many messages. Please start a new conversation.' }, { status: 400 });
	}

	const oversizedMessage = messages.find((m) => m.content.length > 2000);
	if (oversizedMessage) {
		return json(
			{ error: 'Message too long. Please keep each message under 2000 characters.' },
			{ status: 400 }
		);
	}

	// Simple rate limit: max 20 insight requests per hour (all types)
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	const recentCount = await prisma.insight.count({
		where: {
			userId: dbUser.id,
			createdAt: { gte: oneHourAgo }
		}
	});
	if (recentCount >= 20) {
		return json({ error: 'Rate limit reached. Please try again later.' }, { status: 429 });
	}

	// Load user's active cycle data
	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { where: { active: true }, orderBy: { createdAt: 'asc' } },
			cycles: {
				where: { status: 'ACTIVE' },
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						where: { userId: dbUser.id },
						orderBy: [{ weekNumber: 'asc' }, { checkInDate: 'asc' }],
						select: {
							reflectionType: true,
							weekNumber: true,
							effortScore: true,
							performanceScore: true,
							notes: true,
							checkInDate: true,
							feedbacks: {
								select: {
									effortScore: true,
									performanceScore: true,
									comment: true,
									stakeholder: { select: { name: true } }
								}
							}
						}
					}
				}
			},
			stakeholders: { select: { name: true, relationship: true } }
		}
	});

	if (!objective || objective.cycles.length === 0) {
		return json({ error: 'No active cycle found. Start a cycle first.' }, { status: 400 });
	}

	const cycle = objective.cycles[0];
	const currentWeek = computeWeekNumber(cycle.startDate);

	// Build context string
	const contextLines: string[] = [
		`User: ${dbUser.name || dbUser.email}`,
		`Objective: ${objective.title}`,
		objective.description ? `Description: ${objective.description}` : '',
		`Sub-goals: ${objective.subgoals.map((s) => s.label + (s.description ? ` (${s.description})` : '')).join('; ')}`,
		`Cycle: ${cycle.label || 'Current'}, started ${cycle.startDate.toISOString().slice(0, 10)}, current week ${currentWeek}`,
		`Stakeholders: ${objective.stakeholders.map((s) => s.name + (s.relationship ? ` (${s.relationship})` : '')).join(', ') || 'None'}`,
		'',
		'--- Reflection Data ---'
	];

	for (const r of cycle.reflections) {
		const typeLabel = r.reflectionType === 'RATING_A' ? 'Mid-week' : 'End-of-week';
		let line = `Week ${r.weekNumber} ${typeLabel}:`;
		if (r.effortScore !== null) line += ` Effort=${r.effortScore}`;
		if (r.performanceScore !== null) line += ` Performance=${r.performanceScore}`;
		if (r.notes) line += ` Notes: "${r.notes}"`;
		contextLines.push(line);

		for (const fb of r.feedbacks) {
			let fbLine = `  Stakeholder ${fb.stakeholder.name}:`;
			if (fb.effortScore !== null) fbLine += ` Effort=${fb.effortScore}`;
			if (fb.performanceScore !== null) fbLine += ` Performance=${fb.performanceScore}`;
			if (fb.comment) fbLine += ` Comment: "${fb.comment}"`;
			contextLines.push(fbLine);
		}
	}

	const contextStr = contextLines.filter(Boolean).join('\n');

	const systemPrompt = `You are a developmental coach AI integrated into Forbetra, a personal development platform. You have access to the user's actual data from their development cycle.

Your role:
- Answer questions about the user's data, patterns, and progress
- Reference specific numbers, trends, and observations from their reflections
- Be encouraging but honest — point out both strengths and areas for growth
- Stay focused on the user's development objective and sub-goals
- Keep responses concise (2-4 paragraphs max unless more detail is requested)
- Do not make up data — only reference what's in the context below

User's Development Data:
${contextStr}`;

	// Stream the response
	const stream = await anthropic.messages.stream({
		model: 'claude-sonnet-4-5-20250929',
		max_tokens: 1024,
		system: systemPrompt,
		messages: messages.map((m) => ({
			role: m.role,
			content: m.content
		}))
	});

	const encoder = new TextEncoder();
	const readable = new ReadableStream({
		async start(controller) {
			try {
				for await (const event of stream) {
					if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
						controller.enqueue(
							encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
						);
					}
				}
				controller.enqueue(encoder.encode('data: [DONE]\n\n'));
				controller.close();
			} catch (error) {
				console.error('[ask:error]', error);
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
				);
				controller.close();
			}
		}
	});

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
