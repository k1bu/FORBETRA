-- Step 2: Update existing data to use new enum values
-- Update EFFORT -> RATING_A
UPDATE "Reflection" SET "reflectionType" = 'RATING_A' WHERE "reflectionType" = 'EFFORT';

-- Update PROGRESS -> RATING_B  
UPDATE "Reflection" SET "reflectionType" = 'RATING_B' WHERE "reflectionType" = 'PROGRESS';

