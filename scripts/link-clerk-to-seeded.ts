/**
 * Link Clerk User to Seeded Data
 * 
 * Links a Clerk user (by email) to existing seeded Prisma data.
 * This is useful if a new Prisma user was created instead of linking to seeded data.
 * 
 * Usage:
 *   npx tsx scripts/link-clerk-to-seeded.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
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
		// .env might not exist
	}
}

loadEnv();

const prisma = new PrismaClient();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function linkClerkToSeeded() {
	console.log('🔗 Linking Clerk user to seeded data...\n');

	if (!CLERK_SECRET_KEY) {
		console.error('❌ CLERK_SECRET_KEY not found in environment');
		process.exit(1);
	}

	try {
		// Find the seeded user (has objectives but might not have clerkUserId)
		const seededUser = await prisma.user.findFirst({
			where: {
				email: 'demo+clerk_test@test.forbetra.com',
				objectives: {
					some: {}
				}
			},
			include: {
				objectives: true
			}
		});

		if (!seededUser) {
			console.log('❌ Seeded user with objectives not found.');
			console.log('   Run: npm run seed:test-data');
			return;
		}

		console.log(`✅ Found seeded user: ${seededUser.email}`);
		console.log(`   - Has ${seededUser.objectives.length} objective(s)`);
		console.log(`   - Clerk ID: ${seededUser.clerkUserId || 'NOT SET'}\n`);

		// Get all Clerk users and search for matching email
		console.log('📥 Fetching Clerk users...');
		let clerkUser = null;
		let allClerkUsers: any[] = [];
		let hasMore = true;
		let offset = 0;
		const limit = 500;

		// Fetch all users (handle pagination properly)
		while (hasMore) {
			const url = `https://api.clerk.com/v1/users?limit=${limit}${offset > 0 ? `&offset=${offset}` : ''}`;
			console.log(`   Fetching batch (offset: ${offset})...`);
			
			const clerkResponse = await fetch(url, {
				headers: {
					Authorization: `Bearer ${CLERK_SECRET_KEY}`,
					'Content-Type': 'application/json'
				}
			});

			if (!clerkResponse.ok) {
				const errorText = await clerkResponse.text();
				console.error(`   ❌ API Error: ${clerkResponse.status}`);
				console.error(`   Response: ${errorText}`);
				throw new Error(`Clerk API error: ${clerkResponse.status} - ${errorText}`);
			}

			const clerkData = await clerkResponse.json();
			
			// Debug: log the response structure
			if (offset === 0) {
				console.log(`   Response structure: ${JSON.stringify(Object.keys(clerkData)).slice(0, 200)}...`);
			}
			
			// Clerk API returns users in different structures depending on version
			// Try different possible formats
			let users: any[] = [];
			if (Array.isArray(clerkData)) {
				users = clerkData;
			} else if (Array.isArray(clerkData.data)) {
				users = clerkData.data;
			} else if (Array.isArray(clerkData.users)) {
				users = clerkData.users;
			} else if (clerkData.results && Array.isArray(clerkData.results)) {
				users = clerkData.results;
			}
			
			console.log(`   Found ${users.length} users in this batch`);
			
			if (users.length === 0 && offset === 0) {
				console.log(`   ⚠️  No users found. Full response structure:`);
				console.log(`   ${JSON.stringify(clerkData, null, 2).slice(0, 500)}...`);
			}
			
			allClerkUsers = allClerkUsers.concat(users);

			// Check if we found the user
			const found = users.find((u: any) => {
				const primaryEmailId = u.primary_email_address_id;
				const primaryEmail = u.email_addresses?.find(
					(e: any) => e.id === primaryEmailId
				)?.email_address?.toLowerCase();
				
				// Also check all email addresses
				const allEmails = u.email_addresses?.map((e: any) => e.email_address?.toLowerCase()) || [];
				
				return (
					primaryEmail === seededUser.email.toLowerCase() ||
					allEmails.includes(seededUser.email.toLowerCase())
				);
			});

			if (found) {
				clerkUser = found;
				console.log(`   ✅ Found matching user!`);
				hasMore = false;
				break;
			}

			// Check if we've reached the end
			if (users.length < limit) {
				hasMore = false;
				break;
			}

			offset += limit;
		}
		
		console.log(`\n📊 Total Clerk users fetched: ${allClerkUsers.length}`);

		if (!clerkUser) {
			console.log(`❌ No Clerk user found with email: ${seededUser.email}`);
			if (allClerkUsers.length > 0) {
				console.log(`\n📋 Found ${allClerkUsers.length} Clerk user(s) total:`);
				allClerkUsers.forEach((u: any, i: number) => {
					const primaryEmail = u.email_addresses?.find(
						(e: any) => e.id === u.primary_email_address_id
					)?.email_address || u.email_addresses?.[0]?.email_address || 'N/A';
					console.log(`   ${i + 1}. ${primaryEmail} (ID: ${u.id})`);
				});
			}
			console.log('\n💡 Make sure you signed up in Clerk with: demo+clerk_test@test.forbetra.com');
			console.log('   (Note: "forbetra" not "forbeta")');
			console.log('   Then run this script again.');
			return;
		}
		console.log(`✅ Found Clerk user: ${clerkUser.id}`);
		console.log(`   - Email: ${clerkUser.email_addresses?.[0]?.email_address || 'N/A'}\n`);

		// Check if there's a duplicate Prisma user (created during sign-up)
		const duplicateUser = await prisma.user.findUnique({
			where: { clerkUserId: clerkUser.id }
		});

		if (duplicateUser && duplicateUser.id !== seededUser.id) {
			console.log(`⚠️  Found duplicate Prisma user linked to Clerk (ID: ${duplicateUser.id})`);
			console.log(`   This was likely created during sign-up. Will transfer data...\n`);

			// Transfer objectives from seeded user to duplicate user
			await prisma.objective.updateMany({
				where: { userId: seededUser.id },
				data: { userId: duplicateUser.id }
			});

			// Delete the seeded user (duplicate user now has the data)
			await prisma.user.delete({ where: { id: seededUser.id } });

			console.log(`✅ Transferred objectives to Clerk-linked user`);
			console.log(`   You should now see your data when you sign in!`);
		} else {
			// Link seeded user to Clerk
			await prisma.user.update({
				where: { id: seededUser.id },
				data: { clerkUserId: clerkUser.id }
			});

			console.log(`✅ Linked seeded user to Clerk account`);
			console.log(`   You should now see your data when you sign in!`);
		}
	} catch (error: any) {
		console.error('\n❌ Error:', error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

linkClerkToSeeded().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});

