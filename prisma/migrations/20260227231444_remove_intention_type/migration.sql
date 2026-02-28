-- AlterEnum
BEGIN;
CREATE TYPE "ReflectionType_new" AS ENUM ('RATING_A', 'RATING_B');
ALTER TABLE "Reflection" ALTER COLUMN "reflectionType" TYPE "ReflectionType_new" USING ("reflectionType"::text::"ReflectionType_new");
ALTER TYPE "ReflectionType" RENAME TO "ReflectionType_old";
ALTER TYPE "ReflectionType_new" RENAME TO "ReflectionType";
DROP TYPE "public"."ReflectionType_old";
COMMIT;
