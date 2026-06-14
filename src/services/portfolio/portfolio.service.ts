/**
 * Unified Portfolio Service
 * 
 * Centralizes all portfolio calculations with live price integration
 * to ensure consistency across Dashboard, CryptoManager, and Analytics pages.
 */

import { CoinGeckoService, type CoinGeckoPriceData } from '../crypto/price.service';
import { HistoricalPriceService } from '../crypto/historical-price.service';
import { prisma } from '@/lib/db/prisma';

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
  coinGeckoId: string | null;
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
  private historicalService: HistoricalPriceService;

  constructor() {
    this.priceService = new CoinGeckoService();
    this.historicalService = new HistoricalPriceService(prisma);
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
        // Don't catch errors here - let them propagate to the caller
        // This ensures dashboard doesn't show $0 values on API failure
        priceData = await this.priceService.getCurrentPrices(coinGeckoIds);
        
        // Validate that we got price data
        if (!priceData || priceData.length === 0) {
          throw new Error('No price data returned from API');
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
      const changeMetrics = await this.calculateChangeMetrics(enrichedHoldings);

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
      
      // Re-throw error instead of returning empty portfolio
      // This prevents dashboard from showing misleading $0 values
      throw new Error(`Failed to calculate portfolio analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        // Don't catch errors - let them propagate
        priceData = await this.priceService.getCurrentPrices(coinGeckoIds);
        
        // Validate that we got price data
        if (!priceData || priceData.length === 0) {
          throw new Error('No price data returned from API');
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
      
      // Re-throw error instead of returning fallback values
      throw new Error(`Failed to calculate portfolio summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  private async calculateChangeMetrics(enrichedHoldings: Array<Holding & { 
    currentPrice: number;
    currentValue: number; 
    priceChangePercentage24h: number;
    priceChange24h: number;
  }>): Promise<ChangeMetrics> {
    const totalCurrentValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    
    // Calculate 24h change (using CoinGecko data)
    const total24hAgoValue = enrichedHoldings.reduce((sum, h) => {
      const price24hAgo = h.currentPrice - h.priceChange24h;
      return sum + (h.holdingAmount * price24hAgo);
    }, 0);
    const change24h = totalCurrentValue - total24hAgoValue;
    const changePercentage24h = total24hAgoValue > 0 ? (change24h / total24hAgoValue) * 100 : 0;

    // Calculate 7d and 30d changes using historical data
    const [change7d, change30d] = await Promise.all([
      this.calculateHistoricalChange(enrichedHoldings, 7),
      this.calculateHistoricalChange(enrichedHoldings, 30),
    ]);

    return {
      change24h,
      changePercentage24h,
      change7d: change7d.change,
      changePercentage7d: change7d.percentage,
      change30d: change30d.change,
      changePercentage30d: change30d.percentage,
    };
  }

  /**
   * Calculate portfolio change over a historical period using stored data
   */
  private async calculateHistoricalChange(
    holdings: Array<Holding & { currentValue: number; holdingAmount: number; coinGeckoId: string | null }>,
    days: number
  ): Promise<{ change: number; percentage: number }> {
    try {
      const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      
      // Calculate value at the past date
      const pastValues = await Promise.all(
        holdings.map(async (holding) => {
          if (!holding.coinGeckoId) return 0;
          
          const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          const pastPrice = await this.historicalService.getPriceAtTime(holding.coinGeckoId, pastDate);
          
          return pastPrice ? holding.holdingAmount * pastPrice : 0;
        })
      );
      
      const totalPastValue = pastValues.reduce((sum, val) => sum + val, 0);
      
      if (totalPastValue === 0) {
        return { change: 0, percentage: 0 };
      }
      
      const change = totalCurrentValue - totalPastValue;
      const percentage = (change / totalPastValue) * 100;
      
      return { change, percentage };
    } catch (error) {
      console.error(`Failed to calculate ${days}d historical change:`, error);
      return { change: 0, percentage: 0 };
    }
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