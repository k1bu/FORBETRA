/**
 * Sync Prisma Database with Clerk
 * 
 * This script:
 * 1. Fetches all users from Clerk
 * 2. Removes Prisma users that don't exist in Clerk (orphaned records)
 * 3. Updates Prisma users to match Clerk data (email, name)
 * 4. Reports any mismatches
 * 
 * Usage:
 *   npx tsx scripts/sync-clerk-db.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env file
function loadEnv() {
	try {
		const envPath = resolve(process.cwd(), '.env');
		const envContent = readFileSync(envPath, 'utf-8');
		const lines = envContent.split('\n');
		
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const [key, ...valueParts] = trimmed.split('=');
				if (key && valueParts.length > 0) {
					const value = valueParts.join('=').replace(/^["']|["']$/g, '');
					process.env[key.trim()] = value.trim();
				}
			}
		}
	} catch (error) {
		// .env file might not exist, that's okay - use existing env vars
	}
}

loadEnv();

const prisma = new PrismaClient();

// Get Clerk secret key from environment
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
	console.error('❌ CLERK_SECRET_KEY not found in environment variables');
	console.log('   Make sure your .env file contains CLERK_SECRET_KEY');
	process.exit(1);
}

async function syncWithClerk() {
	console.log('🔄 Syncing Prisma database with Clerk...\n');

	try {
		// Fetch all users from Clerk
		console.log('📥 Fetching users from Clerk...');
		const clerkUsersResponse = await fetch('https://api.clerk.com/v1/users?limit=500', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
				'Content-Type': 'application/json'
			}
		});

		if (!clerkUsersResponse.ok) {
			const errorText = await clerkUsersResponse.text();
			throw new Error(`Clerk API error: ${clerkUsersResponse.status} - ${errorText}`);
		}

		const clerkData = await clerkUsersResponse.json();
		const clerkUsers = clerkData.data || [];

		console.log(`   Found ${clerkUsers.length} users in Clerk\n`);

		// Create a map of Clerk user IDs to Clerk user data
		const clerkUserMap = new Map<string, any>();
		const clerkEmailMap = new Map<string, any>();

		for (const clerkUser of clerkUsers) {
			const primaryEmail =
				clerkUser.email_addresses?.find(
					(email: any) => email.id === clerkUser.primary_email_address_id
				)?.email_address ??
				clerkUser.email_addresses?.[0]?.email_address ??
				'';

			if (clerkUser.id) {
				clerkUserMap.set(clerkUser.id, { ...clerkUser, primaryEmail });
			}
			if (primaryEmail) {
				clerkEmailMap.set(primaryEmail.toLowerCase(), { ...clerkUser, primaryEmail });
			}
		}

		// Get all Prisma users
		console.log('📥 Fetching users from Prisma database...');
		const prismaUsers = await prisma.user.findMany({
			include: {
				objectives: true,
				coachNotesAuthored: true,
				coachNotesReceived: true
			}
		});

		console.log(`   Found ${prismaUsers.length} users in Prisma database\n`);

		let updated = 0;
		let deleted = 0;
		let errors = 0;

		// Process each Prisma user
		for (const prismaUser of prismaUsers) {
			if (prismaUser.clerkUserId) {
				// User has Clerk ID - check if it exists in Clerk
				const clerkUser = clerkUserMap.get(prismaUser.clerkUserId);

				if (!clerkUser) {
					// Clerk user doesn't exist - this is an orphaned record
					console.log(`⚠️  Orphaned user found: ${prismaUser.email} (Clerk ID: ${prismaUser.clerkUserId})`);
					
					// Check if user has related data
					const hasData =
						prismaUser.objectives.length > 0 ||
						prismaUser.coachNotesAuthored.length > 0 ||
						prismaUser.coachNotesReceived.length > 0;

					if (hasData) {
						console.log(`   ⚠️  User has related data. Skipping deletion. Manual cleanup may be needed.`);
						errors++;
					} else {
						console.log(`   🗑️  Deleting orphaned user...`);
						try {
							await prisma.user.delete({ where: { id: prismaUser.id } });
							deleted++;
							console.log(`   ✅ Deleted`);
						} catch (error: any) {
							console.error(`   ❌ Failed to delete: ${error.message}`);
							errors++;
						}
					}
				} else {
					// Clerk user exists - sync data
					const fullName =
						[clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ') || null;
					const email = clerkUser.primaryEmail.toLowerCase();

					const needsUpdate =
						prismaUser.email !== email || prismaUser.name !== fullName;

					if (needsUpdate) {
						console.log(`🔄 Updating user: ${prismaUser.email}`);
						try {
							await prisma.user.update({
								where: { id: prismaUser.id },
								data: {
									email,
									name: fullName
								}
							});
							updated++;
							console.log(`   ✅ Updated to: ${email}`);
						} catch (error: any) {
							console.error(`   ❌ Failed to update: ${error.message}`);
							errors++;
						}
					}
				}
			} else {
				// User doesn't have Clerk ID - check if email matches a Clerk user
				const clerkUser = clerkEmailMap.get(prismaUser.email.toLowerCase());

				if (clerkUser) {
					// Found matching Clerk user by email - link them
					console.log(`🔗 Linking user: ${prismaUser.email} to Clerk ID: ${clerkUser.id}`);
					try {
						await prisma.user.update({
							where: { id: prismaUser.id },
							data: {
								clerkUserId: clerkUser.id,
								name: [clerkUser.first_name, clerkUser.last_name]
									.filter(Boolean)
									.join(' ') || prismaUser.name
							}
						});
						updated++;
						console.log(`   ✅ Linked`);
					} catch (error: any) {
						console.error(`   ❌ Failed to link: ${error.message}`);
						errors++;
					}
				} else {
					// No matching Clerk user - this might be a test user or orphaned record
					console.log(`⚠️  User without Clerk link: ${prismaUser.email}`);
					console.log(`   ℹ️  No matching Clerk user found. Keeping in database.`);
				}
			}
		}

		console.log('\n📊 Sync Summary:');
		console.log(`   ✅ Updated: ${updated}`);
		console.log(`   🗑️  Deleted: ${deleted}`);
		console.log(`   ⚠️  Errors: ${errors}`);
		console.log(`   📝 Total processed: ${prismaUsers.length}`);

		if (errors === 0) {
			console.log('\n✅ Sync completed successfully!');
		} else {
			console.log('\n⚠️  Sync completed with errors. Review the output above.');
		}
	} catch (error: any) {
		console.error('❌ Error syncing with Clerk:', error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

syncWithClerk().catch((error) => {
	console.error(error);
	process.exit(1);
});

