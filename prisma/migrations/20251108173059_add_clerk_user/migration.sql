-- Add clerkUserId column to link Prisma users with Clerk identities
ALTER TABLE "User"
ADD COLUMN "clerkUserId" TEXT;

-- Ensure each Clerk identity maps to at most one user record
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
