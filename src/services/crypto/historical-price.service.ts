/**
 * Historical Price Data Service
 * 
 * Manages fetching, storing, and retrieving historical price data for cryptocurrencies.
 * Stores price history in the database for offline access and faster queries.
 */

import { PrismaClient } from '@prisma/client';
import { CoinGeckoService } from './price.service';

export interface HistoricalPricePoint {
  timestamp: Date;
  price: number;
  volume24h: number;
  marketCap: number;
}

export interface HistoricalDataRange {
  cryptoId: string;
  days: number;
  data: HistoricalPricePoint[];
}

export class HistoricalPriceService {
  private priceService: CoinGeckoService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, apiKey?: string) {
    this.prisma = prisma;
    this.priceService = new CoinGeckoService(apiKey);
  }

  /**
   * Fetch and store historical price data for a cryptocurrency
   */
  async fetchAndStoreHistory(
    coinGeckoId: string,
    days: number = 30
  ): Promise<void> {
    try {
      // Find the cryptocurrency record
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { coinGeckoId },
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency not found: ${coinGeckoId}`);
      }

      // Fetch historical data from CoinGecko
      const endpoint = `/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
      const data = await this.priceService.request<{
        prices: [number, number][];
        market_caps: [number, number][];
        total_volumes: [number, number][];
      }>(endpoint);

      // Store each price point in the database
      const pricePoints = data.prices.map((price, index) => ({
        cryptoId: crypto.id,
        price: price[1],
        volume24h: data.total_volumes[index]?.[1] || 0,
        marketCap: data.market_caps[index]?.[1] || 0,
        change24h: 0, // Will be calculated if needed
        timestamp: new Date(price[0]),
      }));

      // Use upsert to avoid duplicates
      for (const point of pricePoints) {
        await this.prisma.priceData.upsert({
          where: {
            cryptoId_timestamp: {
              cryptoId: point.cryptoId,
              timestamp: point.timestamp,
            },
          },
          update: {
            price: point.price,
            volume24h: point.volume24h,
            marketCap: point.marketCap,
          },
          create: point,
        });
      }

      console.log(`Stored ${pricePoints.length} price points for ${coinGeckoId}`);
    } catch (error) {
      console.error(`Failed to fetch and store history for ${coinGeckoId}:`, error);
      throw error;
    }
  }

  /**
   * Get historical price data from database
   */
  async getHistoricalData(
    coinGeckoId: string,
    days: number = 30
  ): Promise<HistoricalPricePoint[]> {
    try {
      // Find the cryptocurrency record
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { coinGeckoId },
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency not found: ${coinGeckoId}`);
      }

      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const priceData = await this.prisma.priceData.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: sinceDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return priceData.map(point => ({
        timestamp: point.timestamp,
        price: point.price,
        volume24h: point.volume24h,
        marketCap: point.marketCap,
      }));
    } catch (error) {
      console.error(`Failed to get historical data for ${coinGeckoId}:`, error);
      throw error;
    }
  }

  /**
   * Get price at a specific point in time (or closest available)
   */
  async getPriceAtTime(
    coinGeckoId: string,
    targetDate: Date
  ): Promise<number | null> {
    try {
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { coinGeckoId },
      });

      if (!crypto) {
        return null;
      }

      // Find the closest price point to the target date
      const pricePoint = await this.prisma.priceData.findFirst({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            lte: targetDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return pricePoint?.price || null;
    } catch (error) {
      console.error(`Failed to get price at time for ${coinGeckoId}:`, error);
      return null;
    }
  }

  /**
   * Calculate price change over a period
   */
  async calculatePriceChange(
    coinGeckoId: string,
    days: number
  ): Promise<{ change: number; changePercentage: number }> {
    try {
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { coinGeckoId },
      });

      if (!crypto) {
        return { change: 0, changePercentage: 0 };
      }

      const now = new Date();
      const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get current price (most recent)
      const currentPricePoint = await this.prisma.priceData.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' },
      });

      // Get past price (closest to target date)
      const pastPricePoint = await this.prisma.priceData.findFirst({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            lte: pastDate,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!currentPricePoint || !pastPricePoint) {
        return { change: 0, changePercentage: 0 };
      }

      const change = currentPricePoint.price - pastPricePoint.price;
      const changePercentage = (change / pastPricePoint.price) * 100;

      return { change, changePercentage };
    } catch (error) {
      console.error(`Failed to calculate price change for ${coinGeckoId}:`, error);
      return { change: 0, changePercentage: 0 };
    }
  }

  /**
   * Bulk fetch and store historical data for multiple cryptocurrencies
   */
  async bulkFetchAndStore(
    coinGeckoIds: string[],
    days: number = 30
  ): Promise<void> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const coinGeckoId of coinGeckoIds) {
      try {
        await this.fetchAndStoreHistory(coinGeckoId, days);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${coinGeckoId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Bulk fetch complete: ${results.success} succeeded, ${results.failed} failed`);
    if (results.errors.length > 0) {
      console.error('Errors:', results.errors);
    }
  }

  /**
   * Get all tracked cryptocurrencies that need historical data updates
   */
  async getTrackedCryptocurrencies(): Promise<string[]> {
    try {
      // Get unique cryptocurrencies from CryptoTracking
      const tracked = await this.prisma.cryptoTracking.findMany({
        include: { crypto: true },
        distinct: ['cryptoId'],
      });

      return tracked
        .map(t => t.crypto.coinGeckoId)
        .filter((id): id is string => id !== null);
    } catch (error) {
      console.error('Failed to get tracked cryptocurrencies:', error);
      return [];
    }
  }

  /**
   * Check if historical data exists and is recent
   */
  async hasRecentData(
    coinGeckoId: string,
    maxAgeHours: number = 24
  ): Promise<boolean> {
    try {
      const crypto = await this.prisma.cryptocurrency.findUnique({
        where: { coinGeckoId },
      });

      if (!crypto) {
        return false;
      }

      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

      const recentData = await this.prisma.priceData.findFirst({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: cutoffDate,
          },
        },
      });

      return recentData !== null;
    } catch (error) {
      console.error(`Failed to check recent data for ${coinGeckoId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const historicalPriceService = new HistoricalPriceService(
  new PrismaClient(),
  process.env.COINGECKO_API_KEY
);
