import { PortfolioService } from '../portfolio/portfolio.service';
import { CoinGeckoService } from './price.service';

// Base CryptoTracking interface matching Prisma schema
export interface CryptoTrackingEntry {
  id: string;
  isWatching: boolean;
  holdingAmount: number | null;
  averagePurchasePrice: number | null;
  totalInvested: number | null;
  firstPurchaseDate: Date | null;
  notes: string | null;
  tags: string[];
  lastViewedAt: Date;
  addedAt: Date;
  crypto: {
    id: string;
    symbol: string;
    name: string;
    coinGeckoId: string | null;
    logoUrl: string | null;
    marketCap: number | null;
    rank: number | null;
  };
}

// Enhanced tracking interface with live price data
export interface EnhancedCryptoTracking extends CryptoTrackingEntry {
  // Enhanced fields with live data
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
}

export interface EnhancedTrackingSummary {
  totalTracked: number;
  totalWatching: number;
  totalHoldings: number;
  totalInvested: number;
  // Enhanced summary with live data
  currentPortfolioValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  topPerformer: {
    symbol: string;
    name: string;
    gainLossPercentage: number;
  } | null;
}

export class CryptoManagerService {
  private portfolioService: PortfolioService;
  private coinGeckoService: CoinGeckoService;

  constructor() {
    this.portfolioService = new PortfolioService();
    this.coinGeckoService = new CoinGeckoService();
  }

  /**
   * Get enhanced tracking data with live prices and performance metrics
   */
  async getEnhancedCryptoTracking(
    trackingEntries: CryptoTrackingEntry[],
    filter: 'ALL' | 'WATCHING_ONLY' | 'HOLDINGS_ONLY' = 'ALL'
  ): Promise<{
    trackingEntries: EnhancedCryptoTracking[];
    summary: EnhancedTrackingSummary;
  }> {
    try {
      // Get unique coinGeckoIds for price fetching
      const coinGeckoIds = trackingEntries
        .map(entry => entry.crypto.coinGeckoId)
        .filter((id): id is string => Boolean(id));

      // Fetch current prices for all tracked cryptos
      const priceData = coinGeckoIds.length > 0 
        ? await this.coinGeckoService.getCurrentPrices(coinGeckoIds)
        : [];

      // Create price lookup map
      const priceMap = new Map(
        priceData.map(price => [price.id, price])
      );

      // Enhance tracking entries with live data
      const enhancedEntries: EnhancedCryptoTracking[] = trackingEntries.map(entry => {
        const enhanced: EnhancedCryptoTracking = {
          ...entry,
          isWatching: !entry.holdingAmount,
        };

        // Add live price data if available
        const coinGeckoId = entry.crypto.coinGeckoId;
        if (coinGeckoId && priceMap.has(coinGeckoId)) {
          const priceInfo = priceMap.get(coinGeckoId)!;
          enhanced.currentPrice = priceInfo.current_price;
          enhanced.priceChange24h = priceInfo.price_change_24h;
          enhanced.priceChangePercentage24h = priceInfo.price_change_percentage_24h;

          // Calculate current value and performance for holdings
          if (entry.holdingAmount && enhanced.currentPrice) {
            enhanced.currentValue = entry.holdingAmount * enhanced.currentPrice;
            
            // Use totalInvested from database for accurate gain/loss calculation
            // This accounts for fees, partial purchases, and manual adjustments
            const actualInvestedAmount = entry.totalInvested || 0;
            if (actualInvestedAmount > 0) {
              enhanced.gainLoss = enhanced.currentValue - actualInvestedAmount;
              enhanced.gainLossPercentage = (enhanced.gainLoss / actualInvestedAmount) * 100;
            } else {
              // Fallback to averagePurchasePrice calculation if totalInvested is missing
              if (entry.averagePurchasePrice && entry.averagePurchasePrice > 0) {
                const calculatedInvested = entry.holdingAmount * entry.averagePurchasePrice;
                enhanced.gainLoss = enhanced.currentValue - calculatedInvested;
                enhanced.gainLossPercentage = (enhanced.gainLoss / calculatedInvested) * 100;
              } else {
                enhanced.gainLoss = 0;
                enhanced.gainLossPercentage = 0;
              }
            }
          }
        }

        return enhanced;
      });

      // Apply filtering
      const filteredEntries = this.applyFilter(enhancedEntries, filter);

      // Calculate enhanced summary
      const summary = this.calculateEnhancedSummary(enhancedEntries);

      return {
        trackingEntries: filteredEntries,
        summary,
      };
    } catch (error) {
      console.error('Error getting enhanced crypto tracking:', error);
      throw new Error(`Failed to get enhanced crypto tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get enhanced summary for CryptoManager dashboard
   */
  async getEnhancedSummary(trackingEntries: CryptoTrackingEntry[]): Promise<EnhancedTrackingSummary> {
    try {
      const enhanced = await this.getEnhancedCryptoTracking(trackingEntries, 'ALL');
      return enhanced.summary;
    } catch (error) {
      console.error('Error calculating enhanced summary:', error);
      throw new Error(`Failed to calculate enhanced summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current portfolio value for holdings
   */
  async getCurrentPortfolioValue(trackingEntries: CryptoTrackingEntry[]): Promise<number> {
    try {
      const holdingEntries = trackingEntries.filter(entry => entry.holdingAmount);
      
      if (holdingEntries.length === 0) {
        return 0;
      }

      // Convert to Portfolio Service format
      const holdings = holdingEntries.map(entry => ({
        id: entry.id,
        cryptoSymbol: entry.crypto.symbol,
        cryptoName: entry.crypto.name,
        coinGeckoId: entry.crypto.coinGeckoId || '',
        holdingAmount: entry.holdingAmount || 0,
        averagePurchasePrice: entry.averagePurchasePrice || 0,
        totalInvested: entry.totalInvested || 0,
        firstPurchaseDate: entry.firstPurchaseDate || new Date(),
        notes: entry.notes || '',
        tags: entry.tags || [],
      }));

      const summary = await this.portfolioService.getPortfolioSummary(holdings);
      return summary.totalValue;
    } catch (error) {
      console.error('Error calculating current portfolio value:', error);
      return 0;
    }
  }

  /**
   * Calculate portfolio performance metrics
   */
  async getPortfolioPerformance(trackingEntries: CryptoTrackingEntry[]): Promise<{
    totalGainLoss: number;
    totalGainLossPercentage: number;
    topPerformer: { symbol: string; name: string; gainLossPercentage: number } | null;
  }> {
    try {
      const holdingEntries = trackingEntries.filter(entry => entry.holdingAmount);
      
      if (holdingEntries.length === 0) {
        return {
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          topPerformer: null,
        };
      }

      // Convert to Portfolio Service format
      const holdings = holdingEntries.map(entry => ({
        id: entry.id,
        cryptoSymbol: entry.crypto.symbol,
        cryptoName: entry.crypto.name,
        coinGeckoId: entry.crypto.coinGeckoId || '',
        holdingAmount: entry.holdingAmount || 0,
        averagePurchasePrice: entry.averagePurchasePrice || 0,
        totalInvested: entry.totalInvested || 0,
        firstPurchaseDate: entry.firstPurchaseDate || new Date(),
        notes: entry.notes || '',
        tags: entry.tags || [],
      }));

      // Get portfolio analytics
      const analytics = await this.portfolioService.calculatePortfolioAnalytics(holdings);
      const topPerformer = await this.portfolioService.getTopPerformer(holdings);

      return {
        totalGainLoss: analytics.summary.totalGainLoss,
        totalGainLossPercentage: analytics.summary.totalGainLossPercentage,
        topPerformer: topPerformer ? {
          symbol: topPerformer.cryptoSymbol,
          name: topPerformer.cryptoName,
          gainLossPercentage: topPerformer.gainLossPercentage,
        } : null,
      };
    } catch (error) {
      console.error('Error calculating portfolio performance:', error);
      return {
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        topPerformer: null,
      };
    }
  }

  private applyFilter(
    entries: EnhancedCryptoTracking[],
    filter: 'ALL' | 'WATCHING_ONLY' | 'HOLDINGS_ONLY'
  ): EnhancedCryptoTracking[] {
    switch (filter) {
      case 'WATCHING_ONLY':
        return entries.filter(entry => !entry.holdingAmount);
      case 'HOLDINGS_ONLY':
        return entries.filter(entry => entry.holdingAmount);
      default:
        return entries;
    }
  }

  private calculateEnhancedSummary(entries: EnhancedCryptoTracking[]): EnhancedTrackingSummary {
    const holdings = entries.filter(entry => entry.holdingAmount);
    const watching = entries.filter(entry => !entry.holdingAmount);

    // Calculate totals
    const totalInvested = holdings.reduce((sum, entry) => 
      sum + (entry.totalInvested || 0), 0
    );

    const currentPortfolioValue = holdings.reduce((sum, entry) => 
      sum + (entry.currentValue || 0), 0
    );

    const totalGainLoss = currentPortfolioValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 
      ? (totalGainLoss / totalInvested) * 100 
      : 0;

    // Find top performer
    const topPerformer = holdings
      .filter(entry => entry.gainLossPercentage !== undefined)
      .reduce((best, current) => {
        if (!best || (current.gainLossPercentage! > best.gainLossPercentage!)) {
          return current;
        }
        return best;
      }, null as EnhancedCryptoTracking | null);

    return {
      totalTracked: entries.length,
      totalWatching: watching.length,
      totalHoldings: holdings.length,
      totalInvested,
      currentPortfolioValue,
      totalGainLoss,
      totalGainLossPercentage,
      topPerformer: topPerformer ? {
        symbol: topPerformer.crypto.symbol,
        name: topPerformer.crypto.name,
        gainLossPercentage: topPerformer.gainLossPercentage!,
      } : null,
    };
  }
}