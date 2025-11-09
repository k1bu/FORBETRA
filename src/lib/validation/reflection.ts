import { z } from 'zod';

export const reflectionEntrySchema = z.object({
	subgoalId: z
		.string({ required_error: 'Subgoal is required' })
		.cuid({ message: 'Invalid subgoal' }),
	score: z.coerce
		.number({
			required_error: 'Score is required',
			invalid_type_error: 'Score must be a number'
		})
		.int()
		.min(0, 'Minimum score is 0')
		.max(10, 'Maximum score is 10'),
	notes: z.string().trim().max(1000, 'Keep notes under 1000 characters').optional()
});

export type ReflectionEntryData = z.infer<typeof reflectionEntrySchema>;
