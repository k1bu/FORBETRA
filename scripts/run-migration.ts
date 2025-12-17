import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
	try {
		console.log('Adding RATING_A enum value...');
		await prisma.$executeRawUnsafe(
			`ALTER TYPE "ReflectionType" ADD VALUE IF NOT EXISTS 'RATING_A'`
		);
		console.log('✓ RATING_A added');

		console.log('Adding RATING_B enum value...');
		await prisma.$executeRawUnsafe(
			`ALTER TYPE "ReflectionType" ADD VALUE IF NOT EXISTS 'RATING_B'`
		);
		console.log('✓ RATING_B added');

		console.log('Updating EFFORT -> RATING_A...');
		const effortCount = await prisma.$executeRawUnsafe(
			`UPDATE "Reflection" SET "reflectionType" = 'RATING_A' WHERE "reflectionType" = 'EFFORT'`
		);
		console.log(`✓ Updated ${effortCount} reflections from EFFORT to RATING_A`);

		console.log('Updating PROGRESS -> RATING_B...');
		const progressCount = await prisma.$executeRawUnsafe(
			`UPDATE "Reflection" SET "reflectionType" = 'RATING_B' WHERE "reflectionType" = 'PROGRESS'`
		);
		console.log(`✓ Updated ${progressCount} reflections from PROGRESS to RATING_B`);

		console.log('\n✅ Migration completed successfully!');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

runMigration();

