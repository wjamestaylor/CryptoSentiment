# Historical Price Data Implementation

## Overview

This document describes the implementation of historical price data storage and retrieval for the CryptoSentiment platform. Historical price data enables advanced analytics, portfolio performance tracking, and chart visualizations over extended time periods.

## Features

### Data Storage
- **PriceData Model**: Stores historical price points with price, volume, market cap, and timestamp
- **Efficient Indexing**: Compound unique index on `(cryptoId, timestamp)` prevents duplicates and enables fast queries
- **Automatic Deduplication**: Upsert operations prevent duplicate entries when re-fetching data

### Data Sources
- **Primary**: CoinGecko API for fetching historical market data
- **Storage**: PostgreSQL database for offline access and faster queries
- **Fallback**: Automatic fallback to API if stored data is unavailable or stale

### Subscription Tiers
- **FREE Tier**: Limited to 7 days of historical data
- **PRO Tier**: Access to full 30+ days of historical data
- **BUSINESS Tier**: Access to full 365 days of historical data

## Architecture

### Services

#### HistoricalPriceService
Location: `src/services/crypto/historical-price.service.ts`

**Key Methods**:
- `fetchAndStoreHistory(coinGeckoId, days)` - Fetch from API and store in database
- `getHistoricalData(coinGeckoId, days)` - Retrieve stored data from database
- `getPriceAtTime(coinGeckoId, date)` - Get price at specific timestamp
- `calculatePriceChange(coinGeckoId, days)` - Calculate price change over period
- `bulkFetchAndStore(coinGeckoIds, days)` - Batch operation for multiple coins
- `getTrackedCryptocurrencies()` - Get list of all tracked coins
- `hasRecentData(coinGeckoId, maxAgeHours)` - Check if data is fresh

#### PortfolioService Updates
Location: `src/services/portfolio/portfolio.service.ts`

**Enhanced Features**:
- Calculates 7-day and 30-day portfolio value changes using stored historical data
- Falls back to zero if historical data unavailable
- Maintains backward compatibility with 24h calculations from live API

#### PortfolioAnalyticsService Updates
Location: `src/services/analytics/portfolio-analytics.service.ts`

**Smart Data Fetching**:
- First checks database for recent historical data
- Falls back to API if data is stale (older than 24 hours)
- Automatically stores API-fetched data for future use

### API Endpoints

#### tRPC Analytics Router
Location: `src/server/api/routers/analytics.ts`

**New Endpoints**:
1. `getPriceHistory` (enhanced)
   - Returns historical price data with tier-based limits
   - Includes metadata about tier restrictions
   - Response format:
     ```typescript
     {
       success: true,
       data: PriceHistory[],
       meta: {
         requestedDays: number,
         returnedDays: number,
         limitedByTier: boolean
       }
     }
     ```

2. `getStoredPriceHistory`
   - Retrieves data directly from database
   - No tier restrictions (controlled by data availability)

3. `populateHistoricalData`
   - Authenticated endpoint to populate data for user's tracked coins
   - Returns count of cryptocurrencies updated

### Database Schema

#### PriceData Model
```prisma
model PriceData {
  id        String   @id @default(cuid())
  cryptoId  String
  price     Float
  volume24h Float
  change24h Float
  marketCap Float
  timestamp DateTime @default(now())

  crypto Cryptocurrency @relation(fields: [cryptoId], references: [id])

  @@unique([cryptoId, timestamp], name: "cryptoId_timestamp")
  @@index([cryptoId, timestamp])
  @@map("price_data")
}
```

**Indexes**:
- Unique constraint on `(cryptoId, timestamp)` ensures no duplicate entries
- Index on `(cryptoId, timestamp)` optimizes time-range queries

**Migration**: `20251025065555_add_price_data_unique_index`

## Usage

### Manual Data Population

```bash
# Populate 30 days of data for tracked cryptocurrencies
npm run populate-history

# Populate 7 days of data
npm run populate-history -- 7

# Populate data for all cryptocurrencies (not just tracked)
npm run populate-history -- all
```

### Programmatic Usage

```typescript
import { historicalPriceService } from '@/services/crypto/historical-price.service';

// Fetch and store 30 days of Bitcoin data
await historicalPriceService.fetchAndStoreHistory('bitcoin', 30);

// Get stored historical data
const history = await historicalPriceService.getHistoricalData('bitcoin', 30);

// Get price at specific time
const price = await historicalPriceService.getPriceAtTime('bitcoin', new Date('2024-01-01'));

// Calculate price change
const change = await historicalPriceService.calculatePriceChange('bitcoin', 7);
// Returns: { change: number, changePercentage: number }
```

### UI Integration

The existing PriceChart component automatically uses historical data:

```tsx
import { PriceChart } from '@/components/analytics/PriceChart';

<PriceChart 
  cryptoId="bitcoin" 
  cryptoName="Bitcoin"
  cryptoSymbol="BTC"
/>
```

The chart will:
1. Fetch data based on user's subscription tier
2. Use stored data when available
3. Fall back to API if needed
4. Display appropriate tier-based limitations

## Scheduled Jobs

### Recommended Cron Schedule

For production deployment, set up a cron job to populate historical data:

```bash
# Daily at 2 AM UTC - populate 7 days for all tracked cryptocurrencies
0 2 * * * cd /path/to/app && npm run populate-history -- 7

# Weekly on Sunday at 3 AM UTC - populate 30 days for all tracked cryptocurrencies
0 3 * * 0 cd /path/to/app && npm run populate-history -- 30
```

### Railway/Heroku Scheduler

```bash
npm run populate-history -- 7
```

Run frequency: Daily

## Testing

### Test Coverage

- **HistoricalPriceService**: 17 tests covering all methods
- **PortfolioService**: Updated with HistoricalPriceService mocks
- **PortfolioAnalyticsService**: 12 tests including price history fetching

Run tests:
```bash
npm test -- historical-price
npm test -- portfolio.service
npm test -- portfolio-analytics
```

## Performance Considerations

### Database Queries
- Index on `(cryptoId, timestamp)` ensures fast lookups
- Queries filter by date range to limit result sets
- Upsert operations prevent duplicate data

### API Rate Limiting
- CoinGecko API has rate limits (10-50 calls/minute)
- Service includes built-in rate limiting and caching
- Batch operations spread requests over time

### Data Freshness
- Data considered "recent" if less than 24 hours old
- Stale data triggers automatic API fetch
- Fetched data is automatically stored for future use

## Subscription Tier Limits

| Tier | Max Historical Days | Chart Access |
|------|---------------------|--------------|
| FREE | 7 days | Basic charts |
| PRO | 30+ days | Full charts |
| BUSINESS | 365 days | Full charts |

Limits enforced at API level with helpful metadata in response.

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live price updates
2. **Data Compression**: Store minute-level data for recent history, daily for older
3. **Advanced Analytics**: Support for technical indicators (RSI, MACD, etc.)
4. **Export Functionality**: CSV/Excel export of historical data
5. **Custom Timeframes**: User-defined date ranges
6. **Multiple Currencies**: Support for non-USD base currencies

## Troubleshooting

### No Historical Data Available
- Run `npm run populate-history` to populate initial data
- Check database connection and migrations
- Verify CoinGecko API is accessible

### Tier Limitations
- Check user's subscription tier in database
- Verify tier is correctly passed to API endpoint
- Review `getPriceHistory` endpoint for tier logic

### Stale Data
- Historical data older than 24 hours triggers API fetch
- Adjust `maxAgeHours` parameter if different freshness needed
- Manual refresh: `npm run populate-history`

## References

- **PriceData Schema**: `prisma/schema.prisma`
- **Service Implementation**: `src/services/crypto/historical-price.service.ts`
- **API Endpoints**: `src/server/api/routers/analytics.ts`
- **UI Components**: `src/components/analytics/PriceChart.tsx`
- **Tests**: `src/__tests__/services/crypto/historical-price.service.test.ts`
