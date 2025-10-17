-- CreateTable
CREATE TABLE "portfolio_holdings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cryptoId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_holdings_userId_cryptoId_key" ON "portfolio_holdings"("userId", "cryptoId");

-- AddForeignKey
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_cryptoId_fkey" FOREIGN KEY ("cryptoId") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
