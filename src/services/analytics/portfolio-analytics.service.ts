import { PrismaClient } from '@prisma/client';

interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

// Types for analytics data
export interface PortfolioMetrics {
  totalValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  topPerformer: {
    symbol: string;
    name: string;
    gainLoss: number;
    gainLossPercentage: number;
  } | null;
  worstPerformer: {
    symbol: string;
    name: string;
    gainLoss: number;
    gainLossPercentage: number;
  } | null;
  portfolioDistribution: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    currentPrice: number;
    priceChange24h: number;
  }>;
}

export interface PriceHistory {
  timestamp: string;
  price: number;
  marketCap: number;
  volume: number;
}

export interface AnalyticsData {
  portfolioMetrics: PortfolioMetrics;
  marketOverview: {
    totalMarketCap: number;
    totalMarketCapChange24h: number;
    totalVolume24h: number;
    btcDominance: number;
    fearGreedIndex?: number;
  };
  sentimentAnalytics: {
    averageSentiment: number;
    sentimentTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    recentAnalyses: number;
    topSentimentCoins: Array<{
      symbol: string;
      name: string;
      sentiment: number;
      confidence: number;
      analysisDate: string;
    }>;
  };
  alertAnalytics: {
    totalAlerts: number;
    triggeredAlerts24h: number;
    alertsByType: Record<string, number>;
    recentTriggers: Array<{
      cryptoSymbol: string;
      alertType: string;
      triggeredAt: string;
      message: string;
    }>;
  };
}

export interface PerformanceMetrics {
  timeframe: '24h' | '7d' | '30d' | '1y';
  returns: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  bestDay: {
    date: string;
    return: number;
  };
  worstDay: {
    date: string;
    return: number;
  };
}

export class PortfolioAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive analytics data for a user
   */
  async getAnalyticsData(userId: string): Promise<AnalyticsData> {
    const [portfolioMetrics, marketOverview, sentimentAnalytics, alertAnalytics] = 
      await Promise.all([
        this.getPortfolioMetrics(userId),
        this.getMarketOverview(),
        this.getSentimentAnalytics(userId),
        this.getAlertAnalytics(userId),
      ]);

    return {
      portfolioMetrics,
      marketOverview,
      sentimentAnalytics,
      alertAnalytics,
    };
  }

  /**
   * Calculate portfolio metrics for tracked cryptocurrencies
   */
  async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics> {
    // Get user's tracked cryptocurrencies (unified tracking system)
    const trackedCryptos = await this.prisma.cryptoTracking.findMany({
      where: { userId },
      include: { crypto: true },
    });

    if (trackedCryptos.length === 0) {
      return {
        totalValue: 0,
        totalGainLoss: 0,
        gainLossPercentage: 0,
        topPerformer: null,
        worstPerformer: null,
        portfolioDistribution: [],
      };
    }

    // Get current prices for all tracked coins
    const cryptoIds = trackedCryptos
      .map(tracking => tracking.crypto.coinGeckoId)
      .filter(Boolean) as string[];

    if (cryptoIds.length === 0) {
      return {
        totalValue: 0,
        totalGainLoss: 0,
        gainLossPercentage: 0,
        topPerformer: null,
        worstPerformer: null,
        portfolioDistribution: [],
      };
    }

    const priceData = await this.fetchCryptoPrices(cryptoIds);
    
    // Calculate metrics (assuming equal weight for simplicity)
    const equalWeight = 1 / priceData.length;
    let totalValue = 0;
    let totalGainLoss = 0;
    const performances: Array<{
      symbol: string;
      name: string;
      gainLoss: number;
      gainLossPercentage: number;
      value: number;
      currentPrice: number;
      priceChange24h: number;
    }> = [];

    priceData.forEach((crypto: CryptoPriceData) => {
      const value = crypto.current_price * equalWeight * 10000; // Simulate $10k portfolio
      const gainLoss = (crypto.price_change_percentage_24h / 100) * value;
      
      totalValue += value;
      totalGainLoss += gainLoss;
      
      performances.push({
        symbol: crypto.symbol.toUpperCase(),
        name: crypto.name,
        gainLoss,
        gainLossPercentage: crypto.price_change_percentage_24h,
        value,
        currentPrice: crypto.current_price,
        priceChange24h: crypto.price_change_percentage_24h,
      });
    });

    const gainLossPercentage = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

    // Find top and worst performers
    const sortedPerformances = [...performances].sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
    const topPerformer = sortedPerformances[0] || null;
    const worstPerformer = sortedPerformances[sortedPerformances.length - 1] || null;

    // Calculate distribution
    const portfolioDistribution = performances.map(perf => ({
      symbol: perf.symbol,
      name: perf.name,
      value: perf.value,
      percentage: (perf.value / totalValue) * 100,
      currentPrice: perf.currentPrice,
      priceChange24h: perf.priceChange24h,
    }));

    return {
      totalValue,
      totalGainLoss,
      gainLossPercentage,
      topPerformer,
      worstPerformer,
      portfolioDistribution,
    };
  }

  /**
   * Get market overview data
   */
  async getMarketOverview() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const data = await response.json();
      const globalData = data.data;

      return {
        totalMarketCap: globalData.total_market_cap.usd || 0,
        totalMarketCapChange24h: globalData.market_cap_change_percentage_24h_usd || 0,
        totalVolume24h: globalData.total_volume.usd || 0,
        btcDominance: globalData.market_cap_percentage.btc || 0,
      };
    } catch (error) {
      console.error('Failed to fetch market overview:', error);
      return {
        totalMarketCap: 0,
        totalMarketCapChange24h: 0,
        totalVolume24h: 0,
        btcDominance: 0,
      };
    }
  }

  /**
   * Get sentiment analytics for user's portfolio
   */
  async getSentimentAnalytics(userId: string) {
    // Get user's tracked cryptocurrencies (unified tracking system)
    const trackedCryptos = await this.prisma.cryptoTracking.findMany({
      where: { userId },
      include: { crypto: true },
    });

    // Get recent sentiment analyses for user
    const recentAnalyses = await this.prisma.usageLog.count({
      where: {
        userId,
        type: 'AI_ANALYSIS',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    // Mock sentiment data for tracked coins (in a real implementation, 
    // this would come from stored sentiment analysis results)
    const topSentimentCoins = trackedCryptos.slice(0, 5).map(tracking => ({
      symbol: tracking.crypto.symbol,
      name: tracking.crypto.name,
      sentiment: Math.random() * 2 - 1, // Random sentiment between -1 and 1
      confidence: 0.7 + Math.random() * 0.3, // Random confidence between 0.7 and 1
      analysisDate: new Date().toISOString(),
    }));

    const averageSentiment = topSentimentCoins.length > 0 
      ? topSentimentCoins.reduce((sum, coin) => sum + coin.sentiment, 0) / topSentimentCoins.length
      : 0;

    const sentimentTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = averageSentiment > 0.2 ? 'BULLISH' 
      : averageSentiment < -0.2 ? 'BEARISH' 
      : 'NEUTRAL';

    return {
      averageSentiment,
      sentimentTrend,
      recentAnalyses,
      topSentimentCoins,
    };
  }

  /**
   * Get alert analytics for user
   */
  async getAlertAnalytics(userId: string) {
    const [totalAlerts, recentTriggers, alertsByType] = await Promise.all([
      this.prisma.alert.count({
        where: { userId },
      }),
      this.prisma.alert.findMany({
        where: {
          userId,
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          crypto: true, // Include crypto relationship to get symbol
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.alert.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
      }),
    ]);

    const triggeredAlerts24h = recentTriggers.filter(alert => 
      alert.triggerCount > 0 && 
      alert.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const alertsByTypeMap = alertsByType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    const recentTriggersData = recentTriggers.map(alert => ({
      cryptoSymbol: alert.crypto.symbol,
      alertType: alert.type,
      triggeredAt: alert.updatedAt.toISOString(),
      message: `${alert.type.replace('_', ' ')} alert for ${alert.crypto.symbol}`,
    }));

    return {
      totalAlerts,
      triggeredAlerts24h,
      alertsByType: alertsByTypeMap,
      recentTriggers: recentTriggersData,
    };
  }

  /**
   * Get performance metrics for different timeframes
   */
  async getPerformanceMetrics(userId: string, timeframe: '24h' | '7d' | '30d' | '1y'): Promise<PerformanceMetrics> {
    // This would typically require historical price data storage
    // For now, we'll return mock data with realistic patterns
    
    const mockReturns = {
      '24h': Math.random() * 10 - 5, // -5% to +5%
      '7d': Math.random() * 20 - 10, // -10% to +10%
      '30d': Math.random() * 40 - 20, // -20% to +20%
      '1y': Math.random() * 200 - 100, // -100% to +100%
    };

    const returns = mockReturns[timeframe];
    const volatility = Math.abs(returns) * (1 + Math.random()); // Higher volatility for bigger moves
    const sharpeRatio = returns / (volatility || 1); // Simple Sharpe approximation
    const maxDrawdown = Math.abs(returns) * 0.5; // Mock drawdown
    const winRate = returns > 0 ? 60 + Math.random() * 30 : 30 + Math.random() * 40; // Higher win rate for positive returns

    return {
      timeframe,
      returns,
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate,
      bestDay: {
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        return: Math.max(returns * 0.3, 2 + Math.random() * 5),
      },
      worstDay: {
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        return: Math.min(returns * 0.3, -2 - Math.random() * 5),
      },
    };
  }

  /**
   * Get price history for a cryptocurrency
   * First tries to get from database, falls back to API if needed
   */
  async getPriceHistory(cryptoId: string, days: number = 30): Promise<PriceHistory[]> {
    try {
      // Try to get from database first
      const { historicalPriceService } = await import('../crypto/historical-price.service');
      
      // Check if we have recent data in the database
      const hasData = await historicalPriceService.hasRecentData(cryptoId, 24);
      
      if (hasData) {
        // Use stored data
        const storedData = await historicalPriceService.getHistoricalData(cryptoId, days);
        
        if (storedData.length > 0) {
          return storedData.map(point => ({
            timestamp: point.timestamp.toISOString(),
            price: point.price,
            marketCap: point.marketCap,
            volume: point.volume24h,
          }));
        }
      }
      
      // Fallback to API if no stored data or data is stale
      const { coinGeckoService } = await import('../crypto/price.service');
      
      const endpoint = `/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
      
      const data = await coinGeckoService.request<{
        prices: [number, number][];
        market_caps: [number, number][];
        total_volumes: [number, number][];
      }>(endpoint);
      
      // Optionally store the fetched data for future use
      try {
        await historicalPriceService.fetchAndStoreHistory(cryptoId, days);
      } catch (storeError) {
        console.warn('Failed to store fetched price history:', storeError);
        // Continue even if storage fails
      }
      
      return data.prices.map((price: [number, number], index: number) => ({
        timestamp: new Date(price[0]).toISOString(),
        price: price[1],
        marketCap: data.market_caps[index]?.[1] || 0,
        volume: data.total_volumes[index]?.[1] || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      return [];
    }
  }

  /**
   * Private helper to fetch crypto prices from CoinGecko
   */
  private async fetchCryptoPrices(cryptoIds: string[]) {
    try {
      const idsParam = cryptoIds.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const portfolioAnalyticsService = new PortfolioAnalyticsService(new PrismaClient());