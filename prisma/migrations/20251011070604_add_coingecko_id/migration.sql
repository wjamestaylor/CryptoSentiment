/*
  Warnings:

  - A unique constraint covering the columns `[coinGeckoId]` on the table `cryptocurrencies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cryptocurrencies" ADD COLUMN     "coinGeckoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cryptocurrencies_coinGeckoId_key" ON "cryptocurrencies"("coinGeckoId");
