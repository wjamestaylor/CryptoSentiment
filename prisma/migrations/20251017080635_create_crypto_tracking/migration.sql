-- AlterTable
ALTER TABLE "followed_coins" ADD COLUMN     "migratedToCryptoTracking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "portfolio_holdings" ADD COLUMN     "migratedToCryptoTracking" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "crypto_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cryptoId" TEXT NOT NULL,
    "isWatching" BOOLEAN NOT NULL DEFAULT true,
    "holdingAmount" DOUBLE PRECISION,
    "averagePurchasePrice" DOUBLE PRECISION,
    "totalInvested" DOUBLE PRECISION,
    "firstPurchaseDate" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "tags" TEXT[],
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceAlerts" JSONB[],
    "migratedFromFollowed" BOOLEAN NOT NULL DEFAULT false,
    "migratedFromHolding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_tracking_userId_cryptoId_key" ON "crypto_tracking"("userId", "cryptoId");

-- AddForeignKey
ALTER TABLE "crypto_tracking" ADD CONSTRAINT "crypto_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crypto_tracking" ADD CONSTRAINT "crypto_tracking_cryptoId_fkey" FOREIGN KEY ("cryptoId") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
