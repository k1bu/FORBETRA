/**
 * Comprehensive Seed Script
 *
 * Creates rich, multi-pattern test data:
 * - 3 coaches
 * - 8 individuals with diverse behavioral patterns
 * - 24 stakeholders with varied feedback bias
 * - 200+ reflections
 * - 500+ feedback entries
 * - 20+ coach notes
 * - Coach-client relationships
 *
 * Usage: npx tsx scripts/seed-comprehensive.ts
 */

import {
	PrismaClient,
	UserRole,
	CycleStatus,
	ReflectionType,
	SubgoalMetric
} from '@prisma/client';
import { COACHES, PERSONAS, SEED_EMAIL_PATTERN } from './seed-config';
import { getScores, applyStakeholderBias, getActiveWeeks } from './seed-patterns';
import { generateCoachNotes } from './seed-coach-notes';

const prisma = new PrismaClient();

async function cleanExistingSeedData() {
	console.log('Cleaning up existing seed data...');

	const seedUsers = await prisma.user.findMany({
		where: { email: { contains: SEED_EMAIL_PATTERN } },
		include: {
			objectives: {
				include: {
					cycles: {
						include: {
							reflections: { include: { feedbacks: true } },
							coachNotes: true
						}
					},
					stakeholders: true,
					subgoals: true
				}
			}
		}
	});

	if (seedUsers.length === 0) {
		console.log('  No existing seed data found.');
		return;
	}

	console.log(`  Found ${seedUsers.length} seed users to clean up...`);

	await prisma.$transaction(async (tx) => {
		for (const user of seedUsers) {
			for (const objective of user.objectives) {
				for (const cycle of objective.cycles) {
					for (const reflection of cycle.reflections) {
						await tx.feedback.deleteMany({ where: { reflectionId: reflection.id } });
					}
					await tx.reflection.deleteMany({ where: { cycleId: cycle.id } });
					await tx.coachNote.deleteMany({ where: { cycleId: cycle.id } });
				}
				await tx.cycle.deleteMany({ where: { objectiveId: objective.id } });
				await tx.subgoal.deleteMany({ where: { objectiveId: objective.id } });
				await tx.stakeholder.deleteMany({ where: { objectiveId: objective.id } });
			}
			await tx.objective.deleteMany({ where: { userId: user.id } });
			await tx.coachClient.deleteMany({
				where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
			});
			await tx.coachNote.deleteMany({
				where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
			});
			await tx.coachInvite.deleteMany({
				where: { OR: [{ coachId: user.id }, { individualId: user.id }] }
			});
			await tx.token.deleteMany({ where: { userId: user.id } });
			await tx.insight.deleteMany({ where: { userId: user.id } });
			await tx.organizationMember.deleteMany({ where: { userId: user.id } });
			await tx.user.delete({ where: { id: user.id } });
		}
	}, { timeout: 60000 });

	console.log(`  Cleaned up ${seedUsers.length} seed users and all related data.`);
}

async function main() {
	console.log('Comprehensive Seed Script');
	console.log('========================\n');

	try {
		// Step 1: Clean existing seed data
		await cleanExistingSeedData();

		// Step 2: Create coaches
		console.log('\nCreating coaches...');
		const coachRecords: Array<{ id: string; email: string; name: string }> = [];

		for (const coachConfig of COACHES) {
			const coach = await prisma.user.create({
				data: {
					email: coachConfig.email,
					name: coachConfig.name,
					role: UserRole.COACH
				}
			});
			coachRecords.push({ id: coach.id, email: coach.email, name: coach.name ?? '' });
			console.log(`  Created coach: ${coachConfig.name} (${coachConfig.email})`);
		}

		// Step 3: Create individuals with full data
		console.log('\nCreating individuals with objectives, cycles, reflections, and feedback...');

		let totalReflections = 0;
		let totalFeedbacks = 0;
		let totalStakeholders = 0;
		let totalCoachNotes = 0;

		const individualRecords: Array<{ id: string; email: string; name: string; index: number }> =
			[];

		for (let i = 0; i < PERSONAS.length; i++) {
			const persona = PERSONAS[i];
			const activeWeeks = getActiveWeeks(persona.pattern);

			console.log(
				`\n  [${i + 1}/${PERSONAS.length}] ${persona.name} (${persona.pattern}, ${activeWeeks} weeks)`
			);

			// Create individual user
			const individual = await prisma.user.create({
				data: {
					email: persona.email,
					name: persona.name,
					role: UserRole.INDIVIDUAL
				}
			});
			individualRecords.push({
				id: individual.id,
				email: individual.email,
				name: individual.name ?? '',
				index: i
			});

			// Create objective with subgoals
			const objective = await prisma.objective.create({
				data: {
					userId: individual.id,
					title: persona.objectiveTitle,
					description: persona.objectiveDescription,
					active: true,
					subgoals: {
						create: persona.subgoals.map((sg, idx) => ({
							label: sg.label,
							description: sg.description,
							metricType: SubgoalMetric.BOTH,
							order: idx + 1
						}))
					}
				},
				include: { subgoals: true }
			});

			// Create cycle
			const cycleStartDate = new Date();
			cycleStartDate.setDate(
				cycleStartDate.getDate() - persona.cycleWeeks * 7
			);
			cycleStartDate.setHours(0, 0, 0, 0);

			const cycleEndDate = new Date(cycleStartDate);
			cycleEndDate.setDate(cycleEndDate.getDate() + persona.cycleWeeks * 7);

			const cycle = await prisma.cycle.create({
				data: {
					userId: individual.id,
					objectiveId: objective.id,
					label: 'Cycle 1',
					startDate: cycleStartDate,
					endDate: cycleEndDate,
					status:
						persona.cycleStatus === 'ACTIVE' ? CycleStatus.ACTIVE : CycleStatus.COMPLETED,
					stakeholderCadence: 'weekly',
					autoThrottle: true
				}
			});

			// Create stakeholders
			const stakeholderRecords = await Promise.all(
				persona.stakeholders.map((sh) =>
					prisma.stakeholder.create({
						data: {
							individualId: individual.id,
							objectiveId: objective.id,
							name: sh.name,
							email: sh.email,
							relationship: sh.relationship
						}
					})
				)
			);
			totalStakeholders += stakeholderRecords.length;

			// Use first subgoal for reflections
			const subgoal = objective.subgoals[0];

			// Generate reflections and feedback for each active week
			for (let week = 1; week <= activeWeeks; week++) {
				const weekStartDate = new Date(cycleStartDate);
				weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);

				const wednesdayDate = new Date(weekStartDate);
				wednesdayDate.setDate(wednesdayDate.getDate() + 2);
				const fridayDate = new Date(weekStartDate);
				fridayDate.setDate(fridayDate.getDate() + 4);

				const scores = getScores(persona.pattern, week);

				// EFFORT reflection (RATING_A)
				await prisma.reflection.create({
					data: {
						cycleId: cycle.id,
						userId: individual.id,
						subgoalId: subgoal.id,
						reflectionType: ReflectionType.RATING_A,
						weekNumber: week,
						checkInDate: wednesdayDate,
						submittedAt: wednesdayDate,
						effortScore: Math.round(scores.effort),
						performanceScore: Math.round(scores.performance * 0.9),
						notes: `Week ${week} mid-week check-in.`
					}
				});
				totalReflections++;

				// PROGRESS reflection (RATING_B)
				const progressReflection = await prisma.reflection.create({
					data: {
						cycleId: cycle.id,
						userId: individual.id,
						subgoalId: subgoal.id,
						reflectionType: ReflectionType.RATING_B,
						weekNumber: week,
						checkInDate: fridayDate,
						submittedAt: fridayDate,
						effortScore: Math.round(scores.effort),
						performanceScore: Math.round(scores.performance),
						notes: `Week ${week} end-of-week reflection.`
					}
				});
				totalReflections++;

				// Stakeholder feedback on the PROGRESS reflection
				const feedbackDate = new Date(fridayDate);
				feedbackDate.setHours(18, 0, 0, 0);

				for (let si = 0; si < persona.stakeholders.length; si++) {
					const stakeholderConfig = persona.stakeholders[si];
					const stakeholderRecord = stakeholderRecords[si];

					const biasedScores = applyStakeholderBias(
						scores,
						stakeholderConfig.bias,
						week,
						si
					);

					// null means sporadic stakeholder didn't respond this week
					if (biasedScores === null) continue;

					const comments = getStakeholderComment(
						stakeholderConfig.bias,
						scores.effort,
						scores.performance,
						week
					);

					await prisma.feedback.create({
						data: {
							reflectionId: progressReflection.id,
							stakeholderId: stakeholderRecord.id,
							effortScore: Math.round(biasedScores.effort),
							performanceScore: Math.round(biasedScores.performance),
							submittedAt: feedbackDate,
							comment: comments
						}
					});
					totalFeedbacks++;
				}
			}

			// Generate coach notes
			const coachNotes = generateCoachNotes(persona.pattern, activeWeeks);
			const coachForIndividual = COACHES.find((c) => c.clientIndices.includes(i));
			const coachRecord = coachForIndividual
				? coachRecords[COACHES.indexOf(coachForIndividual)]
				: null;

			if (coachRecord) {
				for (const note of coachNotes) {
					await prisma.coachNote.create({
						data: {
							coachId: coachRecord.id,
							individualId: individual.id,
							cycleId: cycle.id,
							weekNumber: note.weekNumber,
							content: note.content
						}
					});
					totalCoachNotes++;
				}
			}

			console.log(
				`    Reflections: ${activeWeeks * 3}, Stakeholders: ${stakeholderRecords.length}, Notes: ${coachNotes.length}`
			);
		}

		// Step 4: Create CoachClient relationships
		console.log('\nCreating coach-client relationships...');
		for (let ci = 0; ci < COACHES.length; ci++) {
			const coachConfig = COACHES[ci];
			const coachRecord = coachRecords[ci];

			for (const clientIndex of coachConfig.clientIndices) {
				const individualRecord = individualRecords.find((r) => r.index === clientIndex);
				if (individualRecord) {
					await prisma.coachClient.create({
						data: {
							coachId: coachRecord.id,
							individualId: individualRecord.id
						}
					});
					console.log(
						`  ${coachConfig.name} -> ${individualRecord.name}`
					);
				}
			}
		}

		// Summary
		console.log('\n========================');
		console.log('Seed complete!\n');
		console.log('Summary:');
		console.log(`  Coaches: ${coachRecords.length}`);
		console.log(`  Individuals: ${individualRecords.length}`);
		console.log(`  Stakeholders: ${totalStakeholders}`);
		console.log(`  Reflections: ${totalReflections}`);
		console.log(`  Feedback entries: ${totalFeedbacks}`);
		console.log(`  Coach notes: ${totalCoachNotes}`);
		console.log('\nPersonas:');
		for (const rec of individualRecords) {
			const persona = PERSONAS[rec.index];
			console.log(`  ${rec.name} (${persona.pattern}) — ${rec.email}`);
		}
		console.log('\nCoaches:');
		for (let ci = 0; ci < COACHES.length; ci++) {
			const config = COACHES[ci];
			const clients = config.clientIndices.map((idx) => PERSONAS[idx].name).join(', ');
			console.log(`  ${config.name} — manages: ${clients}`);
		}
	} catch (error: any) {
		console.error('\nError seeding data:', error);
		if (error.code === 'P2002') {
			console.error('  Unique constraint violation. Run seed:clean first.');
		}
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

function getStakeholderComment(
	bias: string,
	effort: number,
	performance: number,
	week: number
): string {
	if (bias === 'positive') {
		const comments = [
			'Really impressed with the progress this week. Keep it up!',
			'Noticeable improvement in how they approach challenges.',
			'Consistently showing up with energy and focus.',
			'I can see the growth happening week over week.',
			'Strong week overall. The effort is paying off.'
		];
		return comments[week % comments.length];
	}
	if (bias === 'neutral') {
		const comments = [
			'Steady week. Some good moments, some room for improvement.',
			'Consistent with previous weeks.',
			'Doing the work. Results are tracking as expected.',
			'Adequate progress. Nothing exceptional but nothing concerning.',
			'On track this week.'
		];
		return comments[week % comments.length];
	}
	if (bias === 'negative') {
		const comments = [
			'Still seeing gaps in follow-through on commitments.',
			'Expected more progress by this point in the cycle.',
			'The effort is there but the execution needs work.',
			'Some areas still need significant improvement.',
			"Not yet seeing the change we discussed. Let's talk."
		];
		return comments[week % comments.length];
	}
	// sporadic
	const comments = [
		'Good week from what I observed.',
		'Hard to comment fully but seems to be making progress.',
		'Mixed signals this week.'
	];
	return comments[week % comments.length];
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
