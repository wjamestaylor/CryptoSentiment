-- AlterTable: Add onboarding tracking fields to User table
ALTER TABLE "users" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
