import { describe, it, expect } from 'vitest';
import { findSignificantGaps, buildGapNarrativePrompt } from './gapNarrative';

describe('findSignificantGaps', () => {
	it('returns empty array when no significant gaps', () => {
		const gaps = findSignificantGaps(7, 7, 6, 6.5);
		expect(gaps).toEqual([]);
	});

	it('detects effort gap when self is higher than raters', () => {
		const gaps = findSignificantGaps(8, 7, 5, 7);
		expect(gaps).toHaveLength(1);
		expect(gaps[0].dimension).toBe('effort');
		expect(gaps[0].gap).toBe(3);
	});

	it('detects performance gap when raters are higher than self', () => {
		const gaps = findSignificantGaps(7, 4, 7, 7);
		expect(gaps).toHaveLength(1);
		expect(gaps[0].dimension).toBe('performance');
		expect(gaps[0].gap).toBe(-3);
	});

	it('detects both gaps when both dimensions have large gaps', () => {
		const gaps = findSignificantGaps(9, 3, 5, 7);
		expect(gaps).toHaveLength(2);
	});

	it('returns empty array when scores are null', () => {
		const gaps = findSignificantGaps(null, null, null, null);
		expect(gaps).toEqual([]);
	});

	it('handles exactly-at-threshold gap', () => {
		const gaps = findSignificantGaps(7, 7, 5, 7);
		expect(gaps).toHaveLength(1);
		expect(gaps[0].dimension).toBe('effort');
		expect(gaps[0].gap).toBe(2);
	});

	it('ignores gaps just below threshold', () => {
		const gaps = findSignificantGaps(7, 7, 5.5, 7);
		expect(gaps).toEqual([]);
	});
});

describe('buildGapNarrativePrompt', () => {
	it('includes dimension, scores, and gap in the prompt', () => {
		const prompt = buildGapNarrativePrompt({
			dimension: 'effort',
			selfScore: 8,
			raterAvg: 5,
			gap: 3
		});
		expect(prompt).toContain('effort');
		expect(prompt).toContain('8/10');
		expect(prompt).toContain('5.0/10');
		expect(prompt).toContain('3.0 points');
		expect(prompt).toContain('higher than');
	});

	it('uses "lower than" when raters rate higher', () => {
		const prompt = buildGapNarrativePrompt({
			dimension: 'performance',
			selfScore: 4,
			raterAvg: 7,
			gap: -3
		});
		expect(prompt).toContain('lower than');
	});
});
