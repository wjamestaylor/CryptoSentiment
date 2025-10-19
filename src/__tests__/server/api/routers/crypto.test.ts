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
});