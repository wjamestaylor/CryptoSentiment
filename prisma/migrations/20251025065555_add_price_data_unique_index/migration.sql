-- CreateIndex
CREATE UNIQUE INDEX "price_data_cryptoId_timestamp_key" ON "price_data"("cryptoId", "timestamp");

-- CreateIndex
CREATE INDEX "price_data_cryptoId_timestamp_idx" ON "price_data"("cryptoId", "timestamp");
