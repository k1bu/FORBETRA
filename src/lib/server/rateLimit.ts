const requests = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();
	const record = requests.get(key);

	if (!record || now > record.resetTime) {
		requests.set(key, { count: 1, resetTime: now + windowMs });
		return true;
	}

	if (record.count >= maxRequests) {
		return false;
	}

	record.count++;
	return true;
}
