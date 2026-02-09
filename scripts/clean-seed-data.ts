/**
 * Clean Seed Data
 *
 * Deletes all seed-created data by email pattern (+seed@test.forbetra.com).
 * Uses cascading transaction to avoid foreign key constraint violations.
 *
 * Usage: npx tsx scripts/clean-seed-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { SEED_EMAIL_PATTERN } from './seed-config';

const prisma = new PrismaClient();

async function cleanSeedData() {
	console.log('Clean Seed Data');
	console.log('===============\n');

	const seedUsers = await prisma.user.findMany({
		where: { email: { contains: SEED_EMAIL_PATTERN } },
		include: {
			objectives: {
				include: {
					cycles: {
						include: {
							reflections: { select: { id: true } },
							coachNotes: { select: { id: true } }
						}
					},
					stakeholders: { select: { id: true } },
					subgoals: { select: { id: true } }
				}
			}
		}
	});

	if (seedUsers.length === 0) {
		console.log('No seed data found. Nothing to clean.\n');
		await prisma.$disconnect();
		return;
	}

	console.log(`Found ${seedUsers.length} seed users to remove:\n`);
	for (const user of seedUsers) {
		console.log(`  ${user.name ?? 'Unnamed'} (${user.email}) — ${user.role}`);
	}

	console.log('\nDeleting all related data...');

	await prisma.$transaction(async (tx) => {
		let deletedFeedback = 0;
		let deletedReflections = 0;
		let deletedCoachNotes = 0;
		let deletedCycles = 0;
		let deletedSubgoals = 0;
		let deletedStakeholders = 0;
		let deletedObjectives = 0;
		let deletedCoachClients = 0;
		let deletedCoachInvites = 0;
		let deletedTokens = 0;

		for (const user of seedUsers) {
			for (const objective of user.objectives) {
				for (const cycle of objective.cycles) {
					// Delete feedback on reflections
					for (const reflection of cycle.reflections) {
						const result = await tx.feedback.deleteMany({
							where: { reflectionId: reflection.id }
						});
						deletedFeedback += result.count;
					}

					// Delete reflections
					const reflResult = await tx.reflection.deleteMany({
						where: { cycleId: cycle.id }
					});
					deletedReflections += reflResult.count;

					// Delete coach notes on cycle
					const noteResult = await tx.coachNote.deleteMany({
						where: { cycleId: cycle.id }
					});
					deletedCoachNotes += noteResult.count;
				}

				// Delete cycles
				const cycleResult = await tx.cycle.deleteMany({
					where: { objectiveId: objective.id }
				});
				deletedCycles += cycleResult.count;

				// Delete subgoals
				const sgResult = await tx.subgoal.deleteMany({
					where: { objectiveId: objective.id }
				});
				deletedSubgoals += sgResult.count;

				// Delete stakeholders
				const shResult = await tx.stakeholder.deleteMany({
					where: { objectiveId: objective.id }
				});
				deletedStakeholders += shResult.count;
			}

			// Delete objectives
			const objResult = await tx.objective.deleteMany({
				where: { userId: user.id }
			});
			deletedObjectives += objResult.count;

			// Delete coach-related records
			const ccResult = await tx.coachClient.deleteMany({
				where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
			});
			deletedCoachClients += ccResult.count;

			const ciResult = await tx.coachInvite.deleteMany({
				where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
			});
			deletedCoachInvites += ciResult.count;

			// Delete remaining coach notes (not tied to cycles)
			const cnResult = await tx.coachNote.deleteMany({
				where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
			});
			deletedCoachNotes += cnResult.count;

			// Delete tokens
			const tokenResult = await tx.token.deleteMany({
				where: { userId: user.id }
			});
			deletedTokens += tokenResult.count;

			// Delete user
			await tx.user.delete({ where: { id: user.id } });
		}

		console.log('\nDeleted:');
		console.log(`  Users: ${seedUsers.length}`);
		console.log(`  Objectives: ${deletedObjectives}`);
		console.log(`  Cycles: ${deletedCycles}`);
		console.log(`  Subgoals: ${deletedSubgoals}`);
		console.log(`  Reflections: ${deletedReflections}`);
		console.log(`  Feedback entries: ${deletedFeedback}`);
		console.log(`  Stakeholders: ${deletedStakeholders}`);
		console.log(`  Coach notes: ${deletedCoachNotes}`);
		console.log(`  Coach-client links: ${deletedCoachClients}`);
		console.log(`  Coach invites: ${deletedCoachInvites}`);
		console.log(`  Tokens: ${deletedTokens}`);
	});

	console.log('\nSeed data cleaned successfully.\n');
	await prisma.$disconnect();
}

cleanSeedData().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
