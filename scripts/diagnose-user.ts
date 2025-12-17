/**
 * Diagnose User Account
 *
 * Checks a specific user's account status and potential issues.
 *
 * Usage:
 *   npx tsx scripts/diagnose-user.ts sagal@cox.net
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseUser(email: string) {
	console.log(`🔍 Diagnosing user account: ${email}\n`);

	try {
		// Check if user exists by email
		const userByEmail = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
			include: {
				objectives: {
					include: {
						cycles: true,
						subgoals: true,
						stakeholders: true
					}
				},
				coachInvitationsLinked: {
					where: {
						acceptedAt: null,
						cancelledAt: null,
						expiresAt: {
							gt: new Date()
						}
					}
				}
			}
		});

		if (!userByEmail) {
			console.log('❌ User not found in database by email');
			console.log('\n💡 This user may need to sign up first.');
			return;
		}

		console.log('✅ User found in database:');
		console.log(`   - ID: ${userByEmail.id}`);
		console.log(`   - Name: ${userByEmail.name || 'N/A'}`);
		console.log(`   - Email: ${userByEmail.email}`);
		console.log(`   - Role: ${userByEmail.role}`);
		console.log(`   - Clerk User ID: ${userByEmail.clerkUserId || '❌ NOT LINKED'}`);
		console.log(`   - Created: ${userByEmail.createdAt}`);
		console.log(`   - Updated: ${userByEmail.updatedAt}`);
		console.log(`   - Objectives: ${userByEmail.objectives.length}`);
		console.log(`   - Pending Coach Invites: ${userByEmail.coachInvitationsLinked.length}`);

		// Check for potential issues
		const issues: string[] = [];

		if (!userByEmail.clerkUserId) {
			issues.push('⚠️  User is not linked to a Clerk account - this will cause login issues');
		}

		// Check if there's another user with the same clerkUserId (shouldn't happen, but check)
		if (userByEmail.clerkUserId) {
			const duplicateClerkUser = await prisma.user.findFirst({
				where: {
					clerkUserId: userByEmail.clerkUserId,
					id: { not: userByEmail.id }
				}
			});

			if (duplicateClerkUser) {
				issues.push(
					`⚠️  Another user (${duplicateClerkUser.email}) has the same Clerk ID - this will cause conflicts`
				);
			}
		}

		// Check if there's another user with the same email but different ID (shouldn't happen due to unique constraint)
		const duplicateEmailUser = await prisma.user.findFirst({
			where: {
				email: userByEmail.email.toLowerCase(),
				id: { not: userByEmail.id }
			}
		});

		if (duplicateEmailUser) {
			issues.push(
				`⚠️  Duplicate user found with same email but different ID - database constraint violation!`
			);
		}

		// Check for problematic coach invites
		if (userByEmail.coachInvitationsLinked.length > 0) {
			console.log('\n📋 Pending coach invites:');
			for (const invite of userByEmail.coachInvitationsLinked) {
				console.log(`   - Invite ID: ${invite.id}, Expires: ${invite.expiresAt}`);
			}
		}

		if (issues.length > 0) {
			console.log('\n⚠️  POTENTIAL ISSUES FOUND:');
			issues.forEach((issue) => console.log(`   ${issue}`));
		} else {
			console.log('\n✅ No obvious issues found in database');
		}

		console.log('\n💡 Next steps:');
		if (!userByEmail.clerkUserId) {
			console.log('   1. User needs to sign in via Clerk to auto-link');
			console.log('   2. Or run: npx tsx scripts/link-clerk-to-seeded.ts');
		} else {
			console.log('   1. Check Vercel logs for the actual error during login');
			console.log('   2. Verify the Clerk account exists and matches this clerkUserId');
			console.log('   3. Check if there are any database constraint violations');
		}
	} catch (error: any) {
		console.error('\n❌ Error:', error.message);
		console.error('   Stack:', error.stack);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

const email = process.argv[2];

if (!email) {
	console.error('❌ Please provide an email address');
	console.log('Usage: npx tsx scripts/diagnose-user.ts <email>');
	process.exit(1);
}

diagnoseUser(email).catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});
