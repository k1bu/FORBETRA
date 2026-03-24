-- DropForeignKey
ALTER TABLE "CoachClient" DROP CONSTRAINT "CoachClient_coachId_fkey";

-- DropForeignKey
ALTER TABLE "CoachClient" DROP CONSTRAINT "CoachClient_individualId_fkey";

-- DropForeignKey
ALTER TABLE "CoachInvite" DROP CONSTRAINT "CoachInvite_coachId_fkey";

-- DropForeignKey
ALTER TABLE "CoachNote" DROP CONSTRAINT "CoachNote_coachId_fkey";

-- DropForeignKey
ALTER TABLE "CoachNote" DROP CONSTRAINT "CoachNote_individualId_fkey";

-- DropForeignKey
ALTER TABLE "Cycle" DROP CONSTRAINT "Cycle_objectiveId_fkey";

-- DropForeignKey
ALTER TABLE "Cycle" DROP CONSTRAINT "Cycle_userId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_reflectionId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_stakeholderId_fkey";

-- DropForeignKey
ALTER TABLE "Insight" DROP CONSTRAINT "Insight_userId_fkey";

-- DropForeignKey
ALTER TABLE "Objective" DROP CONSTRAINT "Objective_userId_fkey";

-- DropForeignKey
ALTER TABLE "ObjectiveChange" DROP CONSTRAINT "ObjectiveChange_objectiveId_fkey";

-- DropForeignKey
ALTER TABLE "ObjectiveChange" DROP CONSTRAINT "ObjectiveChange_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reflection" DROP CONSTRAINT "Reflection_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "Reflection" DROP CONSTRAINT "Reflection_subgoalId_fkey";

-- DropForeignKey
ALTER TABLE "Reflection" DROP CONSTRAINT "Reflection_userId_fkey";

-- DropForeignKey
ALTER TABLE "Stakeholder" DROP CONSTRAINT "Stakeholder_individualId_fkey";

-- DropForeignKey
ALTER TABLE "Subgoal" DROP CONSTRAINT "Subgoal_objectiveId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_reflectionId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_stakeholderId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "behavioralObservation" TEXT,
ADD COLUMN     "suggestion" TEXT;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveChange" ADD CONSTRAINT "ObjectiveChange_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveChange" ADD CONSTRAINT "ObjectiveChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subgoal" ADD CONSTRAINT "Subgoal_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_subgoalId_fkey" FOREIGN KEY ("subgoalId") REFERENCES "Subgoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "Reflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stakeholder" ADD CONSTRAINT "Stakeholder_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachNote" ADD CONSTRAINT "CoachNote_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachNote" ADD CONSTRAINT "CoachNote_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "Reflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachClient" ADD CONSTRAINT "CoachClient_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachClient" ADD CONSTRAINT "CoachClient_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachInvite" ADD CONSTRAINT "CoachInvite_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
