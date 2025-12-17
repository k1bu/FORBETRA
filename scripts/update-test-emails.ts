/**
 * Update Test User Emails
 * 
 * Updates existing test user emails to use +clerk_test alias for Clerk verification.
 * 
 * Usage:
 *   npx tsx scripts/update-test-emails.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTestEmails() {
	console.log('🔄 Updating test user emails...\n');

	try {
		// Update demo user
		const demoResult = await prisma.user.updateMany({
			where: { email: 'demo@test.forbetra.com' },
			data: { email: 'demo+clerk_test@test.forbetra.com' }
		});
		console.log(`✅ Updated ${demoResult.count} demo user(s)`);

		// Update coach user
		const coachResult = await prisma.user.updateMany({
			where: { email: 'coach@test.forbetra.com' },
			data: { email: 'coach+clerk_test@test.forbetra.com' }
		});
		console.log(`✅ Updated ${coachResult.count} coach user(s)`);

		console.log('\n✅ Email update complete!');
		console.log('\n📧 Updated emails:');
		console.log('   - demo@test.forbetra.com → demo+clerk_test@test.forbetra.com');
		console.log('   - coach@test.forbetra.com → coach+clerk_test@test.forbetra.com');
		console.log('\n💡 You can now sign up in Clerk with these emails and use the default verification code.');
	} catch (error: any) {
		console.error('\n❌ Error updating emails:', error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

updateTestEmails().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});

