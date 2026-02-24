/**
 * Parse check-in frequency string to array of day names.
 * Handles legacy format (3x/2x/1x) and new comma-separated format.
 */
export function parseCheckInDays(frequency: string): string[] {
	if (frequency === '3x') return ['mon', 'wed', 'fri'];
	if (frequency === '2x') return ['tue', 'fri'];
	if (frequency === '1x') return ['fri'];
	const days = frequency.split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0);
	return days.length > 0 ? days : ['fri'];
}
