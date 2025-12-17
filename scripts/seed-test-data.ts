/**
 * Seed Test Data - Complete 12 Week Cycle
 *
 * Creates a test individual with a complete 12-week cycle including:
 * - Full objective and subgoals
 * - 3 stakeholders (positive, neutral, negative feedback patterns)
 * - All 12 weeks of reflections (INTENTION, EFFORT, PROGRESS)
 * - Stakeholder feedback for each week with varying patterns
 * - Links to test coach (coach@test.forbetra.com)
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 */

import { PrismaClient, UserRole, CycleStatus, ReflectionType, SubgoalMetric } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_COACH_EMAIL = 'coach+clerk_test@test.forbetra.com';
const TEST_INDIVIDUAL_EMAIL = 'demo+clerk_test@test.forbetra.com';

// Generate realistic data patterns (0-10 scale)
function generateIndividualEffort(week: number): number {
	// Start lower, build up over time with some variation
	const base = 5 + week * 0.3; // Start around 5, build to ~8.5
	const variation = Math.sin(week * 0.5) * 1.5 + (Math.random() * 1 - 0.5);
	return Math.max(0, Math.min(10, Math.round((base + variation) * 10) / 10));
}

function generateIndividualProgress(week: number): number {
	// Steady upward trend with variation
	const base = 4 + week * 0.4; // Start around 4, build to ~8.8
	const variation = Math.cos(week * 0.4) * 1.2 + (Math.random() * 0.8 - 0.4);
	return Math.max(0, Math.min(10, Math.round((base + variation) * 10) / 10));
}

// Positive stakeholder - generally rates higher, sees more progress
function generatePositiveStakeholderFeedback(
	individualEffort: number,
	individualProgress: number
): { effort: number; progress: number } {
	const effortOffset = 1 + Math.random() * 1; // +1 to +2
	const progressOffset = 1.5 + Math.random() * 1.2; // +1.5 to +2.7
	return {
		effort: Math.max(0, Math.min(10, Math.round((individualEffort + effortOffset) * 10) / 10)),
		progress: Math.max(0, Math.min(10, Math.round((individualProgress + progressOffset) * 10) / 10))
	};
}

// Neutral stakeholder - rates close to individual, slight variation
function generateNeutralStakeholderFeedback(
	individualEffort: number,
	individualProgress: number
): { effort: number; progress: number } {
	const effortOffset = -0.6 + Math.random() * 1.2; // -0.6 to +0.6
	const progressOffset = -0.4 + Math.random() * 0.8; // -0.4 to +0.4
	return {
		effort: Math.max(0, Math.min(10, Math.round((individualEffort + effortOffset) * 10) / 10)),
		progress: Math.max(0, Math.min(10, Math.round((individualProgress + progressOffset) * 10) / 10))
	};
}

// Negative stakeholder - generally rates lower, sees less progress
function generateNegativeStakeholderFeedback(
	individualEffort: number,
	individualProgress: number
): { effort: number; progress: number } {
	const effortOffset = -0.8 - Math.random() * 1; // -0.8 to -1.8
	const progressOffset = -1 - Math.random() * 1.4; // -1 to -2.4
	return {
		effort: Math.max(0, Math.min(10, Math.round((individualEffort + effortOffset) * 10) / 10)),
		progress: Math.max(0, Math.min(10, Math.round((individualProgress + progressOffset) * 10) / 10))
	};
}

async function seedTestData() {
	console.log('🌱 Seeding test data for visualization preview...\n');

	try {
		// Step 1: Find or create test coach
		console.log('👤 Setting up test coach...');
		let coach = await prisma.user.findUnique({
			where: { email: TEST_COACH_EMAIL }
		});

		if (!coach) {
			console.log('   Creating new test coach...');
			coach = await prisma.user.create({
				data: {
					email: TEST_COACH_EMAIL,
					name: 'Test Coach',
					role: UserRole.COACH
				}
			});
			console.log(`   ✅ Created coach: ${coach.email}`);
		} else {
			console.log(`   ✅ Found existing coach: ${coach.email}`);
		}

		// Step 2: Clean up existing demo individual if it exists
		console.log('\n🧹 Cleaning up existing demo individual...');
		const existingIndividual = await prisma.user.findUnique({
			where: { email: TEST_INDIVIDUAL_EMAIL },
			include: {
				objectives: {
					include: {
						cycles: {
							include: {
								reflections: {
									include: {
										feedbacks: true
									}
								}
							}
						},
						stakeholders: true,
						subgoals: true
					}
				}
			}
		});

		if (existingIndividual) {
			console.log('   Deleting existing demo individual and all related data...');
			await prisma.$transaction(async (tx) => {
				for (const objective of existingIndividual.objectives) {
					for (const cycle of objective.cycles) {
						for (const reflection of cycle.reflections) {
							await tx.feedback.deleteMany({ where: { reflectionId: reflection.id } });
						}
						await tx.reflection.deleteMany({ where: { cycleId: cycle.id } });
					}
					await tx.cycle.deleteMany({ where: { objectiveId: objective.id } });
					await tx.subgoal.deleteMany({ where: { objectiveId: objective.id } });
					await tx.stakeholder.deleteMany({ where: { objectiveId: objective.id } });
				}
				await tx.objective.deleteMany({ where: { userId: existingIndividual.id } });
				await tx.coachClient.deleteMany({ where: { individualId: existingIndividual.id } });
				await tx.coachNote.deleteMany({ where: { individualId: existingIndividual.id } });
				await tx.user.delete({ where: { id: existingIndividual.id } });
			});
			console.log('   ✅ Cleaned up existing data');
		}

		// Step 3: Create test individual
		console.log('\n👤 Creating test individual...');
		const individual = await prisma.user.create({
			data: {
				email: TEST_INDIVIDUAL_EMAIL,
				name: 'Demo User',
				role: UserRole.INDIVIDUAL
			}
		});
		console.log(`   ✅ Created individual: ${individual.email}`);

		// Step 4: Link to coach
		console.log('\n🔗 Linking individual to coach...');
		await prisma.coachClient.create({
			data: {
				coachId: coach.id,
				individualId: individual.id
			}
		});
		console.log('   ✅ Linked to coach');

		// Step 5: Create objective and subgoals
		console.log('\n🎯 Creating objective and subgoals...');
		const objective = await prisma.objective.create({
			data: {
				userId: individual.id,
				title: 'Improve Communication Clarity',
				description:
					'Enhance communication skills to be more clear and effective in professional interactions',
				active: true,
				subgoals: {
					create: [
						{
							label: 'Listen actively in meetings',
							description: 'Practice active listening and ask clarifying questions',
							metricType: SubgoalMetric.BOTH,
							order: 1
						},
						{
							label: 'Provide clear updates',
							description: 'Give concise, structured updates to team members',
							metricType: SubgoalMetric.BOTH,
							order: 2
						},
						{
							label: 'Reduce ambiguity in requests',
							description: 'Be specific and clear when making requests or delegating',
							metricType: SubgoalMetric.BOTH,
							order: 3
						}
					]
				}
			},
			include: {
				subgoals: true
			}
		});
		console.log(`   ✅ Created objective: ${objective.title}`);
		console.log(`   ✅ Created ${objective.subgoals.length} subgoals`);

		// Step 6: Create 3 stakeholders
		console.log('\n👥 Creating stakeholders...');
		const stakeholders = await Promise.all([
			prisma.stakeholder.create({
				data: {
					individualId: individual.id,
					objectiveId: objective.id,
					name: 'Sarah Chen',
					email: 'sarah.positive@test.forbetra.com',
					relationship: 'Team Lead'
				}
			}),
			prisma.stakeholder.create({
				data: {
					individualId: individual.id,
					objectiveId: objective.id,
					name: 'Mike Johnson',
					email: 'mike.neutral@test.forbetra.com',
					relationship: 'Colleague'
				}
			}),
			prisma.stakeholder.create({
				data: {
					individualId: individual.id,
					objectiveId: objective.id,
					name: 'Alex Rivera',
					email: 'alex.negative@test.forbetra.com',
					relationship: 'Manager'
				}
			})
		]);
		console.log(`   ✅ Created ${stakeholders.length} stakeholders`);
		console.log(`      - ${stakeholders[0].name} (Positive feedback pattern)`);
		console.log(`      - ${stakeholders[1].name} (Neutral feedback pattern)`);
		console.log(`      - ${stakeholders[2].name} (Negative feedback pattern)`);

		// Step 7: Create 12-week cycle
		console.log('\n📅 Creating 12-week cycle...');
		const cycleStartDate = new Date();
		cycleStartDate.setDate(cycleStartDate.getDate() - 12 * 7); // 12 weeks ago
		cycleStartDate.setHours(0, 0, 0, 0);

		const cycleEndDate = new Date(cycleStartDate);
		cycleEndDate.setDate(cycleEndDate.getDate() + 12 * 7);

		const cycle = await prisma.cycle.create({
			data: {
				userId: individual.id,
				objectiveId: objective.id,
				label: 'Cycle 1',
				startDate: cycleStartDate,
				endDate: cycleEndDate,
				status: CycleStatus.COMPLETED
			}
		});
		console.log(
			`   ✅ Created cycle: ${cycle.label} (${cycleStartDate.toISOString().split('T')[0]} to ${cycleEndDate.toISOString().split('T')[0]})`
		);

		// Step 8: Create reflections and feedback for all 12 weeks
		console.log('\n📝 Generating reflections and feedback...');

		const subgoal = objective.subgoals[0]; // Use first subgoal for all reflections
		let totalReflections = 0;
		let totalFeedbacks = 0;

		for (let week = 1; week <= 12; week++) {
			// Calculate dates for this week
			const weekStartDate = new Date(cycleStartDate);
			weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);

			const mondayDate = new Date(weekStartDate);
			const wednesdayDate = new Date(weekStartDate);
			wednesdayDate.setDate(wednesdayDate.getDate() + 2);
			const fridayDate = new Date(weekStartDate);
			fridayDate.setDate(fridayDate.getDate() + 4);

			// Generate individual scores for this week
			const individualEffort = generateIndividualEffort(week);
			const individualProgress = generateIndividualProgress(week);

			// Create Week 1 INTENTION (identity anchor)
			if (week === 1) {
				await prisma.reflection.create({
					data: {
						cycleId: cycle.id,
						userId: individual.id,
						subgoalId: subgoal.id,
						reflectionType: ReflectionType.INTENTION,
						weekNumber: week,
						checkInDate: mondayDate,
						submittedAt: mondayDate,
						notes:
							"I'm choosing to become someone who communicates with clarity and confidence, making sure my message is understood and respected."
					}
				});
				totalReflections++;
			}

			// Create EFFORT reflection (both scores captured, but effort is primary)
			const effortReflection = await prisma.reflection.create({
				data: {
					cycleId: cycle.id,
					userId: individual.id,
					subgoalId: subgoal.id,
					reflectionType: ReflectionType.EFFORT,
					weekNumber: week,
					checkInDate: wednesdayDate,
					submittedAt: wednesdayDate,
					effortScore: Math.round(individualEffort),
					progressScore: Math.round(individualProgress * 0.9), // Slightly lower early in week
					notes: `Week ${week} effort check-in`
				}
			});
			totalReflections++;

			// Create PROGRESS reflection (both scores captured, but progress is primary)
			const progressReflection = await prisma.reflection.create({
				data: {
					cycleId: cycle.id,
					userId: individual.id,
					subgoalId: subgoal.id,
					reflectionType: ReflectionType.PROGRESS,
					weekNumber: week,
					checkInDate: fridayDate,
					submittedAt: fridayDate,
					effortScore: Math.round(individualEffort),
					progressScore: Math.round(individualProgress),
					notes: `Week ${week} progress check-in`
				}
			});
			totalReflections++;

			// Generate stakeholder feedback for this week's reflections
			// Use PROGRESS reflection as the basis (most stakeholders see the week-end reflection)
			const positiveFeedback = generatePositiveStakeholderFeedback(
				individualEffort,
				individualProgress
			);
			const neutralFeedback = generateNeutralStakeholderFeedback(
				individualEffort,
				individualProgress
			);
			const negativeFeedback = generateNegativeStakeholderFeedback(
				individualEffort,
				individualProgress
			);

			// Create feedback from each stakeholder (usually tied to PROGRESS reflection, but we'll use both)
			const feedbackDate = new Date(fridayDate);
			feedbackDate.setHours(18, 0, 0, 0); // End of day Friday

			// Positive stakeholder feedback
			await prisma.feedback.create({
				data: {
					reflectionId: progressReflection.id,
					stakeholderId: stakeholders[0].id,
					effortScore: Math.round(positiveFeedback.effort),
					progressScore: Math.round(positiveFeedback.progress),
					submittedAt: feedbackDate,
					comment: `Great work this week! I noticed significant improvement.`
				}
			});
			totalFeedbacks++;

			// Neutral stakeholder feedback
			await prisma.feedback.create({
				data: {
					reflectionId: progressReflection.id,
					stakeholderId: stakeholders[1].id,
					effortScore: Math.round(neutralFeedback.effort),
					progressScore: Math.round(neutralFeedback.progress),
					submittedAt: feedbackDate,
					comment: `Steady progress this week.`
				}
			});
			totalFeedbacks++;

			// Negative stakeholder feedback
			await prisma.feedback.create({
				data: {
					reflectionId: progressReflection.id,
					stakeholderId: stakeholders[2].id,
					effortScore: Math.round(negativeFeedback.effort),
					progressScore: Math.round(negativeFeedback.progress),
					submittedAt: feedbackDate,
					comment: `Some areas still need work.`
				}
			});
			totalFeedbacks++;
		}

		console.log(`   ✅ Created ${totalReflections} reflections`);
		console.log(`   ✅ Created ${totalFeedbacks} feedback entries`);

		console.log('\n✅ Test data seeding complete!');
		console.log('\n📊 Summary:');
		console.log(`   - Individual: ${individual.email}`);
		console.log(`   - Coach: ${coach.email}`);
		console.log(`   - Objective: ${objective.title}`);
		console.log(
			`   - Cycle: 12 weeks (${cycleStartDate.toISOString().split('T')[0]} to ${cycleEndDate.toISOString().split('T')[0]})`
		);
		console.log(
			`   - Reflections: ${totalReflections} (INTENTION + EFFORT + PROGRESS for 12 weeks)`
		);
		console.log(`   - Stakeholder Feedback: ${totalFeedbacks} (3 stakeholders × 12 weeks)`);
		console.log('\n🎨 You can now preview the visualization by:');
		console.log(
			`   1. Sign up/sign in as ${TEST_INDIVIDUAL_EMAIL} (will auto-link to seeded data)`
		);
		console.log(`   2. Or sign up/sign in as ${TEST_COACH_EMAIL} and view the client roster`);
		console.log('');
		console.log("💡 Note: Users don't need to exist in Clerk first. When you sign up/sign in");
		console.log(
			'   with these emails, Clerk will automatically link to the seeded Prisma records.'
		);
		console.log('');
	} catch (error: any) {
		console.error('\n❌ Error seeding test data:', error);
		if (error.code === 'P2002') {
			console.error('   ⚠️  Unique constraint error. Data may already exist.');
		}
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

seedTestData().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});
