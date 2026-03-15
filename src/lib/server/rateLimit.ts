const requests = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();

	if (now - lastCleanup > CLEANUP_INTERVAL) {
		for (const [k, v] of requests) {
			if (now > v.resetTime) requests.delete(k);
		}
		lastCleanup = now;
	}

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
