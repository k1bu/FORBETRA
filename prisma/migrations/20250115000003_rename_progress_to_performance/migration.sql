-- Migration to rename progressScore to performanceScore
-- This migration updates both Reflection and Feedback tables

-- Rename column in Reflection table
ALTER TABLE "Reflection" RENAME COLUMN "progressScore" TO "performanceScore";

-- Rename column in Feedback table
ALTER TABLE "Feedback" RENAME COLUMN "progressScore" TO "performanceScore";

