import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

declare global {
	var __prisma: PrismaClient | undefined;
}

// Prisma Client configuration with error handling and logging
const prismaClientOptions: Prisma.PrismaClientOptions = {
	log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	errorFormat: 'pretty'
};

// For serverless environments (Vercel), we need to handle connections carefully
const prisma = globalThis.__prisma ?? new PrismaClient(prismaClientOptions);

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
	globalThis.__prisma = prisma;
}

// Handle graceful shutdown
if (process.env.NODE_ENV === 'production') {
	// In production, ensure we disconnect on process termination
	process.on('beforeExit', async () => {
		await prisma.$disconnect();
	});
}

// Helper function to safely execute Prisma queries with error handling
export async function safePrismaQuery<T>(
	queryFn: () => Promise<T>,
	fallback?: T
): Promise<T | null> {
	try {
		return await queryFn();
	} catch (error: any) {
		// Log Prisma-specific errors
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			console.error('[prisma:error] Known request error', {
				code: error.code,
				meta: error.meta,
				message: error.message
			});
		} else if (error instanceof Prisma.PrismaClientValidationError) {
			console.error('[prisma:error] Validation error', {
				message: error.message
			});
		} else if (error instanceof Prisma.PrismaClientInitializationError) {
			console.error('[prisma:error] Initialization error', {
				errorCode: error.errorCode,
				message: error.message
			});
		} else {
			console.error('[prisma:error] Unexpected error', {
				message: error?.message,
				stack: error?.stack
			});
		}

		// Return fallback if provided, otherwise return null
		return fallback ?? null;
	}
}

export default prisma;
