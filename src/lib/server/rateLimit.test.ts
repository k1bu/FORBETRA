import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from './rateLimit';

describe('rateLimit', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('allows the first request', () => {
		expect(rateLimit('test-first', 5, 60_000)).toBe(true);
	});

	it('allows requests up to the limit', () => {
		const key = 'test-limit';
		for (let i = 0; i < 5; i++) {
			expect(rateLimit(key, 5, 60_000)).toBe(true);
		}
	});

	it('blocks requests at the limit', () => {
		const key = 'test-block';
		for (let i = 0; i < 3; i++) {
			rateLimit(key, 3, 60_000);
		}
		expect(rateLimit(key, 3, 60_000)).toBe(false);
	});

	it('resets after the time window expires', () => {
		const key = 'test-reset';
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);

		rateLimit(key, 1, 1000);
		expect(rateLimit(key, 1, 1000)).toBe(false);

		// Advance past the window
		vi.spyOn(Date, 'now').mockReturnValue(now + 1001);
		expect(rateLimit(key, 1, 1000)).toBe(true);
	});

	it('tracks independent keys separately', () => {
		const keyA = 'test-key-a';
		const keyB = 'test-key-b';

		rateLimit(keyA, 1, 60_000);
		expect(rateLimit(keyA, 1, 60_000)).toBe(false);
		// Different key should still be allowed
		expect(rateLimit(keyB, 1, 60_000)).toBe(true);
	});
});
