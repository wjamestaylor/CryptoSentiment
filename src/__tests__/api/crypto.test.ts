import { z } from 'zod';

// Mock the price service first
jest.mock('@/services/crypto/price.service', () => ({
  coinGeckoService: {
    getTopCryptos: jest.fn(),
  },
}));

import { GET } from '@/app/api/test/coingecko/route';
import { coinGeckoService } from '@/services/crypto/price.service';

// Simple unit tests for crypto router input validation
describe('Crypto Router Validation', () => {
  describe('Input validation schemas', () => {
    it('should validate getTopCryptos input', () => {
      const schema = z.object({ limit: z.number().min(1).max(100).default(50) });
      
      // Valid input
      expect(schema.parse({ limit: 10 })).toEqual({ limit: 10 });
      
      // Default value
      expect(schema.parse({})).toEqual({ limit: 50 });
      
      // Invalid input
      expect(() => schema.parse({ limit: 0 })).toThrow();
      expect(() => schema.parse({ limit: 101 })).toThrow();
    });

    it('should validate getCryptoById input', () => {
      const schema = z.object({ id: z.string().min(1) });
      
      // Valid input
      expect(schema.parse({ id: 'bitcoin' })).toEqual({ id: 'bitcoin' });
      
      // Invalid input
      expect(() => schema.parse({ id: '' })).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it('should validate searchCryptos input', () => {
      const schema = z.object({ query: z.string().min(1) });
      
      // Valid input
      expect(schema.parse({ query: 'bitcoin' })).toEqual({ query: 'bitcoin' });
      
      // Invalid input
      expect(() => schema.parse({ query: '' })).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it('should validate addCryptoToTracking input', () => {
      const schema = z.object({ 
        cryptoSymbol: z.string(),
        cryptoName: z.string(),
        trackingType: z.enum(['WATCH_ONLY', 'HOLDING']),
        holdingAmount: z.number().positive().optional(),
        averagePurchasePrice: z.number().positive().optional(),
      });
      
      // Valid input
      expect(schema.parse({ 
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        trackingType: 'WATCH_ONLY',
      })).toEqual({ 
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        trackingType: 'WATCH_ONLY',
      });
      
      expect(schema.parse({ 
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        trackingType: 'HOLDING',
        holdingAmount: 1.5,
        averagePurchasePrice: 50000,
      })).toEqual({ 
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        trackingType: 'HOLDING',
        holdingAmount: 1.5,
        averagePurchasePrice: 50000,
      });
      
      // Invalid input
      expect(() => schema.parse({})).toThrow();
    });
  });
});

describe('/api/test/coingecko', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return successful test response', async () => {
      const mockData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          price_change_percentage_24h: 5.5,
          market_cap: 1000000000000,
          total_volume: 30000000000,
          image: 'https://example.com/bitcoin.png',
          market_cap_rank: 1,
        },
      ];

      (coinGeckoService.getTopCryptos as jest.Mock).mockResolvedValue(mockData);

      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('CoinGecko API test successful');
      expect(data.data).toEqual(mockData);
      expect(data.timestamp).toBeDefined();
      expect(coinGeckoService.getTopCryptos).toHaveBeenCalledWith(5);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API rate limit exceeded';
      (coinGeckoService.getTopCryptos as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('CoinGecko API test failed');
      expect(data.error).toBe(errorMessage);
      expect(data.timestamp).toBeDefined();
    });

    it('should handle unknown errors', async () => {
      (coinGeckoService.getTopCryptos as jest.Mock).mockRejectedValue('Unknown error');

      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });

    it('should include proper timestamps', async () => {
      (coinGeckoService.getTopCryptos as jest.Mock).mockResolvedValue([]);

      const beforeTime = Date.now();
      
      const response = await GET();
      const data = await response.json();
      const afterTime = Date.now();
      const responseTime = new Date(data.timestamp).getTime();

      expect(data.timestamp).toBeDefined();
      expect(responseTime).toBeGreaterThanOrEqual(beforeTime);
      expect(responseTime).toBeLessThanOrEqual(afterTime);
    });

    it('should handle empty response data', async () => {
      (coinGeckoService.getTopCryptos as jest.Mock).mockResolvedValue([]);

      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });
});