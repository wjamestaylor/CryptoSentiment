/*
  Warnings:

  - A unique constraint covering the columns `[discordUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegramUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "discordUserId" TEXT,
ADD COLUMN     "discordVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramUserId" TEXT,
ADD COLUMN     "telegramVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_discordUserId_key" ON "users"("discordUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramUserId_key" ON "users"("telegramUserId");
