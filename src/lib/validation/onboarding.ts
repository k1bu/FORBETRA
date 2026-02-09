import { z } from 'zod';

const subgoalSchema = z.object({
	label: z.string().trim().min(3, 'Subgoal label must be at least 3 characters').max(200, 'Keep the subgoal label concise'),
	description: z.string().trim().max(500, 'Keep the subgoal details under 500 characters').optional()
});

const stakeholderSchema = z.object({
	name: z.string().trim().min(1, 'Stakeholder name is required').max(120, 'Stakeholder name too long'),
	email: z.string().trim().min(1, 'Stakeholder email is required').email('Stakeholder email must be valid'),
	relationship: z.string().trim().max(120, 'Relationship description too long').optional()
});

export const onboardingSchema = z.object({
	objectiveTitle: z
		.string()
		.trim()
		.min(3, 'Objective title must be at least 3 characters')
		.max(200, 'Keep the objective title concise'),
	objectiveDescription: z.string().trim().max(1000, 'Keep the description under 1000 characters').optional(),
	subgoals: z.array(subgoalSchema).min(1, 'Add at least one subgoal').max(5, 'Keep it to five subgoals or fewer'),
	stakeholders: z.array(stakeholderSchema).max(5, 'Add up to five stakeholders').optional().default([]),
	cycleLabel: z.string().trim().max(80, 'Cycle label is too long').optional(),
	cycleStartDate: z
		.string()
		.refine((value) => value.length > 0, 'Start date is required')
		.refine((value) => !Number.isNaN(Date.parse(value)), 'Provide a valid start date'),
	cycleDurationWeeks: z
		.number()
		.refine((value) => Number.isFinite(value), 'Select a cycle length')
		.int()
		.min(4, 'Pick at least 4 weeks')
		.max(26, 'Keep cycles to 26 weeks or fewer'),
	checkInFrequency: z.enum(['3x', '2x', '1x']).optional().default('3x'),
	stakeholderCadence: z.enum(['weekly', 'biweekly']).optional().default('weekly')
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
