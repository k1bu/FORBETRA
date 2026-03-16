import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from './rateLimit';

describe('rateLimit', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('allows the first request', async () => {
		expect(await rateLimit('test-first', 5, 60_000)).toBe(true);
	});

	it('allows requests up to the limit', async () => {
		const key = 'test-limit';
		for (let i = 0; i < 5; i++) {
			expect(await rateLimit(key, 5, 60_000)).toBe(true);
		}
	});

	it('blocks requests at the limit', async () => {
		const key = 'test-block';
		for (let i = 0; i < 3; i++) {
			await rateLimit(key, 3, 60_000);
		}
		expect(await rateLimit(key, 3, 60_000)).toBe(false);
	});

	it('resets after the time window expires', async () => {
		const key = 'test-reset';
		const now = Date.now();
		vi.spyOn(Date, 'now').mockReturnValue(now);

		await rateLimit(key, 1, 1000);
		expect(await rateLimit(key, 1, 1000)).toBe(false);

		// Advance past the window
		vi.spyOn(Date, 'now').mockReturnValue(now + 1001);
		expect(await rateLimit(key, 1, 1000)).toBe(true);
	});

	it('tracks independent keys separately', async () => {
		const keyA = 'test-key-a';
		const keyB = 'test-key-b';

		await rateLimit(keyA, 1, 60_000);
		expect(await rateLimit(keyA, 1, 60_000)).toBe(false);
		// Different key should still be allowed
		expect(await rateLimit(keyB, 1, 60_000)).toBe(true);
	});
});
