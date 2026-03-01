import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const newCycleSchema = z.object({
	cycleLabel: z
		.string()
		.trim()
		.min(1, 'Cycle name is required')
		.max(80, 'Keep it under 80 characters'),
	cycleStartDate: z
		.string()
		.refine((value) => value.length > 0, 'Start date is required')
		.refine((value) => !Number.isNaN(Date.parse(value)), 'Provide a valid start date'),
	cycleDurationWeeks: z
		.number()
		.int()
		.min(4, 'Pick at least 4 weeks')
		.max(26, 'Keep cycles to 26 weeks or fewer'),
	checkInFrequency: z.string().min(1, 'Select at least one check-in day').default('3x'),
	stakeholderCadence: z.enum(['weekly', 'biweekly']).default('weekly'),
	reminderDays: z.enum(['wednesday_friday', 'tuesday_thursday']).default('wednesday_friday')
});

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: {
				where: { active: true },
				orderBy: { createdAt: 'asc' }
			},
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1
			}
		}
	});

	if (!objective) {
		throw redirect(303, '/onboarding');
	}

	const lastCycle = objective.cycles[0] ?? null;
	const cycleCount = await prisma.cycle.count({
		where: { objectiveId: objective.id }
	});

	const defaultStartDate = new Date().toISOString().slice(0, 10);

	return {
		objective: {
			id: objective.id,
			title: objective.title,
			description: objective.description
		},
		subgoals: objective.subgoals.map((s) => ({
			id: s.id,
			label: s.label,
			description: s.description
		})),
		lastCycle: lastCycle
			? {
					id: lastCycle.id,
					label: lastCycle.label,
					startDate: lastCycle.startDate.toISOString(),
					endDate: lastCycle.endDate?.toISOString() ?? null,
					checkInFrequency: lastCycle.checkInFrequency,
					stakeholderCadence: lastCycle.stakeholderCadence
				}
			: null,
		defaults: {
			cycleLabel: `Journey ${cycleCount + 1}`,
			startDate: defaultStartDate,
			durationWeeks:
				lastCycle?.endDate && lastCycle?.startDate
					? Math.round(
							(lastCycle.endDate.getTime() - lastCycle.startDate.getTime()) /
								(7 * 24 * 60 * 60 * 1000)
						)
					: 12,
			checkInFrequency: lastCycle?.checkInFrequency ?? '3x',
			stakeholderCadence: lastCycle?.stakeholderCadence ?? 'weekly'
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const cycleMode = (formData.get('cycleMode') ?? 'continue').toString();
		const reminderDays = (formData.get('reminderDays') ?? 'wednesday_friday').toString();
		const revealScores = (formData.get('revealScores') ?? 'true').toString() === 'true';

		const parsed = newCycleSchema.safeParse({
			cycleLabel: (formData.get('cycleLabel') ?? '').toString().trim(),
			cycleStartDate: (formData.get('cycleStartDate') ?? '').toString(),
			cycleDurationWeeks: Number.parseInt(
				(formData.get('cycleDurationWeeks') ?? '').toString(),
				10
			),
			checkInFrequency: (formData.get('checkInFrequency') ?? '3x').toString(),
			stakeholderCadence: (formData.get('stakeholderCadence') ?? 'weekly').toString(),
			reminderDays
		});

		if (!parsed.success) {
			const errors = parsed.error.flatten();
			return fail(400, {
				error:
					errors.fieldErrors.cycleLabel?.[0] ??
					errors.fieldErrors.cycleStartDate?.[0] ??
					errors.fieldErrors.cycleDurationWeeks?.[0] ??
					'Invalid input',
				values: Object.fromEntries(formData) as Record<string, string>
			});
		}

		const data = parsed.data;
		const startDate = new Date(data.cycleStartDate);
		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + data.cycleDurationWeeks * 7);

		try {
			let objectiveId: string;

			if (cycleMode === 'fresh') {
				// Create a new objective (mark old ones as inactive)
				const freshTitle = (formData.get('freshObjectiveTitle') ?? '').toString().trim();
				const freshDescription = (formData.get('freshObjectiveDescription') ?? '')
					.toString()
					.trim();

				if (freshTitle.length < 3) {
					return fail(400, {
						error: 'Objective title must be at least 3 characters.',
						values: Object.fromEntries(formData) as Record<string, string>
					});
				}

				// Deactivate all existing active objectives
				await prisma.objective.updateMany({
					where: { userId: dbUser.id, active: true },
					data: { active: false }
				});

				// Mark any existing ACTIVE cycles as COMPLETED
				await prisma.cycle.updateMany({
					where: { userId: dbUser.id, status: 'ACTIVE' },
					data: { status: 'COMPLETED' }
				});

				// Create the new objective
				const newObjective = await prisma.objective.create({
					data: {
						userId: dbUser.id,
						title: freshTitle,
						description: freshDescription || null,
						active: true
					}
				});
				objectiveId = newObjective.id;
			} else {
				// Continue with existing objective
				const objective = await prisma.objective.findFirst({
					where: { userId: dbUser.id, active: true },
					orderBy: { createdAt: 'desc' },
					select: { id: true }
				});

				if (!objective) {
					return fail(400, { error: 'No active objective found.' });
				}
				objectiveId = objective.id;

				// Mark any existing ACTIVE cycles as COMPLETED
				await prisma.cycle.updateMany({
					where: {
						objectiveId: objectiveId,
						status: 'ACTIVE'
					},
					data: { status: 'COMPLETED' }
				});
			}

			await prisma.cycle.create({
				data: {
					userId: dbUser.id,
					objectiveId,
					label: data.cycleLabel,
					startDate,
					endDate,
					status: 'ACTIVE',
					checkInFrequency: data.checkInFrequency,
					stakeholderCadence: data.stakeholderCadence,
					revealScores
				}
			});

			// Update reminder days
			await prisma.user.update({
				where: { id: dbUser.id },
				data: { reminderDays: data.reminderDays }
			});
		} catch (error) {
			console.error('[new-cycle:error] Failed to create cycle:', error);
			return fail(500, { error: 'Failed to create new cycle. Please try again.' });
		}

		// If "fresh" objective was created with no subgoals, redirect to onboarding
		// to let the user add sub-objectives, otherwise go to individual hub
		if (cycleMode === 'fresh') {
			throw redirect(303, '/onboarding');
		}
		throw redirect(303, '/individual');
	}
};
