/**
 * Delete Test Users
 *
 * Deletes coach@test.forbetra.com and user@test.forbetra.com
 * and all their associated data from the database.
 *
 * Usage:
 *   npx tsx scripts/delete-test-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_EMAILS = ['coach@test.forbetra.com', 'user@test.forbetra.com'];

async function deleteTestUsers() {
	console.log('🗑️  Deleting test users and all associated data...\n');

	for (const email of TEST_EMAILS) {
		try {
			console.log(`\n📧 Processing: ${email}`);

			const user = await prisma.user.findUnique({
				where: { email: email.toLowerCase() },
				include: {
					objectives: true,
					coachNotesAuthored: true,
					coachNotesReceived: true
				}
			});

			if (!user) {
				console.log(`   ⚠️  User not found, skipping...`);
				continue;
			}

			console.log(`   📝 Found user: ${user.name || 'Unnamed'} (ID: ${user.id})`);

			// Delete related records first to avoid foreign key constraints
			await prisma.$transaction(async (tx) => {
				// Get all cycles for this user's objectives
				const objectiveIds = user.objectives.map((o) => o.id);
				const cycles = await tx.cycle.findMany({
					where: { objectiveId: { in: objectiveIds } }
				});
				const cycleIds = cycles.map((c) => c.id);

				// Get all reflections linked to cycles
				const reflections = await tx.reflection.findMany({
					where: { cycleId: { in: cycleIds } }
				});
				const reflectionIds = reflections.map((r) => r.id);

				console.log(`   🗑️  Deleting ${reflectionIds.length} feedback records...`);
				// Delete feedback linked to reflections
				await tx.feedback.deleteMany({
					where: { reflectionId: { in: reflectionIds } }
				});

				console.log(`   🗑️  Deleting ${reflectionIds.length} reflection records...`);
				// Delete reflections
				await tx.reflection.deleteMany({
					where: { cycleId: { in: cycleIds } }
				});

				console.log(`   🗑️  Deleting ${cycleIds.length} cycle records...`);
				// Delete cycles
				await tx.cycle.deleteMany({ where: { objectiveId: { in: objectiveIds } } });

				console.log(`   🗑️  Deleting subgoals...`);
				// Delete subgoals linked to objectives
				await tx.subgoal.deleteMany({ where: { objectiveId: { in: objectiveIds } } });

				console.log(`   🗑️  Deleting ${objectiveIds.length} objective records...`);
				// Delete objectives
				await tx.objective.deleteMany({ where: { userId: user.id } });

				console.log(`   🗑️  Deleting coach notes...`);
				// Delete coach notes
				await tx.coachNote.deleteMany({
					where: {
						OR: [{ coachId: user.id }, { individualId: user.id }]
					}
				});

				console.log(`   🗑️  Deleting coach-client relationships...`);
				// Delete other related records
				await tx.coachClient.deleteMany({
					where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
				});

				console.log(`   🗑️  Deleting coach invites...`);
				await tx.coachInvite.deleteMany({
					where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
				});

				console.log(`   🗑️  Deleting stakeholders...`);
				await tx.stakeholder.deleteMany({
					where: { OR: [{ individualId: user.id }, { invitedById: user.id }] }
				});

				console.log(`   🗑️  Deleting tokens...`);
				await tx.token.deleteMany({ where: { userId: user.id } });

				console.log(`   🗑️  Deleting user record...`);
				// Finally delete the user
				await tx.user.delete({ where: { id: user.id } });
			});

			console.log(`   ✅ Successfully deleted ${email}`);
		} catch (error: unknown) {
			console.error(`   ❌ Error deleting ${email}:`, (error as Error).message);
			if ((error as Record<string, unknown>).code === 'P2003') {
				console.error(`   ⚠️  Foreign key constraint error. There may be additional related data.`);
			}
		}
	}

	console.log('\n✅ Test user deletion complete!');
}

deleteTestUsers()
	.catch((error) => {
		console.error('❌ Fatal error:', error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
