import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

// ---------- In-memory fallback ----------

const memStore = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function memRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();

	if (now - lastCleanup > CLEANUP_INTERVAL) {
		for (const [k, v] of memStore) {
			if (now > v.resetTime) memStore.delete(k);
		}
		lastCleanup = now;
	}

	const record = memStore.get(key);

	if (!record || now > record.resetTime) {
		memStore.set(key, { count: 1, resetTime: now + windowMs });
		return true;
	}

	if (record.count >= maxRequests) {
		return false;
	}

	record.count++;
	return true;
}

// ---------- Upstash ----------

const upstashInstances = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
	const configKey = `${maxRequests}:${windowMs}`;
	let limiter = upstashInstances.get(configKey);
	if (!limiter) {
		limiter = new Ratelimit({
			redis: new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! }),
			limiter: Ratelimit.slidingWindow(maxRequests, `${Math.round(windowMs / 1000)} s`),
			prefix: 'forbetra_rl'
		});
		upstashInstances.set(configKey, limiter);
	}
	return limiter;
}

// ---------- Facade ----------

export async function rateLimit(
	key: string,
	maxRequests: number,
	windowMs: number
): Promise<boolean> {
	if (!useUpstash) {
		return memRateLimit(key, maxRequests, windowMs);
	}

	try {
		const limiter = getUpstashLimiter(maxRequests, windowMs);
		const result = await limiter.limit(key);
		return result.success;
	} catch (err) {
		console.error('[rateLimit] Upstash error, falling back to in-memory', err);
		return memRateLimit(key, maxRequests, windowMs);
	}
}
