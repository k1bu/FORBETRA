import { z } from 'zod';

const subgoalSchema = z.object({
	label: z
		.string()
		.trim()
		.min(3, 'Sub-objective label must be at least 3 characters')
		.max(200, 'Keep the sub-objective label concise'),
	description: z
		.string()
		.trim()
		.max(500, 'Keep the sub-objective details under 500 characters')
		.optional()
});

const stakeholderSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Stakeholder name is required')
		.max(120, 'Stakeholder name too long'),
	email: z
		.string()
		.trim()
		.min(1, 'Stakeholder email is required')
		.email('Stakeholder email must be valid'),
	relationship: z.string().trim().max(120, 'Relationship description too long').optional()
});

export const onboardingSchema = z.object({
	objectiveTitle: z
		.string()
		.trim()
		.min(3, 'Objective title must be at least 3 characters')
		.max(200, 'Keep the objective title concise'),
	objectiveDescription: z
		.string()
		.trim()
		.max(1000, 'Keep the description under 1000 characters')
		.optional(),
	subgoals: z
		.array(subgoalSchema)
		.min(1, 'Add at least one sub-objective')
		.max(5, 'Keep it to five sub-objectives or fewer'),
	stakeholders: z
		.array(stakeholderSchema)
		.max(5, 'Add up to five stakeholders')
		.optional()
		.default([]),
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
	checkInFrequency: z
		.string()
		.min(1, 'Select at least one check-in day')
		.optional()
		.default('tue,fri'),
	stakeholderCadence: z
		.string()
		.refine(
			(val) => ['weekly', 'biweekly'].includes(val) || /^custom:\d+$/.test(val),
			'Stakeholder cadence must be weekly, biweekly, or custom:N'
		)
		.optional()
		.default('weekly')
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
