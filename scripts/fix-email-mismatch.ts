/**
 * Fix Email Mismatch
 *
 * Updates the seeded user's email to match what's actually in Clerk.
 *
 * Usage:
 *   npx tsx scripts/fix-email-mismatch.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEmailMismatch() {
	console.log('🔧 Fixing email mismatch...\n');

	try {
		// Update seeded user to match Clerk email
		const result = await prisma.user.updateMany({
			where: { email: 'demo+clerk_test@test.forbetra.com' },
			data: { email: 'demo+clerk_test@test.forbeta.com' }
		});

		console.log(`✅ Updated ${result.count} user(s)`);
		console.log(`   Changed: demo+clerk_test@test.forbetra.com`);
		console.log(`   To:      demo+clerk_test@test.forbeta.com`);
		console.log('\n💡 Now run the linking script again:');
		console.log('   npx tsx scripts/link-clerk-to-seeded.ts');
	} catch (error: any) {
		console.error('\n❌ Error:', error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

fixEmailMismatch().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});
