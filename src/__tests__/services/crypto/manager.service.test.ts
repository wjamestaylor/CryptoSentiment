import { CryptoManagerService, type CryptoTrackingEntry, type EnhancedCryptoTracking } from '../../../services/crypto/manager.service';
import { PortfolioService } from '../../../services/portfolio/portfolio.service';
import { CoinGeckoService } from '../../../services/crypto/price.service';

// Mock the dependencies
jest.mock('../../../services/portfolio/portfolio.service');
jest.mock('../../../services/crypto/price.service');

const mockPortfolioService = PortfolioService as jest.MockedClass<typeof PortfolioService>;
const mockCoinGeckoService = CoinGeckoService as jest.MockedClass<typeof CoinGeckoService>;

describe('CryptoManagerService', () => {
  let service: CryptoManagerService;
  let mockPortfolioInstance: jest.Mocked<PortfolioService>;
  let mockCoinGeckoInstance: jest.Mocked<CoinGeckoService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockPortfolioInstance = new mockPortfolioService() as jest.Mocked<PortfolioService>;
    mockCoinGeckoInstance = new mockCoinGeckoService() as jest.Mocked<CoinGeckoService>;
    
    // Mock the constructor to return our mock instances
    mockPortfolioService.mockImplementation(() => mockPortfolioInstance);
    mockCoinGeckoService.mockImplementation(() => mockCoinGeckoInstance);
    
    service = new CryptoManagerService();
  });

  const mockTrackingEntry: CryptoTrackingEntry = {
    id: 'tracking-1',
    isWatching: false,
    holdingAmount: 0.5,
    averagePurchasePrice: 45000,
    totalInvested: 22500,
    firstPurchaseDate: new Date('2024-01-01'),
    notes: 'Test holding',
    tags: ['Long-term'],
    lastViewedAt: new Date(),
    addedAt: new Date(),
    crypto: {
      id: 'crypto-1',
      symbol: 'BTC',
      name: 'Bitcoin',
      coinGeckoId: 'bitcoin',
      logoUrl: 'https://example.com/btc.png',
      marketCap: 1000000000,
      rank: 1,
    },
  };

  const mockWatchOnlyEntry: CryptoTrackingEntry = {
    id: 'tracking-2',
    isWatching: true,
    holdingAmount: null,
    averagePurchasePrice: null,
    totalInvested: null,
    firstPurchaseDate: null,
    notes: 'Watching for entry',
    tags: ['Research'],
    lastViewedAt: new Date(),
    addedAt: new Date(),
    crypto: {
      id: 'crypto-2',
      symbol: 'ETH',
      name: 'Ethereum',
      coinGeckoId: 'ethereum',
      logoUrl: 'https://example.com/eth.png',
      marketCap: 500000000,
      rank: 2,
    },
  };

  const mockPriceData = [
    {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      current_price: 67000,
      price_change_24h: 2000,
      price_change_percentage_24h: 3.08,
      market_cap: 1300000000000,
      total_volume: 25000000000,
      last_updated: '2025-10-18T12:00:00.000Z',
    },
    {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      current_price: 3500,
      price_change_24h: -100,
      price_change_percentage_24h: -2.78,
      market_cap: 420000000000,
      total_volume: 15000000000,
      last_updated: '2025-10-18T12:00:00.000Z',
    },
  ];

  describe('getEnhancedCryptoTracking', () => {
    beforeEach(() => {
      mockCoinGeckoInstance.getCurrentPrices.mockResolvedValue(mockPriceData);
    });

    it('should enhance tracking entries with live price data', async () => {
      const trackingEntries = [mockTrackingEntry, mockWatchOnlyEntry];
      
      const result = await service.getEnhancedCryptoTracking(trackingEntries);
      
      expect(result.trackingEntries).toHaveLength(2);
      
      // Check Bitcoin holding enhancement
      const btcEntry = result.trackingEntries.find((e: EnhancedCryptoTracking) => e.crypto.symbol === 'BTC');
      expect(btcEntry).toBeDefined();
      expect(btcEntry!.currentPrice).toBe(67000);
      expect(btcEntry!.currentValue).toBe(33500); // 0.5 * 67000
      expect(btcEntry!.gainLoss).toBe(11000); // 33500 - 22500
      expect(btcEntry!.gainLossPercentage).toBeCloseTo(48.89); // (11000 / 22500) * 100
      expect(btcEntry!.priceChangePercentage24h).toBe(3.08);
      
      // Check Ethereum watch-only enhancement
      const ethEntry = result.trackingEntries.find((e: EnhancedCryptoTracking) => e.crypto.symbol === 'ETH');
      expect(ethEntry).toBeDefined();
      expect(ethEntry!.currentPrice).toBe(3500);
      expect(ethEntry!.currentValue).toBeUndefined(); // No holdings
      expect(ethEntry!.gainLoss).toBeUndefined(); // No holdings
      expect(ethEntry!.priceChangePercentage24h).toBe(-2.78);
    });

    it('should filter entries correctly', async () => {
      const trackingEntries = [mockTrackingEntry, mockWatchOnlyEntry];
      
      // Test HOLDINGS_ONLY filter
      const holdingsResult = await service.getEnhancedCryptoTracking(trackingEntries, 'HOLDINGS_ONLY');
      expect(holdingsResult.trackingEntries).toHaveLength(1);
      expect(holdingsResult.trackingEntries[0].crypto.symbol).toBe('BTC');
      
      // Test WATCHING_ONLY filter
      const watchingResult = await service.getEnhancedCryptoTracking(trackingEntries, 'WATCHING_ONLY');
      expect(watchingResult.trackingEntries).toHaveLength(1);
      expect(watchingResult.trackingEntries[0].crypto.symbol).toBe('ETH');
      
      // Test ALL filter
      const allResult = await service.getEnhancedCryptoTracking(trackingEntries, 'ALL');
      expect(allResult.trackingEntries).toHaveLength(2);
    });

    it('should calculate enhanced summary correctly', async () => {
      const trackingEntries = [mockTrackingEntry, mockWatchOnlyEntry];
      
      const result = await service.getEnhancedCryptoTracking(trackingEntries);
      
      expect(result.summary.totalTracked).toBe(2);
      expect(result.summary.totalHoldings).toBe(1);
      expect(result.summary.totalWatching).toBe(1);
      expect(result.summary.totalInvested).toBe(22500);
      expect(result.summary.currentPortfolioValue).toBe(33500);
      expect(result.summary.totalGainLoss).toBe(11000);
      expect(result.summary.totalGainLossPercentage).toBeCloseTo(48.89);
      expect(result.summary.topPerformer).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        gainLossPercentage: expect.closeTo(48.89),
      });
    });

    it('should handle empty tracking entries', async () => {
      const result = await service.getEnhancedCryptoTracking([]);
      
      expect(result.trackingEntries).toHaveLength(0);
      expect(result.summary.totalTracked).toBe(0);
      expect(result.summary.currentPortfolioValue).toBe(0);
      expect(result.summary.totalGainLoss).toBe(0);
      expect(result.summary.topPerformer).toBeNull();
    });

    it('should handle entries without coinGeckoId', async () => {
      const entryWithoutCoinGeckoId: CryptoTrackingEntry = {
        ...mockTrackingEntry,
        crypto: { ...mockTrackingEntry.crypto, coinGeckoId: null },
      };
      
      mockCoinGeckoInstance.getCurrentPrices.mockResolvedValue([]);
      
      const result = await service.getEnhancedCryptoTracking([entryWithoutCoinGeckoId]);
      
      expect(result.trackingEntries).toHaveLength(1);
      const entry = result.trackingEntries[0];
      expect(entry.currentPrice).toBeUndefined();
      expect(entry.currentValue).toBeUndefined();
      // Service optimizes by not calling price API when no valid coinGeckoIds exist
    });

    it('should handle price service errors gracefully', async () => {
      mockCoinGeckoInstance.getCurrentPrices.mockRejectedValue(new Error('Price service error'));
      
      await expect(service.getEnhancedCryptoTracking([mockTrackingEntry])).rejects.toThrow('Failed to get enhanced crypto tracking');
    });
  });

  describe('getCurrentPortfolioValue', () => {
    beforeEach(() => {
      mockPortfolioInstance.getPortfolioSummary.mockResolvedValue({
        totalValue: 35000,
        totalInvested: 25000,
        totalGainLoss: 10000,
        totalGainLossPercentage: 40,
        holdingsCount: 1,
        lastUpdated: new Date(),
      });
    });

    it('should calculate current portfolio value for holdings', async () => {
      const trackingEntries = [mockTrackingEntry, mockWatchOnlyEntry];
      
      const result = await service.getCurrentPortfolioValue(trackingEntries);
      
      expect(result).toBe(35000);
      expect(mockPortfolioInstance.getPortfolioSummary).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'tracking-1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 0.5,
          averagePurchasePrice: 45000,
          totalInvested: 22500,
        }),
      ]);
    });

    it('should return 0 for empty holdings', async () => {
      const result = await service.getCurrentPortfolioValue([mockWatchOnlyEntry]);
      
      expect(result).toBe(0);
      expect(mockPortfolioInstance.getPortfolioSummary).not.toHaveBeenCalled();
    });

    it('should handle portfolio service errors', async () => {
      mockPortfolioInstance.getPortfolioSummary.mockRejectedValue(new Error('Portfolio error'));
      
      const result = await service.getCurrentPortfolioValue([mockTrackingEntry]);
      
      expect(result).toBe(0);
    });
  });

  describe('getPortfolioPerformance', () => {
    beforeEach(() => {
      mockPortfolioInstance.calculatePortfolioAnalytics.mockResolvedValue({
        summary: {
          totalValue: 35000,
          totalInvested: 25000,
          totalGainLoss: 10000,
          totalGainLossPercentage: 40,
          holdingsCount: 1,
          lastUpdated: new Date(),
        },
        changeMetrics: {
          change24h: 1000,
          changePercentage24h: 2.94,
          change7d: 3000,
          changePercentage7d: 9.38,
          change30d: 5000,
          changePercentage30d: 16.67,
        },
        topPerformer: {
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          currentPrice: 67000,
          holdingAmount: 0.5,
          currentValue: 33500,
          gainLoss: 11000,
          gainLossPercentage: 48.89,
          priceChangePercentage24h: 3.08,
        },
        worstPerformer: null,
        holdings: [],
      });

      mockPortfolioInstance.getTopPerformer.mockResolvedValue({
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        currentPrice: 67000,
        holdingAmount: 0.5,
        currentValue: 33500,
        gainLoss: 11000,
        gainLossPercentage: 48.89,
        priceChangePercentage24h: 3.08,
      });
    });

    it('should calculate portfolio performance metrics', async () => {
      const trackingEntries = [mockTrackingEntry];
      
      const result = await service.getPortfolioPerformance(trackingEntries);
      
      expect(result.totalGainLoss).toBe(10000);
      expect(result.totalGainLossPercentage).toBe(40);
      expect(result.topPerformer).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        gainLossPercentage: 48.89,
      });
    });

    it('should return zeros for empty holdings', async () => {
      const result = await service.getPortfolioPerformance([mockWatchOnlyEntry]);
      
      expect(result.totalGainLoss).toBe(0);
      expect(result.totalGainLossPercentage).toBe(0);
      expect(result.topPerformer).toBeNull();
    });

    it('should handle analytics errors', async () => {
      mockPortfolioInstance.calculatePortfolioAnalytics.mockRejectedValue(new Error('Analytics error'));
      
      const result = await service.getPortfolioPerformance([mockTrackingEntry]);
      
      expect(result.totalGainLoss).toBe(0);
      expect(result.totalGainLossPercentage).toBe(0);
      expect(result.topPerformer).toBeNull();
    });
  });

  describe('getEnhancedSummary', () => {
    it('should delegate to getEnhancedCryptoTracking', async () => {
      const trackingEntries = [mockTrackingEntry];
      mockCoinGeckoInstance.getCurrentPrices.mockResolvedValue(mockPriceData);
      
      const result = await service.getEnhancedSummary(trackingEntries);
      
      expect(result.totalTracked).toBe(1);
      expect(result.totalHoldings).toBe(1);
      expect(result.totalWatching).toBe(0);
    });

    it('should handle errors', async () => {
      mockCoinGeckoInstance.getCurrentPrices.mockRejectedValue(new Error('Price error'));
      
      await expect(service.getEnhancedSummary([mockTrackingEntry])).rejects.toThrow('Failed to calculate enhanced summary');
    });
  });
});