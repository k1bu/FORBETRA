/**
 * Phone number validation and normalization utilities.
 * Accepts 7–15 digit numbers with optional leading "+".
 */

const DIGITS_ONLY = /\D/g;
const VALID_PHONE = /^\+?\d{7,15}$/;

/** Returns true if `phone` looks like a valid phone number (7–15 digits, optional + prefix). */
export function validatePhone(phone: string): boolean {
	return VALID_PHONE.test(phone.replace(/[\s\-().]/g, ''));
}

/** Strips non-digit characters and returns E.164 format. Auto-prepends +1 for 10-digit US numbers. */
export function normalizePhone(phone: string): string {
	const hasPlus = phone.trimStart().startsWith('+');
	const digits = phone.replace(DIGITS_ONLY, '');
	if (hasPlus) return `+${digits}`;
	if (digits.length === 10) return `+1${digits}`;
	if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
	return `+${digits}`;
}
