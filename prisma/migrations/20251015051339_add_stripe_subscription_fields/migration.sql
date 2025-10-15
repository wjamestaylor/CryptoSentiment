/*
  Warnings:

  - The values [BASIC,ENTERPRISE] on the enum `SubscriptionTier` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIALING';

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('FREE', 'PRO', 'BUSINESS');
ALTER TABLE "subscriptions" ALTER COLUMN "tier" TYPE "SubscriptionTier_new" USING ("tier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "public"."SubscriptionTier_old";
COMMIT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "trialEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");
