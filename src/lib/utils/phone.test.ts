import { describe, it, expect } from 'vitest';
import { validatePhone, normalizePhone } from './phone';

describe('validatePhone', () => {
	it('accepts a 10-digit US number', () => {
		expect(validatePhone('5551234567')).toBe(true);
	});

	it('accepts an international number with + prefix', () => {
		expect(validatePhone('+447911123456')).toBe(true);
	});

	it('accepts numbers with formatting (dashes, parens, spaces)', () => {
		expect(validatePhone('(555) 123-4567')).toBe(true);
		expect(validatePhone('555-123-4567')).toBe(true);
		expect(validatePhone('555 123 4567')).toBe(true);
	});

	it('rejects numbers that are too short', () => {
		expect(validatePhone('123456')).toBe(false);
		expect(validatePhone('12345')).toBe(false);
	});

	it('rejects numbers that are too long', () => {
		expect(validatePhone('1234567890123456')).toBe(false);
	});

	it('rejects empty strings', () => {
		expect(validatePhone('')).toBe(false);
	});
});

describe('normalizePhone', () => {
	it('prepends +1 for 10-digit US numbers', () => {
		expect(normalizePhone('5551234567')).toBe('+15551234567');
	});

	it('prepends + for 11-digit numbers starting with 1', () => {
		expect(normalizePhone('15551234567')).toBe('+15551234567');
	});

	it('preserves + prefix on international numbers', () => {
		expect(normalizePhone('+447911123456')).toBe('+447911123456');
	});

	it('strips formatting characters', () => {
		expect(normalizePhone('(555) 123-4567')).toBe('+15551234567');
		expect(normalizePhone('555.123.4567')).toBe('+15551234567');
	});
});
