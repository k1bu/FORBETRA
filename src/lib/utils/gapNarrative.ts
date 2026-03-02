/**
 * Perception gap analysis utilities.
 * Identifies significant gaps (>= 2 points) between self-ratings and rater averages.
 */

export type PerceptionGap = {
	dimension: 'effort' | 'performance';
	selfScore: number;
	raterAvg: number;
	gap: number;
};

/**
 * Returns an array of significant perception gaps (|gap| >= threshold).
 * Returns empty array if no significant gaps exist.
 */
export function findSignificantGaps(
	selfEffort: number | null | undefined,
	selfPerformance: number | null | undefined,
	raterEffortAvg: number | null | undefined,
	raterPerformanceAvg: number | null | undefined,
	threshold = 2
): PerceptionGap[] {
	const gaps: PerceptionGap[] = [];

	if (selfEffort != null && raterEffortAvg != null) {
		const gap = selfEffort - raterEffortAvg;
		if (Math.abs(gap) >= threshold) {
			gaps.push({ dimension: 'effort', selfScore: selfEffort, raterAvg: raterEffortAvg, gap });
		}
	}

	if (selfPerformance != null && raterPerformanceAvg != null) {
		const gap = selfPerformance - raterPerformanceAvg;
		if (Math.abs(gap) >= threshold) {
			gaps.push({
				dimension: 'performance',
				selfScore: selfPerformance,
				raterAvg: raterPerformanceAvg,
				gap
			});
		}
	}

	return gaps;
}

/**
 * Builds the AI prompt for generating a gap narrative.
 */
export function buildGapNarrativePrompt(gap: PerceptionGap): string {
	const direction = gap.gap > 0 ? 'higher than' : 'lower than';
	return `The participant rated their ${gap.dimension} as ${gap.selfScore}/10. Their raters averaged ${gap.raterAvg.toFixed(1)}/10 — a gap of ${Math.abs(gap.gap).toFixed(1)} points (self is ${direction} raters).

In exactly 2 sentences:
(1) What might this gap mean in terms of observable workplace behavior?
(2) What is one specific, actionable thing they could try this week?`;
}
