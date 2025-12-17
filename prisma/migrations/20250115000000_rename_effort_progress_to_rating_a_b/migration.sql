-- Migration to rename EFFORT to RATING_A and PROGRESS to RATING_B
-- This migration updates the ReflectionType enum and all existing data
-- Note: Enum values must be added in separate transactions in PostgreSQL

-- Step 1: Add RATING_A enum value (must be committed separately)
ALTER TYPE "ReflectionType" ADD VALUE IF NOT EXISTS 'RATING_A';

-- Step 2: Add RATING_B enum value (must be committed separately)  
ALTER TYPE "ReflectionType" ADD VALUE IF NOT EXISTS 'RATING_B';

-- Step 3: Update existing data: EFFORT -> RATING_A
-- This will run in a separate transaction after enum values are committed
UPDATE "Reflection" SET "reflectionType" = 'RATING_A' WHERE "reflectionType" = 'EFFORT';

-- Step 4: Update existing data: PROGRESS -> RATING_B
UPDATE "Reflection" SET "reflectionType" = 'RATING_B' WHERE "reflectionType" = 'PROGRESS';

-- Note: We cannot directly remove enum values in PostgreSQL
-- The old values (EFFORT, PROGRESS) will remain in the enum but won't be used
-- This is safe and doesn't affect functionality

