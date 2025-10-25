#!/usr/bin/env tsx
/**
 * Historical Price Data Population Script
 * 
 * This script fetches and stores historical price data for all tracked cryptocurrencies.
 * Can be run manually or scheduled as a cron job.
 * 
 * Usage:
 *   npm run populate-history          # Populate 30 days of data
 *   npm run populate-history -- 7     # Populate 7 days of data
 *   npm run populate-history -- all   # Populate all tracked cryptocurrencies
 */

import { HistoricalPriceService } from '../services/crypto/historical-price.service';
import { prisma } from '../lib/db/prisma';

async function main() {
  const args = process.argv.slice(2);
  const days = args[0] && !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 30;
  const mode = args[0] === 'all' ? 'all' : 'tracked';

  console.log(`\n🚀 Starting historical price data population...`);
  console.log(`Mode: ${mode}`);
  console.log(`Days: ${days}\n`);

  const service = new HistoricalPriceService(prisma);

  try {
    if (mode === 'all') {
      // Get all cryptocurrencies
      const allCryptos = await prisma.cryptocurrency.findMany({
        where: {
          coinGeckoId: { not: null },
        },
      });

      const coinGeckoIds = allCryptos
        .map(c => c.coinGeckoId)
        .filter((id): id is string => id !== null);

      console.log(`📊 Found ${coinGeckoIds.length} cryptocurrencies to update`);
      await service.bulkFetchAndStore(coinGeckoIds, days);
    } else {
      // Get only tracked cryptocurrencies
      const trackedIds = await service.getTrackedCryptocurrencies();
      console.log(`📊 Found ${trackedIds.length} tracked cryptocurrencies`);
      
      if (trackedIds.length === 0) {
        console.log('⚠️  No tracked cryptocurrencies found. Add some coins to portfolios first.');
        return;
      }

      await service.bulkFetchAndStore(trackedIds, days);
    }

    console.log(`\n✅ Historical price data population completed!`);
  } catch (error) {
    console.error(`\n❌ Error populating historical data:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
