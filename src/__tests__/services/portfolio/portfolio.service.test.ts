/**
 * Portfolio Service Tests
 * 
 * Tests for the unified portfolio service that centralizes all portfolio calculations
 * with live price integration for consistency across pages.
 */

import { PortfolioService, type Holding } from '../../../services/portfolio/portfolio.service';
import { CoinGeckoService } from '../../../services/crypto/price.service';
import { HistoricalPriceService } from '../../../services/crypto/historical-price.service';

// Mock the services
jest.mock('../../../services/crypto/price.service');
jest.mock('../../../services/crypto/historical-price.service');

const MockedCoinGeckoService = CoinGeckoService as jest.MockedClass<typeof CoinGeckoService>;
const MockedHistoricalPriceService = HistoricalPriceService as jest.MockedClass<typeof HistoricalPriceService>;

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let mockCoinGeckoService: jest.Mocked<CoinGeckoService>;
  let mockHistoricalPriceService: jest.Mocked<HistoricalPriceService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock instance for CoinGecko
    mockCoinGeckoService = {
      getCurrentPrices: jest.fn(),
      getTopCryptos: jest.fn(),
      getCryptoById: jest.fn(),
      searchCryptos: jest.fn(),
    } as unknown as jest.Mocked<CoinGeckoService>;

    // Create a mock instance for HistoricalPrice
    mockHistoricalPriceService = {
      getPriceAtTime: jest.fn().mockResolvedValue(null),
      fetchAndStoreHistory: jest.fn(),
      getHistoricalData: jest.fn(),
      calculatePriceChange: jest.fn(),
      bulkFetchAndStore: jest.fn(),
      getTrackedCryptocurrencies: jest.fn(),
      hasRecentData: jest.fn(),
    } as unknown as jest.Mocked<HistoricalPriceService>;

    // Mock the constructors to return our mock instances
    MockedCoinGeckoService.mockImplementation(() => mockCoinGeckoService);
    MockedHistoricalPriceService.mockImplementation(() => mockHistoricalPriceService);
    
    portfolioService = new PortfolioService();
  });

  describe('calculatePortfolioAnalytics', () => {
    it('should return empty portfolio for no holdings', async () => {
      const result = await portfolioService.calculatePortfolioAnalytics([]);

      expect(result.summary.totalValue).toBe(0);
      expect(result.summary.totalInvested).toBe(0);
      expect(result.summary.holdingsCount).toBe(0);
      expect(result.topPerformer).toBe(null);
      expect(result.holdings).toEqual([]);
    });

    it('should calculate correct portfolio analytics with live prices', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 1,
          averagePurchasePrice: 30000,
          totalInvested: 30000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: 'Initial purchase',
          tags: ['long-term'],
        },
        {
          id: '2',
          cryptoSymbol: 'ETH',
          cryptoName: 'Ethereum',
          coinGeckoId: 'ethereum',
          holdingAmount: 10,
          averagePurchasePrice: 2000,
          totalInvested: 20000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: 'DCA purchases',
          tags: ['defi'],
        },
      ];

      const mockPriceData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 45000,
          price_change_24h: 2000,
          price_change_percentage_24h: 4.65,
          market_cap: 900000000000,
          total_volume: 25000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2500,
          price_change_24h: 100,
          price_change_percentage_24h: 4.17,
          market_cap: 300000000000,
          total_volume: 15000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockResolvedValue(mockPriceData);

      const result = await portfolioService.calculatePortfolioAnalytics(mockHoldings);

      // Check summary calculations
      expect(result.summary.totalValue).toBe(70000); // (1 * 45000) + (10 * 2500)
      expect(result.summary.totalInvested).toBe(50000); // 30000 + 20000
      expect(result.summary.totalGainLoss).toBe(20000); // 70000 - 50000
      expect(result.summary.totalGainLossPercentage).toBe(40); // (20000 / 50000) * 100
      expect(result.summary.holdingsCount).toBe(2);

      // Check individual holdings calculations
      expect(result.holdings).toHaveLength(2);
      
      const btcHolding = result.holdings.find(h => h.cryptoSymbol === 'BTC');
      expect(btcHolding?.currentValue).toBe(45000);
      expect(btcHolding?.gainLoss).toBe(15000);
      expect(btcHolding?.gainLossPercentage).toBe(50);

      const ethHolding = result.holdings.find(h => h.cryptoSymbol === 'ETH');
      expect(ethHolding?.currentValue).toBe(25000);
      expect(ethHolding?.gainLoss).toBe(5000);
      expect(ethHolding?.gainLossPercentage).toBe(25);

      // Check top performer
      expect(result.topPerformer?.cryptoSymbol).toBe('BTC');
      expect(result.topPerformer?.gainLossPercentage).toBe(50);
    });

    it('should throw errors when API fails', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 1,
          averagePurchasePrice: 30000,
          totalInvested: 30000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: 'Test holding',
          tags: [],
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockRejectedValue(new Error('API Error'));

      // The service should now throw errors instead of returning zero values
      await expect(portfolioService.calculatePortfolioAnalytics(mockHoldings))
        .rejects.toThrow('Failed to calculate portfolio analytics: API Error');
    });

    it('should throw error when price data is missing', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'UNKNOWN',
          cryptoName: 'Unknown Coin',
          coinGeckoId: 'unknown-coin',
          holdingAmount: 100,
          averagePurchasePrice: 1,
          totalInvested: 100,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: 'Test holding',
          tags: [],
        },
      ];

      // Return empty price data
      mockCoinGeckoService.getCurrentPrices.mockResolvedValue([]);

      // Should throw error instead of returning zero values
      await expect(portfolioService.calculatePortfolioAnalytics(mockHoldings))
        .rejects.toThrow('Failed to calculate portfolio analytics: No price data returned from API');
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return summary for empty portfolio', async () => {
      const result = await portfolioService.getPortfolioSummary([]);

      expect(result.totalValue).toBe(0);
      expect(result.totalInvested).toBe(0);
      expect(result.totalGainLoss).toBe(0);
      expect(result.holdingsCount).toBe(0);
    });

    it('should calculate portfolio summary correctly', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 0.5,
          averagePurchasePrice: 40000,
          totalInvested: 20000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: '',
          tags: [],
        },
      ];

      const mockPriceData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          price_change_24h: 2000,
          price_change_percentage_24h: 4.17,
          market_cap: 1000000000000,
          total_volume: 30000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockResolvedValue(mockPriceData);

      const result = await portfolioService.getPortfolioSummary(mockHoldings);

      expect(result.totalValue).toBe(25000); // 0.5 * 50000
      expect(result.totalInvested).toBe(20000);
      expect(result.totalGainLoss).toBe(5000);
      expect(result.totalGainLossPercentage).toBe(25);
      expect(result.holdingsCount).toBe(1);
    });
  });

  describe('calculateHoldingValue', () => {
    it('should calculate holding value correctly', async () => {
      const mockHolding: Holding = {
        id: '1',
        cryptoSymbol: 'ETH',
        cryptoName: 'Ethereum',
        coinGeckoId: 'ethereum',
        holdingAmount: 5,
        averagePurchasePrice: 2000,
        totalInvested: 10000,
        firstPurchaseDate: new Date('2024-01-01'),
        notes: '',
        tags: [],
      };

      const mockPriceData = [
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3000,
          price_change_24h: 100,
          price_change_percentage_24h: 3.45,
          market_cap: 360000000000,
          total_volume: 20000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockResolvedValue(mockPriceData);

      const result = await portfolioService.calculateHoldingValue(mockHolding);

      expect(result).toBe(15000); // 5 * 3000
    });

    it('should return 0 for holdings without coinGeckoId', async () => {
      const mockHolding: Holding = {
        id: '1',
        cryptoSymbol: 'UNKNOWN',
        cryptoName: 'Unknown Coin',
        coinGeckoId: null,
        holdingAmount: 100,
        averagePurchasePrice: 1,
        totalInvested: 100,
        firstPurchaseDate: new Date('2024-01-01'),
        notes: '',
        tags: [],
      };

      const result = await portfolioService.calculateHoldingValue(mockHolding);

      expect(result).toBe(0);
      expect(mockCoinGeckoService.getCurrentPrices).not.toHaveBeenCalled();
    });
  });

  describe('calculate24hChange', () => {
    it('should calculate 24h change correctly', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 1,
          averagePurchasePrice: 30000,
          totalInvested: 30000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: '',
          tags: [],
        },
      ];

      const mockPriceData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          price_change_24h: 2000, // Price increased by $2000 in 24h
          price_change_percentage_24h: 4.17,
          market_cap: 1000000000000,
          total_volume: 30000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockResolvedValue(mockPriceData);

      const result = await portfolioService.calculate24hChange(mockHoldings);

      // Current value: 1 * 50000 = 50000
      // 24h ago value: 1 * (50000 - 2000) = 48000  
      // Change: 50000 - 48000 = 2000
      // Percentage: (2000 / 48000) * 100 = 4.17%
      expect(result.change).toBe(2000);
      expect(result.percentage).toBeCloseTo(4.17, 1);
    });

    it('should return zero change for empty holdings', async () => {
      const result = await portfolioService.calculate24hChange([]);

      expect(result.change).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 1,
          averagePurchasePrice: 30000,
          totalInvested: 30000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: '',
          tags: [],
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockRejectedValue(new Error('Network error'));

      // The service should now throw errors instead of returning zero values
      await expect(portfolioService.calculatePortfolioAnalytics(mockHoldings))
        .rejects.toThrow('Failed to calculate portfolio analytics: Network error');

      // calculate24hChange should still handle errors gracefully
      const changeResult = await portfolioService.calculate24hChange(mockHoldings);
      expect(changeResult).toEqual({ change: 0, percentage: 0 });
    });

    it('should handle malformed price data', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 1,
          averagePurchasePrice: 30000,
          totalInvested: 30000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: '',
          tags: [],
        },
      ];

      // Return malformed data (missing required fields)
      mockCoinGeckoService.getCurrentPrices.mockResolvedValue([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 0, // Invalid price
          price_change_24h: 0,
          price_change_percentage_24h: 0,
          market_cap: 0,
          total_volume: 0,
          last_updated: '2024-01-15T12:00:00Z',
        },
      ]);

      const result = await portfolioService.calculatePortfolioAnalytics(mockHoldings);

      expect(result.summary.totalValue).toBe(0); // Should handle 0 price gracefully
      expect(result.holdings[0].currentValue).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain data consistency across different calculation methods', async () => {
      const mockHoldings: Holding[] = [
        {
          id: '1',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          coinGeckoId: 'bitcoin',
          holdingAmount: 0.5,
          averagePurchasePrice: 40000,
          totalInvested: 20000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: '',
          tags: [],
        },
        {
          id: '2',
          cryptoSymbol: 'ETH',
          cryptoName: 'Ethereum',
          coinGeckoId: 'ethereum',
          holdingAmount: 8,
          averagePurchasePrice: 2500,
          totalInvested: 20000,
          firstPurchaseDate: new Date('2024-01-01'),
          notes: '',
          tags: [],
        },
      ];

      const mockPriceData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 48000,
          price_change_24h: 1000,
          price_change_percentage_24h: 2.13,
          market_cap: 950000000000,
          total_volume: 28000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3000,
          price_change_24h: 150,
          price_change_percentage_24h: 5.26,
          market_cap: 360000000000,
          total_volume: 18000000000,
          last_updated: '2024-01-15T12:00:00Z',
        },
      ];

      mockCoinGeckoService.getCurrentPrices.mockResolvedValue(mockPriceData);

      // Get results from both methods
      const fullAnalytics = await portfolioService.calculatePortfolioAnalytics(mockHoldings);
      const summaryOnly = await portfolioService.getPortfolioSummary(mockHoldings);

      // Both should return identical summary data
      expect(fullAnalytics.summary.totalValue).toBe(summaryOnly.totalValue);
      expect(fullAnalytics.summary.totalInvested).toBe(summaryOnly.totalInvested);
      expect(fullAnalytics.summary.totalGainLoss).toBe(summaryOnly.totalGainLoss);
      expect(fullAnalytics.summary.totalGainLossPercentage).toBe(summaryOnly.totalGainLossPercentage);
      expect(fullAnalytics.summary.holdingsCount).toBe(summaryOnly.holdingsCount);

      // Verify expected calculations
      const expectedTotalValue = (0.5 * 48000) + (8 * 3000); // 24000 + 24000 = 48000
      const expectedTotalInvested = 20000 + 20000; // 40000
      const expectedGainLoss = expectedTotalValue - expectedTotalInvested; // 8000
      
      expect(summaryOnly.totalValue).toBe(expectedTotalValue);
      expect(summaryOnly.totalInvested).toBe(expectedTotalInvested);
      expect(summaryOnly.totalGainLoss).toBe(expectedGainLoss);
    });
  });
});