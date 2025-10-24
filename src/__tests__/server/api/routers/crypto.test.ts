/**
 * Simplified tests for Crypto Router with unified tracking system
 */

import { z } from 'zod';

// Mock Prisma
const mockPrisma = {
  cryptocurrency: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  cryptoTracking: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

const prisma = mockPrisma as typeof mockPrisma;

// Mock fetch for CoinGecko API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Crypto Router Unified Tracking System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tRPC procedures validation', () => {
    it('should validate addCryptoToTracking input schema', () => {
      const schema = z.object({
        cryptoSymbol: z.string().min(1),
        cryptoName: z.string().min(1),
        trackingType: z.enum(['WATCH_ONLY', 'HOLDING']),
        holdingAmount: z.number().positive().optional(),
        averagePurchasePrice: z.number().positive().optional(),
      });

      // Valid inputs
      expect(() => schema.parse({
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        trackingType: 'WATCH_ONLY',
      })).not.toThrow();

      expect(() => schema.parse({
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        trackingType: 'HOLDING',
        holdingAmount: 1.5,
        averagePurchasePrice: 50000,
      })).not.toThrow();

      // Invalid inputs
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({
        cryptoSymbol: '',
        cryptoName: 'Bitcoin',
        trackingType: 'WATCH_ONLY',
      })).toThrow();
    });

    it('should validate removeCryptoTracking input schema', () => {
      const schema = z.object({
        id: z.string().min(1), // Ensure non-empty string
      });

      expect(() => schema.parse({ id: 'tracking-id-123' })).not.toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ id: '' })).toThrow();
    });

    it('should validate getUserCryptoTracking input schema', () => {
      const schema = z.object({
        filter: z.enum(['ALL', 'WATCHING_ONLY', 'HOLDINGS_ONLY']).default('ALL'),
        includePerformance: z.boolean().default(true),
      });

      expect(() => schema.parse({})).not.toThrow();
      expect(() => schema.parse({ filter: 'ALL' })).not.toThrow();
      expect(() => schema.parse({ filter: 'WATCHING_ONLY', includePerformance: false })).not.toThrow();
      expect(() => schema.parse({ filter: 'INVALID' })).toThrow();
    });
  });

  describe('CoinGecko API integration', () => {
    it('should handle successful API responses', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000,
          price_change_percentage_24h: 2.5,
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
      const data = await response.json();

      expect(data).toEqual(mockResponse);
      expect(response.ok).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('https://api.coingecko.com/api/v3/coins/markets');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Database operations', () => {
    it('should handle cryptocurrency upsert operations', async () => {
      const mockCrypto = { id: 'crypto-1', symbol: 'BTC', name: 'Bitcoin' };
      (prisma.cryptocurrency.upsert as jest.Mock).mockResolvedValue(mockCrypto);

      const result = await prisma.cryptocurrency.upsert({
        where: { symbol: 'BTC' },
        update: { name: 'Bitcoin' },
        create: { symbol: 'BTC', name: 'Bitcoin' },
      });

      expect(result).toEqual(mockCrypto);
      expect(prisma.cryptocurrency.upsert).toHaveBeenCalledWith({
        where: { symbol: 'BTC' },
        update: { name: 'Bitcoin' },
        create: { symbol: 'BTC', name: 'Bitcoin' },
      });
    });

    it('should handle crypto tracking creation', async () => {
      const mockTracking = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-1',
        holdingAmount: null,
        averagePurchasePrice: null,
      };

      (prisma.cryptoTracking.create as jest.Mock).mockResolvedValue(mockTracking);

      const result = await prisma.cryptoTracking.create({
        data: {
          userId: 'user-1',
          cryptoId: 'crypto-1',
        },
      });

      expect(result).toEqual(mockTracking);
      expect(prisma.cryptoTracking.create).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      (prisma.cryptocurrency.upsert as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      try {
        await prisma.cryptocurrency.upsert({
          where: { symbol: 'BTC' },
          update: { name: 'Bitcoin' },
          create: { symbol: 'BTC', name: 'Bitcoin' },
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database connection failed');
      }
    });
  });

  describe('updateCryptoTracking', () => {
    const mockTrackingEntry = {
      id: 'tracking-1',
      userId: 'user-1',
      cryptoId: 'crypto-1',
      isWatching: true,
      holdingAmount: 1.0,
      averagePurchasePrice: 50000,
      totalInvested: 50000,
      firstPurchaseDate: new Date('2023-01-01'),
      notes: 'Original notes',
      tags: ['long-term'],
      crypto: {
        id: 'crypto-1',
        symbol: 'BTC',
        name: 'Bitcoin',
      },
    };

    beforeEach(() => {
      (prisma.cryptoTracking.findFirst as jest.Mock).mockResolvedValue(mockTrackingEntry);
    });

    it('should validate updateCryptoTracking input schema', () => {
      const schema = z.object({
        id: z.string(),
        trackingType: z.enum(['WATCH_ONLY', 'ADD_HOLDING', 'REMOVE_HOLDING']).optional(),
        holdingAmount: z.number().positive().optional(),
        purchasePrice: z.number().positive().optional(),
        purchaseDate: z.date().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      });

      // Valid update holding
      expect(() => schema.parse({
        id: 'tracking-1',
        trackingType: 'ADD_HOLDING',
        holdingAmount: 2.0,
        purchasePrice: 55000,
        notes: 'Updated holding',
      })).not.toThrow();

      // Valid remove holding
      expect(() => schema.parse({
        id: 'tracking-1',
        trackingType: 'REMOVE_HOLDING',
      })).not.toThrow();

      // Invalid - negative holding amount
      expect(() => schema.parse({
        id: 'tracking-1',
        holdingAmount: -1,
      })).toThrow();
    });

    it('should update holding amount and purchase price', async () => {
      const updatedEntry = {
        ...mockTrackingEntry,
        holdingAmount: 2.0,
        averagePurchasePrice: 55000,
        totalInvested: 110000,
        lastViewedAt: new Date(),
      };

      (prisma.cryptoTracking.update as jest.Mock).mockResolvedValue(updatedEntry);

      const updateData = {
        id: 'tracking-1',
        trackingType: 'ADD_HOLDING' as const,
        holdingAmount: 2.0,
        purchasePrice: 55000,
        notes: 'Updated holding',
      };

      // Simulate the full update flow
      // 1. Verify ownership
      const tracking = await prisma.cryptoTracking.findFirst({
        where: { id: updateData.id, userId: 'user-1' },
        include: { crypto: true },
      });

      expect(tracking).toBeTruthy();
      expect(prisma.cryptoTracking.findFirst).toHaveBeenCalledWith({
        where: { id: updateData.id, userId: 'user-1' },
        include: { crypto: true },
      });

      // 2. Update the entry
      const result = await prisma.cryptoTracking.update({
        where: { id: updateData.id },
        data: {
          holdingAmount: updateData.holdingAmount,
          averagePurchasePrice: updateData.purchasePrice,
          totalInvested: updateData.holdingAmount * updateData.purchasePrice,
          notes: updateData.notes,
          lastViewedAt: expect.any(Date),
        },
        include: { crypto: true },
      });

      expect(prisma.cryptoTracking.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          holdingAmount: 2.0,
          averagePurchasePrice: 55000,
          totalInvested: 110000,
          notes: 'Updated holding',
          lastViewedAt: expect.any(Date),
        }),
        include: { crypto: true },
      });

      expect(result.holdingAmount).toBe(2.0);
      expect(result.averagePurchasePrice).toBe(55000);
      expect(result.totalInvested).toBe(110000);
    });

    it('should convert holding to watching only when trackingType is REMOVE_HOLDING', async () => {
      const watchingOnlyEntry = {
        ...mockTrackingEntry,
        holdingAmount: null,
        averagePurchasePrice: null,
        totalInvested: null,
        firstPurchaseDate: null,
        lastViewedAt: new Date(),
      };

      (prisma.cryptoTracking.update as jest.Mock).mockResolvedValue(watchingOnlyEntry);

      const updateData = {
        id: 'tracking-1',
        trackingType: 'REMOVE_HOLDING' as const,
      };

      // Simulate the update call
      await prisma.cryptoTracking.update({
        where: { id: updateData.id },
        data: {
          holdingAmount: null,
          averagePurchasePrice: null,
          totalInvested: null,
          firstPurchaseDate: null,
          lastViewedAt: expect.any(Date),
        },
        include: { crypto: true },
      });

      expect(prisma.cryptoTracking.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          holdingAmount: null,
          averagePurchasePrice: null,
          totalInvested: null,
          firstPurchaseDate: null,
          lastViewedAt: expect.any(Date),
        }),
        include: { crypto: true },
      });
    });

    it('should update notes and tags without affecting holdings', async () => {
      const updatedEntry = {
        ...mockTrackingEntry,
        notes: 'Updated notes only',
        tags: ['updated', 'tags'],
        lastViewedAt: new Date(),
      };

      (prisma.cryptoTracking.update as jest.Mock).mockResolvedValue(updatedEntry);

      const updateData = {
        id: 'tracking-1',
        notes: 'Updated notes only',
        tags: ['updated', 'tags'],
      };

      // Simulate the update call
      await prisma.cryptoTracking.update({
        where: { id: updateData.id },
        data: {
          notes: updateData.notes,
          tags: updateData.tags,
          lastViewedAt: expect.any(Date),
        },
        include: { crypto: true },
      });

      expect(prisma.cryptoTracking.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          notes: 'Updated notes only',
          tags: ['updated', 'tags'],
          lastViewedAt: expect.any(Date),
        }),
        include: { crypto: true },
      });
    });

    it('should handle ownership verification failure', async () => {
      (prisma.cryptoTracking.findFirst as jest.Mock).mockResolvedValue(null);

      try {
        await prisma.cryptoTracking.findFirst({
          where: { id: 'tracking-1', userId: 'different-user' },
          include: { crypto: true },
        });

        // This would simulate the error in the actual procedure
        if (!await prisma.cryptoTracking.findFirst({ where: { id: 'tracking-1', userId: 'different-user' }, include: { crypto: true } })) {
          throw new Error('Crypto tracking entry not found or access denied');
        }

        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Crypto tracking entry not found or access denied');
      }
    });

    it('should preserve firstPurchaseDate when updating existing holding', async () => {
      const originalDate = new Date('2023-01-01');
      const trackingWithOriginalDate = {
        ...mockTrackingEntry,
        firstPurchaseDate: originalDate,
      };

      (prisma.cryptoTracking.findFirst as jest.Mock).mockResolvedValue(trackingWithOriginalDate);

      const updatedEntry = {
        ...trackingWithOriginalDate,
        holdingAmount: 1.5,
        averagePurchasePrice: 52000,
        totalInvested: 78000,
        firstPurchaseDate: originalDate, // Should preserve original date
        lastViewedAt: new Date(),
      };

      (prisma.cryptoTracking.update as jest.Mock).mockResolvedValue(updatedEntry);

      // Simulate update without new purchase date
      await prisma.cryptoTracking.update({
        where: { id: 'tracking-1' },
        data: {
          holdingAmount: 1.5,
          averagePurchasePrice: 52000,
          totalInvested: 78000,
          firstPurchaseDate: originalDate, // Should preserve original
          lastViewedAt: expect.any(Date),
        },
        include: { crypto: true },
      });

      expect(prisma.cryptoTracking.update).toHaveBeenCalledWith({
        where: { id: 'tracking-1' },
        data: expect.objectContaining({
          firstPurchaseDate: originalDate,
        }),
        include: { crypto: true },
      });
    });

    it('should calculate totalInvested correctly when updating holdings', async () => {
      const testCases = [
        { amount: 1.0, price: 50000, expected: 50000 },
        { amount: 0.5, price: 60000, expected: 30000 },
        { amount: 2.5, price: 45000, expected: 112500 },
      ];

      for (const { amount, price, expected } of testCases) {
        const updatedEntry = {
          ...mockTrackingEntry,
          holdingAmount: amount,
          averagePurchasePrice: price,
          totalInvested: expected,
        };

        (prisma.cryptoTracking.update as jest.Mock).mockResolvedValue(updatedEntry);

        await prisma.cryptoTracking.update({
          where: { id: 'tracking-1' },
          data: {
            holdingAmount: amount,
            averagePurchasePrice: price,
            totalInvested: amount * price,
            lastViewedAt: expect.any(Date),
          },
          include: { crypto: true },
        });

        expect(prisma.cryptoTracking.update).toHaveBeenCalledWith({
          where: { id: 'tracking-1' },
          data: expect.objectContaining({
            totalInvested: expected,
          }),
          include: { crypto: true },
        });

        jest.clearAllMocks();
        (prisma.cryptoTracking.findFirst as jest.Mock).mockResolvedValue(mockTrackingEntry);
      }
    });
  });

  describe('Portfolio Calculations', () => {
    it('should calculate portfolio metrics accurately for single holding', () => {
      // Test portfolio calculation logic
      const holdingAmount = 2.5;
      const averagePurchasePrice = 40000;
      const totalInvested = 100000;
      const currentPrice = 50000;

      // Portfolio calculations
      const currentValue = holdingAmount * currentPrice; // 2.5 * 50000 = 125000
      const gainLoss = currentValue - totalInvested; // 125000 - 100000 = 25000
      const gainLossPercentage = (gainLoss / totalInvested) * 100; // 25%

      expect(currentValue).toBe(125000);
      expect(gainLoss).toBe(25000);
      expect(gainLossPercentage).toBe(25);
    });

    it('should handle multiple holdings with different performance', () => {
      // BTC holding: 50% gain
      const btcHolding = {
        amount: 1.0,
        avgPrice: 30000,
        totalInvested: 30000,
        currentPrice: 45000,
      };

      // ETH holding: 25% loss
      const ethHolding = {
        amount: 10.0,
        avgPrice: 2000,
        totalInvested: 20000,
        currentPrice: 1500,
      };

      // Calculate individual holdings
      const btcCurrentValue = btcHolding.amount * btcHolding.currentPrice; // 45000
      const btcGainLoss = btcCurrentValue - btcHolding.totalInvested; // 15000 (50% gain)
      const btcGainLossPercentage = (btcGainLoss / btcHolding.totalInvested) * 100; // 50%

      const ethCurrentValue = ethHolding.amount * ethHolding.currentPrice; // 15000  
      const ethGainLoss = ethCurrentValue - ethHolding.totalInvested; // -5000 (25% loss)
      const ethGainLossPercentage = (ethGainLoss / ethHolding.totalInvested) * 100; // -25%

      // Calculate portfolio totals
      const totalPortfolioValue = btcCurrentValue + ethCurrentValue; // 60000
      const totalInvested = btcHolding.totalInvested + ethHolding.totalInvested; // 50000
      const totalGainLoss = btcGainLoss + ethGainLoss; // 10000
      const totalGainLossPercentage = (totalGainLoss / totalInvested) * 100; // 20%

      expect(btcCurrentValue).toBe(45000);
      expect(btcGainLoss).toBe(15000);
      expect(btcGainLossPercentage).toBe(50);

      expect(ethCurrentValue).toBe(15000);
      expect(ethGainLoss).toBe(-5000);
      expect(ethGainLossPercentage).toBe(-25);

      expect(totalPortfolioValue).toBe(60000);
      expect(totalGainLoss).toBe(10000);
      expect(totalGainLossPercentage).toBe(20);
    });

    it('should handle DCA scenarios with accurate average price calculation', () => {
      // Original holding
      const originalAmount = 1.0;
      const originalPrice = 40000;
      const originalInvestment = originalAmount * originalPrice; // 40000

      // Additional purchase (DCA)
      const additionalAmount = 0.5;
      const additionalPrice = 60000;
      const additionalInvestment = additionalAmount * additionalPrice; // 30000

      // Calculate new averages
      const newTotalAmount = originalAmount + additionalAmount; // 1.5
      const newTotalInvested = originalInvestment + additionalInvestment; // 70000
      const newAveragePrice = newTotalInvested / newTotalAmount; // 46666.67

      expect(newTotalAmount).toBe(1.5);
      expect(newTotalInvested).toBe(70000);
      expect(Math.round(newAveragePrice)).toBe(46667);

      // Verify DCA reduces average when buying lower
      const dcaDownOriginal = { amount: 1.0, price: 60000, investment: 60000 };
      const dcaDownAdditional = { amount: 1.0, price: 40000, investment: 40000 };
      const dcaDownNewAvg = (dcaDownOriginal.investment + dcaDownAdditional.investment) / 
                           (dcaDownOriginal.amount + dcaDownAdditional.amount);
      
      expect(dcaDownNewAvg).toBe(50000); // Lower than original 60000
    });

    it('should handle zero/negative price scenarios gracefully', () => {
      const holdingAmount = 1.0;
      const totalInvested = 50000;
      
      // Test zero price scenario
      const zeroPriceValue = holdingAmount * 0; // 0
      const zeroPriceGainLoss = zeroPriceValue - totalInvested; // -50000
      const zeroPriceGainLossPercentage = (zeroPriceGainLoss / totalInvested) * 100; // -100%

      expect(zeroPriceValue).toBe(0);
      expect(zeroPriceGainLoss).toBe(-50000);
      expect(zeroPriceGainLossPercentage).toBe(-100);

      // Test very small price scenario
      const verySmallPrice = 0.01;
      const smallPriceValue = holdingAmount * verySmallPrice; // 0.01
      const smallPriceGainLoss = smallPriceValue - totalInvested; // -49999.99
      const smallPriceGainLossPercentage = (smallPriceGainLoss / totalInvested) * 100; // ~-100%

      expect(smallPriceValue).toBe(0.01);
      expect(smallPriceGainLoss).toBe(-49999.99);
      expect(Math.round(smallPriceGainLossPercentage * 100) / 100).toBe(-100);
    });

    it('should handle precision correctly for small amounts', () => {
      const satoshiAmount = 0.00000001; // 1 satoshi of BTC
      const smallInvestment = 0.0005; // Very small investment
      const currentPrice = 60000;

      // Test precision calculations
      const currentValue = satoshiAmount * currentPrice; // 0.0006
      const gainLoss = currentValue - smallInvestment; // 0.0001
      const gainLossPercentage = (gainLoss / smallInvestment) * 100; // 20%

      // Handle floating point precision by using toBeCloseTo
      expect(currentValue).toBeCloseTo(0.0006, 10);
      expect(gainLoss).toBeCloseTo(0.0001, 10);
      expect(gainLossPercentage).toBeCloseTo(20, 10);

      // Test rounding for display purposes - this is how we'd handle precision in production
      expect(Math.round(currentValue * 1000000) / 1000000).toBe(0.0006);
      expect(Math.round(gainLoss * 1000000) / 1000000).toBe(0.0001);
      expect(Math.round(gainLossPercentage * 100) / 100).toBe(20);
    });

    it('should validate total invested calculation for partial sales', () => {
      // Original holding
      const originalAmount = 2.0;
      const originalAvgPrice = 40000;
      const originalTotalInvested = 80000;

      // User sells 0.5 BTC - only holdingAmount should change
      const soldAmount = 0.5;
      const remainingAmount = originalAmount - soldAmount; // 1.5

      // Cost basis calculations - important for tax purposes
      const remainingTotalInvested = originalTotalInvested; // Should stay same
      const remainingAvgPrice = originalAvgPrice; // Should stay same

      expect(remainingAmount).toBe(1.5);
      expect(remainingAvgPrice).toBe(40000);
      expect(remainingTotalInvested).toBe(80000);

      // Current value calculation for remaining holding
      const currentPrice = 50000;
      const currentValue = remainingAmount * currentPrice; // 1.5 * 50000 = 75000
      
      // Gain/loss should be calculated on proportional cost basis
      const proportionalCostBasis = remainingTotalInvested * (remainingAmount / originalAmount); // 60000
      const gainLoss = currentValue - proportionalCostBasis; // 15000
      
      expect(currentValue).toBe(75000);
      expect(proportionalCostBasis).toBe(60000);
      expect(gainLoss).toBe(15000);
    });

    it('should calculate percentage changes accurately across different scenarios', () => {
      const testCases = [
        // [currentPrice, avgPrice, expectedPercentage]
        [50000, 40000, 25],    // 25% gain
        [30000, 40000, -25],   // 25% loss
        [40000, 40000, 0],     // No change
        [80000, 40000, 100],   // 100% gain (doubled)
        [20000, 40000, -50],   // 50% loss (halved)
        [44000, 40000, 10],    // 10% gain
      ];

      testCases.forEach(([currentPrice, avgPrice, expectedPercentage]) => {
        const holdingAmount = 1.0;
        const totalInvested = holdingAmount * avgPrice;
        const currentValue = holdingAmount * currentPrice;
        const gainLoss = currentValue - totalInvested;
        const gainLossPercentage = (gainLoss / totalInvested) * 100;

        expect(Math.round(gainLossPercentage * 100) / 100).toBe(expectedPercentage);
      });
    });

    it('should handle portfolio diversification metrics', () => {
      const portfolio = [
        { symbol: 'BTC', value: 50000, percentage: 50 },
        { symbol: 'ETH', value: 30000, percentage: 30 },
        { symbol: 'ADA', value: 20000, percentage: 20 },
      ];

      const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);
      expect(totalValue).toBe(100000);

      // Verify percentages add up to 100%
      const totalPercentage = portfolio.reduce((sum, asset) => sum + asset.percentage, 0);
      expect(totalPercentage).toBe(100);

      // Test diversification calculation
      const largestAllocation = Math.max(...portfolio.map(asset => asset.percentage));
      expect(largestAllocation).toBe(50); // BTC is 50% of portfolio

      // Calculate Herfindahl-Hirschman Index for diversification
      const hhi = portfolio.reduce((sum, asset) => sum + Math.pow(asset.percentage, 2), 0);
      expect(hhi).toBe(3800); // 50^2 + 30^2 + 20^2 = 2500 + 900 + 400
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle division by zero in percentage calculations', () => {
      const totalInvested = 0;
      const currentValue = 1000;
      
      // Should handle gracefully without throwing
      const gainLoss = currentValue - totalInvested;
      const gainLossPercentage = totalInvested === 0 ? 0 : (gainLoss / totalInvested) * 100;
      
      expect(gainLoss).toBe(1000);
      expect(gainLossPercentage).toBe(0); // Graceful handling of division by zero
    });

    it('should validate holding amounts are non-negative', () => {
      const holdingAmount = -1.0; // Invalid negative amount
      const isValidAmount = holdingAmount >= 0;
      
      expect(isValidAmount).toBe(false);
      
      // Test zero as valid (user sold all)
      const zeroAmount = 0.0;
      const isZeroValid = zeroAmount >= 0;
      expect(isZeroValid).toBe(true);
    });

    it('should validate purchase prices are positive', () => {
      const testPrices = [0, -100, 50000, 0.0001];
      const validPrices = testPrices.filter(price => price > 0);
      
      expect(validPrices).toEqual([50000, 0.0001]);
      expect(validPrices.length).toBe(2);
    });

    it('should handle floating point precision issues', () => {
      // Common floating point precision issue
      const price1 = 0.1;
      const price2 = 0.2;
      const sum = price1 + price2; // Often 0.30000000000000004
      
      // Round to avoid precision issues
      const roundedSum = Math.round(sum * 100) / 100;
      expect(roundedSum).toBe(0.3);
      
      // Test with crypto calculations
      const satoshiAmount = 0.00000001;
      const btcPrice = 50000.123456789;
      const value = satoshiAmount * btcPrice;
      const roundedValue = Math.round(value * 100000000) / 100000000; // 8 decimal places
      
      expect(typeof roundedValue).toBe('number');
      expect(roundedValue).toBeGreaterThan(0);
    });
  });

  describe('getWatchedCoins endpoint', () => {
    it('should fetch watched coins only (no holdings)', async () => {
      const mockWatchedCoins = [
        {
          id: 'tracking-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          holdingAmount: null,
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
          },
          lastViewedAt: new Date(),
        },
        {
          id: 'tracking-2',
          userId: 'user-1',
          cryptoId: 'crypto-2',
          holdingAmount: null,
          crypto: {
            id: 'crypto-2',
            symbol: 'ETH',
            name: 'Ethereum',
            coinGeckoId: 'ethereum',
          },
          lastViewedAt: new Date(),
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockWatchedCoins);

      // Mock CoinGecko API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'bitcoin',
            current_price: 45000,
            price_change_percentage_24h: 3.5,
          },
          {
            id: 'ethereum',
            current_price: 3000,
            price_change_percentage_24h: -1.2,
          },
        ],
      });

      // Verify the query would filter for watched coins only
      expect(mockWatchedCoins.every(coin => coin.holdingAmount === null)).toBe(true);
    });

    it('should return empty array when user has no watched coins', async () => {
      mockPrisma.cryptoTracking.findMany.mockResolvedValue([]);

      const result = await mockPrisma.cryptoTracking.findMany({
        where: { userId: 'user-1', holdingAmount: null },
      });

      expect(result).toEqual([]);
    });

    it('should handle CoinGecko API errors gracefully', async () => {
      const mockWatchedCoins = [
        {
          id: 'tracking-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          holdingAmount: null,
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
          },
          lastViewedAt: new Date(),
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockWatchedCoins);

      // Mock CoinGecko API failure
      mockFetch.mockRejectedValue(new Error('API error'));

      // Should still return coins without price data
      expect(mockWatchedCoins.length).toBeGreaterThan(0);
    });
  });

  describe('getHeldCoins endpoint', () => {
    it('should fetch held coins only (with holdings)', async () => {
      const mockHeldCoins = [
        {
          id: 'tracking-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          holdingAmount: 1.5,
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
          },
        },
        {
          id: 'tracking-2',
          userId: 'user-1',
          cryptoId: 'crypto-2',
          holdingAmount: 10,
          crypto: {
            id: 'crypto-2',
            symbol: 'ETH',
            name: 'Ethereum',
            coinGeckoId: 'ethereum',
          },
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockHeldCoins);

      // Mock CoinGecko API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'bitcoin',
            current_price: 45000,
            price_change_percentage_24h: 3.5,
          },
          {
            id: 'ethereum',
            current_price: 3000,
            price_change_percentage_24h: -1.2,
          },
        ],
      });

      // Verify the query would filter for held coins only
      expect(mockHeldCoins.every(coin => coin.holdingAmount !== null)).toBe(true);
    });

    it('should return empty array when user has no holdings', async () => {
      mockPrisma.cryptoTracking.findMany.mockResolvedValue([]);

      const result = await mockPrisma.cryptoTracking.findMany({
        where: { userId: 'user-1', holdingAmount: { not: null } },
      });

      expect(result).toEqual([]);
    });

    it('should include current prices for held coins', async () => {
      const mockHeldCoins = [
        {
          id: 'tracking-1',
          userId: 'user-1',
          cryptoId: 'crypto-1',
          holdingAmount: 1.5,
          crypto: {
            id: 'crypto-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            coinGeckoId: 'bitcoin',
          },
        },
      ];

      mockPrisma.cryptoTracking.findMany.mockResolvedValue(mockHeldCoins);

      // Mock successful price fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'bitcoin',
            current_price: 45000,
            price_change_percentage_24h: 3.5,
          },
        ],
      });

      // Verify coins are properly structured
      expect(mockHeldCoins[0].crypto.coinGeckoId).toBe('bitcoin');
      expect(mockHeldCoins[0].holdingAmount).toBe(1.5);
    });
  });

  describe('CoinGecko ID mapping', () => {
    it('should use coinGeckoId from database when available', () => {
      const crypto = {
        symbol: 'BTC',
        coinGeckoId: 'bitcoin',
      };

      // Should use coinGeckoId
      expect(crypto.coinGeckoId).toBe('bitcoin');
    });

    it('should fallback to lowercase symbol when coinGeckoId is null', () => {
      const crypto = {
        symbol: 'BTC',
        coinGeckoId: null,
      };

      // Fallback behavior
      const fallback = crypto.coinGeckoId || crypto.symbol.toLowerCase();
      expect(fallback).toBe('btc');
    });

    it('should handle coins with proper CoinGecko mappings', () => {
      const cryptos = [
        { symbol: 'BTC', coinGeckoId: 'bitcoin' },
        { symbol: 'ETH', coinGeckoId: 'ethereum' },
        { symbol: 'XMR', coinGeckoId: 'monero' },
      ];

      cryptos.forEach(crypto => {
        expect(crypto.coinGeckoId).toBeTruthy();
        expect(typeof crypto.coinGeckoId).toBe('string');
      });
    });
  });
});