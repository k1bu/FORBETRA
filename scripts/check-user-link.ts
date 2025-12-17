/**
 * Check User Link
 *
 * Checks if the seeded users are properly linked to Clerk accounts.
 *
 * Usage:
 *   npx tsx scripts/check-user-link.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserLink() {
	console.log('🔍 Checking user links...\n');

	try {
		const testEmails = [
			'demo+clerk_test@test.forbetra.com',
			'demo@test.forbetra.com',
			'coach+clerk_test@test.forbetra.com',
			'coach@test.forbetra.com'
		];

		for (const email of testEmails) {
			const user = await prisma.user.findUnique({
				where: { email },
				include: {
					objectives: {
						include: {
							cycles: true,
							subgoals: true,
							stakeholders: true
						}
					}
				}
			});

			if (user) {
				console.log(`📧 Found user: ${user.email}`);
				console.log(`   - ID: ${user.id}`);
				console.log(`   - Name: ${user.name || 'N/A'}`);
				console.log(`   - Role: ${user.role}`);
				console.log(`   - Clerk ID: ${user.clerkUserId || '❌ NOT LINKED'}`);
				console.log(`   - Objectives: ${user.objectives.length}`);
				if (user.objectives.length > 0) {
					const obj = user.objectives[0];
					console.log(`     • ${obj.title}`);
					console.log(`       - Cycles: ${obj.cycles.length}`);
					console.log(`       - Subgoals: ${obj.subgoals.length}`);
					console.log(`       - Stakeholders: ${obj.stakeholders.length}`);
				}
				console.log('');
			}
		}

		console.log('💡 If Clerk ID shows "NOT LINKED", sign in via Clerk to auto-link.');
		console.log('   If no user found, run: npm run seed:test-data');
	} catch (error: any) {
		console.error('\n❌ Error:', error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

checkUserLink().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});
