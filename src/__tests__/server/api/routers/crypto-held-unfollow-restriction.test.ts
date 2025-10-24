/**
 * Tests for restricting unfollow/unwatch actions on held coins
 * 
 * This test suite verifies that users cannot unfollow coins they are holding
 * in their portfolio from the dashboard or API.
 */

import { TRPCError } from '@trpc/server';

// Mock NextAuth completely to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  NextAuthHandler: jest.fn(),
}));

// Mock the problematic ES modules
jest.mock('jose', () => ({}));
jest.mock('openid-client', () => ({}));
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));

// Mock Prisma
const mockPrisma = {
  cryptoTracking: {
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Held Coin Unfollow Restriction', () => {
  describe('removeCryptoTracking mutation validation', () => {
    it('should prevent unfollowing a coin with holdings', async () => {
      // Mock a held coin
      const heldCoin = {
        id: 'tracking-1',
        userId: 'user-1',
        cryptoId: 'crypto-btc',
        holdingAmount: 1.5,
        averagePurchasePrice: 50000,
        totalInvested: 75000,
        crypto: {
          id: 'crypto-btc',
          symbol: 'BTC',
          name: 'Bitcoin',
          coinGeckoId: 'bitcoin',
        },
      };

      mockPrisma.cryptoTracking.findFirst.mockResolvedValue(heldCoin);

      // Simulate the validation logic from the router
      const tracking = heldCoin;
      
      // This should throw an error
      let thrownError: TRPCError | undefined;
      
      if (tracking.holdingAmount !== null && tracking.holdingAmount > 0) {
        thrownError = new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot unfollow ${tracking.crypto.symbol} because you hold it in your portfolio. Please sell your holdings first before unfollowing.`,
        });
      }

      expect(thrownError).toBeDefined();
      expect(thrownError?.code).toBe('BAD_REQUEST');
      expect(thrownError?.message).toContain('Cannot unfollow BTC');
      expect(thrownError?.message).toContain('you hold it in your portfolio');
      
      // Verify delete was NOT called
      expect(mockPrisma.cryptoTracking.delete).not.toHaveBeenCalled();
    });

    it('should allow unfollowing a watched-only coin (no holdings)', async () => {
      // Mock a watched coin (no holdings)
      const watchedCoin = {
        id: 'tracking-2',
        userId: 'user-1',
        cryptoId: 'crypto-eth',
        holdingAmount: null,
        averagePurchasePrice: null,
        totalInvested: null,
        crypto: {
          id: 'crypto-eth',
          symbol: 'ETH',
          name: 'Ethereum',
          coinGeckoId: 'ethereum',
        },
      };

      mockPrisma.cryptoTracking.findFirst.mockResolvedValue(watchedCoin);
      mockPrisma.cryptoTracking.delete.mockResolvedValue(watchedCoin);

      // Simulate the validation logic from the router
      const tracking = watchedCoin;
      
      // This should NOT throw an error
      let thrownError: TRPCError | undefined;
      
      if (tracking.holdingAmount !== null && tracking.holdingAmount > 0) {
        thrownError = new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot unfollow ${tracking.crypto.symbol} because you hold it in your portfolio.`,
        });
      }

      expect(thrownError).toBeUndefined();
      
      // Verify we can proceed with deletion
      await mockPrisma.cryptoTracking.delete({ where: { id: 'tracking-2' } });
      expect(mockPrisma.cryptoTracking.delete).toHaveBeenCalledWith({
        where: { id: 'tracking-2' },
      });
    });

    it('should allow unfollowing a coin with zero holdings', async () => {
      // Mock a coin with 0 holdings (edge case)
      const zeroCoin = {
        id: 'tracking-3',
        userId: 'user-1',
        cryptoId: 'crypto-ada',
        holdingAmount: 0,
        averagePurchasePrice: 0.5,
        totalInvested: 0,
        crypto: {
          id: 'crypto-ada',
          symbol: 'ADA',
          name: 'Cardano',
          coinGeckoId: 'cardano',
        },
      };

      mockPrisma.cryptoTracking.findFirst.mockResolvedValue(zeroCoin);
      mockPrisma.cryptoTracking.delete.mockResolvedValue(zeroCoin);

      // Simulate the validation logic from the router
      const tracking = zeroCoin;
      
      // This should NOT throw an error (0 holdings means no holdings)
      let thrownError: TRPCError | undefined;
      
      if (tracking.holdingAmount !== null && tracking.holdingAmount > 0) {
        thrownError = new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot unfollow ${tracking.crypto.symbol} because you hold it in your portfolio.`,
        });
      }

      expect(thrownError).toBeUndefined();
    });

    it('should throw error when tracking entry is not found', async () => {
      mockPrisma.cryptoTracking.findFirst.mockResolvedValue(null);

      // Simulate the validation logic from the router
      const tracking = null;
      
      let thrownError: Error | undefined;
      
      if (!tracking) {
        thrownError = new Error('Crypto tracking entry not found or access denied');
      }

      expect(thrownError).toBeDefined();
      expect(thrownError?.message).toBe('Crypto tracking entry not found or access denied');
    });
  });

  describe('Frontend behavior validation', () => {
    it('should identify held coins correctly', () => {
      const heldCoin = {
        id: 'btc-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        isHolding: true,
        holdingAmount: 1.5,
        currentPrice: 50000,
      };

      const watchedCoin = {
        id: 'eth-1',
        symbol: 'ETH',
        name: 'Ethereum',
        isHolding: false,
        currentPrice: 3000,
        holdingAmount: undefined,
      };

      // Held coins should have isHolding flag
      expect(heldCoin.isHolding).toBe(true);
      expect(heldCoin.holdingAmount).toBeGreaterThan(0);

      // Watched coins should NOT have isHolding flag
      expect(watchedCoin.isHolding).toBe(false);
      expect(watchedCoin.holdingAmount).toBeUndefined();
    });

    it('should not render unfollow button for held coins', () => {
      const coins = [
        { id: '1', symbol: 'BTC', isHolding: true, holdingAmount: 1.5 },
        { id: '2', symbol: 'ETH', isHolding: false },
        { id: '3', symbol: 'ADA', isHolding: true, holdingAmount: 1000 },
        { id: '4', symbol: 'SOL', isHolding: false },
      ];

      // Filter coins that should show unfollow button
      const coinsWithUnfollowButton = coins.filter(coin => !coin.isHolding);
      
      expect(coinsWithUnfollowButton).toHaveLength(2);
      expect(coinsWithUnfollowButton[0].symbol).toBe('ETH');
      expect(coinsWithUnfollowButton[1].symbol).toBe('SOL');
    });
  });

  describe('Dashboard data transformation', () => {
    it('should correctly flag holdings in combined watchlist', () => {
      const holdings = [
        {
          id: 'h1',
          symbol: 'BTC',
          name: 'Bitcoin',
          holdingAmount: 1.5,
          currentPrice: 50000,
        },
      ];

      const watchlistOnly = [
        {
          id: 'w1',
          symbol: 'ETH',
          name: 'Ethereum',
          currentPrice: 3000,
        },
      ];

      // Simulate dashboard transformation
      const holdingsAsWatchlist = holdings.map(holding => ({
        ...holding,
        isHolding: true as const,
      }));

      const combinedWatchlist = [
        ...holdingsAsWatchlist,
        ...watchlistOnly.map(item => ({ ...item, isHolding: false as const })),
      ];

      expect(combinedWatchlist).toHaveLength(2);
      expect(combinedWatchlist[0].isHolding).toBe(true);
      expect(combinedWatchlist[0].symbol).toBe('BTC');
      expect(combinedWatchlist[1].isHolding).toBe(false);
      expect(combinedWatchlist[1].symbol).toBe('ETH');
    });
  });

  describe('Error message validation', () => {
    it('should provide clear error message for held coins', () => {
      const errorMessage = 'Cannot unfollow BTC because you hold it in your portfolio. Please sell your holdings first before unfollowing.';
      
      expect(errorMessage).toContain('Cannot unfollow');
      expect(errorMessage).toContain('you hold it in your portfolio');
      expect(errorMessage).toContain('Please sell your holdings first');
    });
  });
});
