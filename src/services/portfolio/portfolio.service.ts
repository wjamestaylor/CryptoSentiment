/**
 * Unified Portfolio Service
 * 
 * Centralizes all portfolio calculations with live price integration
 * to ensure consistency across Dashboard, CryptoManager, and Analytics pages.
 */

import { CoinGeckoService, type CoinGeckoPriceData } from '../crypto/price.service';

export interface Holding {
  id: string;
  cryptoSymbol: string;
  cryptoName: string;
  coinGeckoId: string | null;
  holdingAmount: number;
  averagePurchasePrice: number;
  totalInvested: number;
  firstPurchaseDate: Date;
  lastPurchaseDate?: Date;
  notes?: string;
  tags: string[];
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  holdingsCount: number;
  lastUpdated: Date;
}

export interface ChangeMetrics {
  change24h: number;
  changePercentage24h: number;
  change7d: number;
  changePercentage7d: number;
  change30d: number;
  changePercentage30d: number;
}

export interface TopPerformer {
  cryptoSymbol: string;
  cryptoName: string;
  currentPrice: number;
  holdingAmount: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  priceChangePercentage24h: number;
}

export interface PortfolioAnalytics {
  summary: PortfolioSummary;
  changeMetrics: ChangeMetrics;
  topPerformer: TopPerformer | null;
  worstPerformer: TopPerformer | null;
  holdings: Array<Holding & {
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercentage: number;
    priceChangePercentage24h: number;
    priceChange24h: number;
  }>;
}

export class PortfolioService {
  private priceService: CoinGeckoService;

  constructor() {
    this.priceService = new CoinGeckoService();
  }

  /**
   * Calculate comprehensive portfolio analytics with live prices
   */
  async calculatePortfolioAnalytics(holdings: Holding[]): Promise<PortfolioAnalytics> {
    if (holdings.length === 0) {
      return this.getEmptyPortfolio();
    }

    try {
      // Get current prices for all holdings with error recovery
      const coinGeckoIds = holdings
        .map(h => h.coinGeckoId)
        .filter((id): id is string => id !== null);

      let priceData: CoinGeckoPriceData[] = [];
      
      if (coinGeckoIds.length > 0) {
        try {
          priceData = await this.priceService.getCurrentPrices(coinGeckoIds);
        } catch (priceError) {
          console.warn('Failed to fetch current prices, using fallback data:', priceError);
          // Return portfolio with zero current prices instead of failing completely
          priceData = [];
        }
      }
      
      // Calculate metrics for each holding
      const enrichedHoldings = holdings.map(holding => {
        const price = priceData.find((p: CoinGeckoPriceData) => p.id === holding.coinGeckoId);
        const currentPrice = price?.current_price || 0;
        const currentValue = holding.holdingAmount * currentPrice;
        const gainLoss = currentValue - holding.totalInvested;
        const gainLossPercentage = holding.totalInvested > 0 
          ? (gainLoss / holding.totalInvested) * 100 
          : 0;
        const priceChangePercentage24h = price?.price_change_percentage_24h || 0;
        const priceChange24h = price?.price_change_24h || 0;

        return {
          ...holding,
          currentPrice,
          currentValue,
          gainLoss,
          gainLossPercentage,
          priceChangePercentage24h,
          priceChange24h,
        };
      });

      // Calculate portfolio summary
      const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
      const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
      const totalGainLoss = totalValue - totalInvested;
      const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

      const summary: PortfolioSummary = {
        totalValue,
        totalInvested,
        totalGainLoss,
        totalGainLossPercentage,
        holdingsCount: holdings.length,
        lastUpdated: new Date(),
      };

      // Calculate change metrics (24h, 7d, 30d)
      const changeMetrics = this.calculateChangeMetrics(enrichedHoldings);

      // Find top and worst performers
      const sortedByPerformance = enrichedHoldings
        .filter(h => h.currentPrice > 0)
        .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
      
      const topPerformer = sortedByPerformance.length > 0 ? sortedByPerformance[0] : null;
      const worstPerformer = sortedByPerformance.length > 0 
        ? sortedByPerformance[sortedByPerformance.length - 1] 
        : null;

      return {
        summary,
        changeMetrics,
        topPerformer,
        worstPerformer,
        holdings: enrichedHoldings,
      };

    } catch (error) {
      console.error('Error calculating portfolio analytics:', error);
      
      // Return empty portfolio instead of throwing to prevent dashboard crashes
      console.warn('Returning empty portfolio due to API issues');
      return this.getEmptyPortfolio();
    }
  }

  /**
   * Get simplified portfolio summary (faster, for dashboard)
   */
  async getPortfolioSummary(holdings: Holding[]): Promise<PortfolioSummary> {
    if (holdings.length === 0) {
      return {
        totalValue: 0,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdingsCount: 0,
        lastUpdated: new Date(),
      };
    }

    try {
      const coinGeckoIds = holdings
        .map(h => h.coinGeckoId)
        .filter((id): id is string => id !== null);

      let priceData: CoinGeckoPriceData[] = [];
      
      if (coinGeckoIds.length > 0) {
        try {
          priceData = await this.priceService.getCurrentPrices(coinGeckoIds);
        } catch (priceError) {
          console.warn('Failed to fetch prices for portfolio summary, using zero values:', priceError);
          // Continue with empty price data instead of failing
        }
      }
      
      let totalValue = 0;
      const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);

      holdings.forEach(holding => {
        const price = priceData.find((p: CoinGeckoPriceData) => p.id === holding.coinGeckoId);
        const currentPrice = price?.current_price || 0;
        totalValue += holding.holdingAmount * currentPrice;
      });

      const totalGainLoss = totalValue - totalInvested;
      const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

      return {
        totalValue,
        totalInvested,
        totalGainLoss,
        totalGainLossPercentage,
        holdingsCount: holdings.length,
        lastUpdated: new Date(),
      };

    } catch (error) {
      console.error('Error calculating portfolio summary:', error);
      
      // Return basic summary with invested amounts only
      const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
      return {
        totalValue: 0, // Can't calculate without prices
        totalInvested,
        totalGainLoss: -totalInvested, // Assume worst case if no prices available
        totalGainLossPercentage: -100,
        holdingsCount: holdings.length,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Calculate current value for a single holding
   */
  async calculateHoldingValue(holding: Holding): Promise<number> {
    if (!holding.coinGeckoId) {
      return 0;
    }

    try {
      const priceData = await this.priceService.getCurrentPrices([holding.coinGeckoId]);
      const price = priceData[0];
      
      if (!price) {
        return 0;
      }

      return holding.holdingAmount * price.current_price;
    } catch (error) {
      console.error(`Error calculating value for ${holding.cryptoSymbol}:`, error);
      return 0;
    }
  }

  /**
   * Get top performer from holdings
   */
  async getTopPerformer(holdings: Holding[]): Promise<TopPerformer | null> {
    if (holdings.length === 0) {
      return null;
    }

    try {
      const analytics = await this.calculatePortfolioAnalytics(holdings);
      return analytics.topPerformer;
    } catch (error) {
      console.error('Error getting top performer:', error);
      return null;
    }
  }

  /**
   * Calculate 24h portfolio change
   */
  async calculate24hChange(holdings: Holding[]): Promise<{ change: number; percentage: number }> {
    if (holdings.length === 0) {
      return { change: 0, percentage: 0 };
    }

    try {
      const coinGeckoIds = holdings
        .map(h => h.coinGeckoId)
        .filter((id): id is string => id !== null);

      const priceData = await this.priceService.getCurrentPrices(coinGeckoIds);
      
      let totalCurrentValue = 0;
      let total24hAgoValue = 0;

      holdings.forEach(holding => {
        const price = priceData.find((p: CoinGeckoPriceData) => p.id === holding.coinGeckoId);
        if (price) {
          const currentPrice = price.current_price;
          const priceChange24h = price.price_change_24h || 0;
          const price24hAgo = currentPrice - priceChange24h;
          
          totalCurrentValue += holding.holdingAmount * currentPrice;
          total24hAgoValue += holding.holdingAmount * price24hAgo;
        }
      });

      const change = totalCurrentValue - total24hAgoValue;
      const percentage = total24hAgoValue > 0 ? (change / total24hAgoValue) * 100 : 0;

      return { change, percentage };
    } catch (error) {
      console.error('Error calculating 24h change:', error);
      return { change: 0, percentage: 0 };
    }
  }

  /**
   * Private helper methods
   */
  private calculateChangeMetrics(enrichedHoldings: Array<Holding & { 
    currentPrice: number;
    currentValue: number; 
    priceChangePercentage24h: number;
    priceChange24h: number;
  }>): ChangeMetrics {
    // For now, we only have 24h data from CoinGecko
    // TODO: Implement 7d and 30d calculations when historical data is available
    
    const totalCurrentValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const total24hAgoValue = enrichedHoldings.reduce((sum, h) => {
      // Use absolute price change for accuracy (same as calculate24hChange method)
      const price24hAgo = h.currentPrice - h.priceChange24h;
      return sum + (h.holdingAmount * price24hAgo);
    }, 0);

    const change24h = totalCurrentValue - total24hAgoValue;
    const changePercentage24h = total24hAgoValue > 0 ? (change24h / total24hAgoValue) * 100 : 0;

    return {
      change24h,
      changePercentage24h,
      change7d: 0, // TODO: Implement when historical data available
      changePercentage7d: 0,
      change30d: 0,
      changePercentage30d: 0,
    };
  }

  private getEmptyPortfolio(): PortfolioAnalytics {
    return {
      summary: {
        totalValue: 0,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdingsCount: 0,
        lastUpdated: new Date(),
      },
      changeMetrics: {
        change24h: 0,
        changePercentage24h: 0,
        change7d: 0,
        changePercentage7d: 0,
        change30d: 0,
        changePercentage30d: 0,
      },
      topPerformer: null,
      worstPerformer: null,
      holdings: [],
    };
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();