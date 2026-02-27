import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { clerkClient } from 'svelte-clerk/server';
import type { Actions, PageServerLoad } from './$types';
import { validatePhone, normalizePhone } from '$lib/utils/phone';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { where: { active: true }, orderBy: { order: 'asc' } },
			stakeholders: { orderBy: { createdAt: 'asc' } },
			cycles: {
				where: { status: { in: ['ACTIVE', 'PLANNED'] } },
				orderBy: { startDate: 'desc' },
				take: 1
			}
		}
	});

	const cycle = objective?.cycles[0] ?? null;
	const durationWeeks =
		cycle?.endDate && cycle?.startDate
			? Math.round(
					(cycle.endDate.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
				)
			: 12;

	// Convert legacy frequency format ("3x"/"2x"/"1x") to comma-separated days
	const legacyFrequencyMap: Record<string, string> = {
		'3x': 'mon,wed,fri',
		'2x': 'tue,fri',
		'1x': 'fri'
	};
	const normalizedFrequency = cycle?.checkInFrequency
		? (legacyFrequencyMap[cycle.checkInFrequency] ?? cycle.checkInFrequency)
		: 'tue,fri';

	return {
		user: {
			name: dbUser.name ?? '',
			email: dbUser.email,
			phone: dbUser.phone ?? '',
			timezone: dbUser.timezone ?? '',
			notificationTime: dbUser.notificationTime ?? '09:00',
			deliveryMethod: dbUser.deliveryMethod ?? 'email',
			role: dbUser.role
		},
		objective: objective
			? {
					id: objective.id,
					title: objective.title,
					description: objective.description ?? ''
				}
			: null,
		subgoals:
			objective?.subgoals.map((s) => ({
				id: s.id,
				label: s.label,
				description: s.description ?? ''
			})) ?? [],
		stakeholders:
			objective?.stakeholders.map((s) => ({
				id: s.id,
				name: s.name,
				email: s.email,
				relationship: s.relationship ?? '',
				phone: s.phone ?? ''
			})) ?? [],
		cycle: cycle
			? {
					id: cycle.id,
					label: cycle.label ?? '',
					startDate: cycle.startDate.toISOString().slice(0, 10),
					durationWeeks,
					checkInFrequency: normalizedFrequency,
					stakeholderCadence: cycle.stakeholderCadence,
					stakeholderFeedbackTime: cycle.stakeholderFeedbackTime ?? '09:00',
					revealScores: cycle.revealScores
				}
			: null
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const phone = formData.get('phone')?.toString().trim() ?? '';
		const timezone = formData.get('timezone')?.toString().trim() ?? '';
		const notificationTime = formData.get('notificationTime')?.toString().trim() ?? '09:00';
		const deliveryMethod = formData.get('deliveryMethod')?.toString().trim() ?? 'email';

		if (!name) {
			return fail(400, { error: 'Display name is required.', section: 'profile' });
		}
		if (name.length > 100) {
			return fail(400, {
				error: 'Display name must be 100 characters or fewer.',
				section: 'profile'
			});
		}
		if (phone && !validatePhone(phone)) {
			return fail(400, {
				error: 'Enter a valid phone number (7\u201315 digits, e.g. +1 555 123 4567).',
				section: 'profile'
			});
		}

		try {
			const updatedUser = await prisma.user.update({
				where: { id: dbUser.id },
				data: {
					name: name || null,
					phone: phone ? normalizePhone(phone) : null,
					timezone: timezone || null,
					notificationTime,
					deliveryMethod
				}
			});

			if (updatedUser.clerkUserId && name) {
				try {
					await clerkClient.users.updateUser(updatedUser.clerkUserId, {
						firstName: name.split(' ')[0],
						lastName: name.split(' ').slice(1).join(' ') || undefined
					});
				} catch (error) {
					console.warn('Failed to sync name to Clerk', error);
				}
			}

			return { success: true, message: 'Profile updated.', section: 'profile' };
		} catch (error) {
			console.error('Failed to update profile', error);
			return fail(500, { error: 'Unable to save profile. Please try again.', section: 'profile' });
		}
	},

	updateObjective: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const objectiveId = formData.get('objectiveId')?.toString().trim() ?? '';
		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';

		if (!objectiveId) {
			return fail(400, { error: 'No active objective found.', section: 'objective' });
		}
		if (!title || title.length < 3) {
			return fail(400, {
				error: 'Objective title must be at least 3 characters.',
				section: 'objective'
			});
		}
		if (title.length > 200) {
			return fail(400, {
				error: 'Objective title must be 200 characters or fewer.',
				section: 'objective'
			});
		}

		try {
			const existing = await prisma.objective.findUnique({
				where: { id: objectiveId },
				select: { title: true, description: true, userId: true }
			});

			if (!existing || existing.userId !== dbUser.id) {
				return fail(403, { error: 'Objective not found.', section: 'objective' });
			}

			const titleChanged = existing.title !== title;
			const descChanged = (existing.description ?? '') !== description;

			if (titleChanged || descChanged) {
				await prisma.$transaction(async (tx) => {
					await tx.objectiveChange.create({
						data: {
							objectiveId,
							userId: dbUser.id,
							previousTitle: existing.title,
							newTitle: title,
							previousDesc: existing.description,
							newDesc: description || null
						}
					});

					await tx.objective.update({
						where: { id: objectiveId },
						data: {
							title,
							description: description || null
						}
					});
				});

				return {
					success: true,
					message:
						'Objective updated. This change has been recorded and will be reflected in your data.',
					section: 'objective'
				};
			}

			return { success: true, message: 'No changes to save.', section: 'objective' };
		} catch (error) {
			console.error('Failed to update objective', error);
			return fail(500, {
				error: 'Unable to save objective. Please try again.',
				section: 'objective'
			});
		}
	},

	updateSubgoals: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const objectiveId = formData.get('objectiveId')?.toString().trim() ?? '';

		if (!objectiveId) {
			return fail(400, { error: 'No active objective found.', section: 'subgoals' });
		}

		const objective = await prisma.objective.findUnique({
			where: { id: objectiveId },
			select: { userId: true }
		});

		if (!objective || objective.userId !== dbUser.id) {
			return fail(403, { error: 'Objective not found.', section: 'subgoals' });
		}

		const subgoals: Array<{ id?: string; label: string; description: string }> = [];
		for (let i = 1; i <= 5; i++) {
			const label = formData.get(`subgoalLabel${i}`)?.toString().trim() ?? '';
			const description = formData.get(`subgoalDescription${i}`)?.toString().trim() ?? '';
			const id = formData.get(`subgoalId${i}`)?.toString().trim() ?? '';
			if (label) {
				subgoals.push({ id: id || undefined, label, description });
			}
		}

		if (subgoals.length === 0) {
			return fail(400, { error: 'At least one sub-objective is required.', section: 'subgoals' });
		}

		try {
			await prisma.$transaction(async (tx) => {
				// Deactivate all existing subgoals
				await tx.subgoal.updateMany({
					where: { objectiveId },
					data: { active: false }
				});

				// Create new subgoals with order
				for (let i = 0; i < subgoals.length; i++) {
					await tx.subgoal.create({
						data: {
							objectiveId,
							label: subgoals[i].label,
							description: subgoals[i].description || null,
							order: i
						}
					});
				}
			});

			return { success: true, message: 'Sub-objectives updated.', section: 'subgoals' };
		} catch (error) {
			console.error('Failed to update subgoals', error);
			return fail(500, {
				error: 'Unable to save sub-objectives. Please try again.',
				section: 'subgoals'
			});
		}
	},

	updateCycle: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const cycleId = formData.get('cycleId')?.toString().trim() ?? '';
		const label = formData.get('label')?.toString().trim() ?? '';
		const startDate = formData.get('startDate')?.toString().trim() ?? '';
		const durationWeeksRaw = formData.get('durationWeeks')?.toString().trim() ?? '12';
		const checkInFrequency = formData.get('checkInFrequency')?.toString().trim() ?? 'tue,fri';
		const stakeholderCadence = formData.get('stakeholderCadence')?.toString().trim() ?? 'weekly';
		const stakeholderFeedbackTime =
			formData.get('stakeholderFeedbackTime')?.toString().trim() ?? '09:00';
		const revealScores = formData.get('revealScores')?.toString() === 'true';

		if (!cycleId) {
			return fail(400, { error: 'No active cycle found.', section: 'cycle' });
		}

		if (!checkInFrequency) {
			return fail(400, { error: 'Select at least one check-in day.', section: 'cycle' });
		}

		const durationWeeks = parseInt(durationWeeksRaw, 10);
		if (isNaN(durationWeeks) || durationWeeks < 4 || durationWeeks > 26) {
			return fail(400, {
				error: 'Cycle duration must be between 4 and 26 weeks.',
				section: 'cycle'
			});
		}

		const parsedStart = new Date(startDate);
		if (isNaN(parsedStart.getTime())) {
			return fail(400, { error: 'Invalid start date.', section: 'cycle' });
		}

		const endDate = new Date(parsedStart);
		endDate.setDate(endDate.getDate() + durationWeeks * 7);

		try {
			const cycle = await prisma.cycle.findUnique({
				where: { id: cycleId },
				select: { userId: true }
			});

			if (!cycle || cycle.userId !== dbUser.id) {
				return fail(403, { error: 'Cycle not found.', section: 'cycle' });
			}

			await prisma.cycle.update({
				where: { id: cycleId },
				data: {
					label: label || null,
					startDate: parsedStart,
					endDate,
					checkInFrequency,
					stakeholderCadence,
					stakeholderFeedbackTime,
					revealScores
				}
			});

			return { success: true, message: 'Cycle settings updated.', section: 'cycle' };
		} catch (error) {
			console.error('Failed to update cycle', error);
			return fail(500, {
				error: 'Unable to save cycle settings. Please try again.',
				section: 'cycle'
			});
		}
	},

	updateStakeholders: async (event) => {
		const { dbUser } = requireRole(event, 'INDIVIDUAL');

		const formData = await event.request.formData();
		const objectiveId = formData.get('objectiveId')?.toString().trim() ?? '';

		if (!objectiveId) {
			return fail(400, { error: 'No active objective found.', section: 'stakeholders' });
		}

		const objective = await prisma.objective.findUnique({
			where: { id: objectiveId },
			select: { userId: true }
		});

		if (!objective || objective.userId !== dbUser.id) {
			return fail(403, { error: 'Objective not found.', section: 'stakeholders' });
		}

		const stakeholders: Array<{
			id?: string;
			name: string;
			email: string;
			relationship: string;
			phone: string;
		}> = [];
		for (let i = 1; i <= 5; i++) {
			const name = formData.get(`stakeholderName${i}`)?.toString().trim() ?? '';
			const email = formData.get(`stakeholderEmail${i}`)?.toString().trim() ?? '';
			const relationship = formData.get(`stakeholderRelationship${i}`)?.toString().trim() ?? '';
			const phone = formData.get(`stakeholderPhone${i}`)?.toString().trim() ?? '';
			const id = formData.get(`stakeholderId${i}`)?.toString().trim() ?? '';
			if (name && email) {
				stakeholders.push({ id: id || undefined, name, email, relationship, phone });
			}
		}

		try {
			const existingStakeholders = await prisma.stakeholder.findMany({
				where: { objectiveId },
				select: { id: true, email: true }
			});
			const existingEmailMap = new Map(
				existingStakeholders.map((s) => [s.email.toLowerCase(), s.id])
			);

			await prisma.$transaction(async (tx) => {
				for (const stakeholder of stakeholders) {
					const existingId = existingEmailMap.get(stakeholder.email.toLowerCase());
					if (existingId) {
						await tx.stakeholder.update({
							where: { id: existingId },
							data: {
								name: stakeholder.name,
								relationship: stakeholder.relationship || null,
								phone: stakeholder.phone || null
							}
						});
						existingEmailMap.delete(stakeholder.email.toLowerCase());
					} else {
						await tx.stakeholder.create({
							data: {
								individualId: dbUser.id,
								objectiveId,
								name: stakeholder.name,
								email: stakeholder.email,
								relationship: stakeholder.relationship || null,
								phone: stakeholder.phone || null
							}
						});
					}
				}

				// Delete stakeholders that were removed by the user
				// (skip those with existing feedback to preserve historical data)
				for (const [, orphanId] of existingEmailMap) {
					const hasFeedback = await tx.feedback.count({ where: { stakeholderId: orphanId } });
					if (hasFeedback === 0) {
						await tx.stakeholder.delete({ where: { id: orphanId } });
					}
				}
			});

			return { success: true, message: 'Stakeholders updated.', section: 'stakeholders' };
		} catch (error) {
			console.error('Failed to update stakeholders', error);
			return fail(500, {
				error: 'Unable to save stakeholders. Please try again.',
				section: 'stakeholders'
			});
		}
	}
};
