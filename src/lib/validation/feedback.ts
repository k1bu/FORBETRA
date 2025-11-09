import { z } from 'zod';

export const stakeholderFeedbackSchema = z
	.object({
		token: z.string({ required_error: 'Feedback token is required' }).length(64, 'Invalid token'),
		effortScore: z.coerce
			.number({ invalid_type_error: 'Provide a number between 0 and 10' })
			.int()
			.min(0, 'Minimum score is 0')
			.max(10, 'Maximum score is 10')
			.optional(),
		progressScore: z.coerce
			.number({ invalid_type_error: 'Provide a number between 0 and 10' })
			.int()
			.min(0, 'Minimum score is 0')
			.max(10, 'Maximum score is 10')
			.optional(),
		comment: z.string().trim().max(2000, 'Keep comments under 2000 characters').optional()
	})
	.refine((data) => Boolean(data.effortScore ?? data.progressScore ?? data.comment), {
		message: 'Provide at least one score or a comment.',
		path: ['comment']
	});

export type StakeholderFeedbackData = z.infer<typeof stakeholderFeedbackSchema>;
