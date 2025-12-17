-- Step 1: Add new enum values (must be committed before use)
ALTER TYPE "ReflectionType" ADD VALUE IF NOT EXISTS 'RATING_A';
ALTER TYPE "ReflectionType" ADD VALUE IF NOT EXISTS 'RATING_B';

