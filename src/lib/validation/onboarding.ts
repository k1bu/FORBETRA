import { z } from 'zod';

export const onboardingSchema = z
	.object({
		objectiveTitle: z
			.string({ required_error: 'Objective title is required' })
			.trim()
			.min(3, 'Objective title must be at least 3 characters'),
		objectiveDescription: z
			.string()
			.trim()
			.max(1000, 'Keep the description under 1000 characters')
			.optional(),
		subgoalLabel: z
			.string({ required_error: 'Subgoal label is required' })
			.trim()
			.min(3, 'Subgoal label must be at least 3 characters'),
		subgoalDescription: z.string().trim().max(500, 'Subgoal description too long').optional(),
		stakeholderName: z.string().trim().max(120, 'Stakeholder name too long').optional(),
		stakeholderEmail: z.string().trim().email('Stakeholder email must be valid').optional(),
		stakeholderRelationship: z
			.string()
			.trim()
			.max(120, 'Relationship description too long')
			.optional(),
		cycleLabel: z.string().trim().max(80, 'Cycle label is too long').optional(),
		cycleStartDate: z
			.string({ required_error: 'Start date is required' })
			.refine((value) => !Number.isNaN(Date.parse(value)), 'Provide a valid start date'),
		cycleDurationWeeks: z.coerce
			.number({
				required_error: 'Select a cycle length',
				invalid_type_error: 'Cycle length must be a number'
			})
			.int()
			.min(4, 'Pick at least 4 weeks')
			.max(16, 'Keep cycles to 16 weeks or fewer')
	})
	.refine(
		(data) => {
			if (!data.stakeholderEmail && !data.stakeholderName && !data.stakeholderRelationship) {
				return true;
			}

			return Boolean(data.stakeholderEmail && data.stakeholderName);
		},
		{
			message: 'Provide both name and email when adding a stakeholder',
			path: ['stakeholderName']
		}
	);

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
