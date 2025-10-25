/**
 * Exchange Import Services Tests
 */

import { CoinbaseImportService } from '@/services/portfolio/coinbase-import.service';
import { BinanceImportService } from '@/services/portfolio/binance-import.service';

describe('CoinbaseImportService', () => {
  let service: CoinbaseImportService;

  beforeEach(() => {
    service = new CoinbaseImportService();
    jest.clearAllMocks();
  });

  describe('getExchangeName', () => {
    it('should return Coinbase', () => {
      expect(service.getExchangeName()).toBe('Coinbase');
    });
  });

  describe('verifyCredentials', () => {
    it('should return false for missing API key', async () => {
      const result = await service.verifyCredentials({
        apiKey: '',
        apiSecret: 'test-secret',
      });

      expect(result).toBe(false);
    });

    it('should return false for missing API secret', async () => {
      const result = await service.verifyCredentials({
        apiKey: 'test-key',
        apiSecret: '',
      });

      expect(result).toBe(false);
    });

    it('should make API request with valid credentials', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.verifyCredentials({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for failed API request', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.verifyCredentials({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(result).toBe(false);
    });
  });

  describe('fetchHoldings', () => {
    it('should return error for invalid credentials', async () => {
      const result = await service.fetchHoldings({
        apiKey: '',
        apiSecret: '',
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should parse holdings from API response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              currency: { code: 'BTC' },
              balance: { amount: '0.5' },
              available_balance: { amount: '0.5' },
            },
            {
              currency: { code: 'ETH' },
              balance: { amount: '2.0' },
              available_balance: { amount: '1.5' },
            },
          ],
        }),
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.fetchHoldings({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(result.success).toBe(true);
      expect(result.holdings).toHaveLength(2);
      expect(result.holdings[0]).toEqual({
        symbol: 'BTC',
        amount: 0.5,
        availableAmount: 0.5,
        lockedAmount: 0,
      });
    });

    it('should filter out zero balances', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              currency: { code: 'BTC' },
              balance: { amount: '0.5' },
              available_balance: { amount: '0.5' },
            },
            {
              currency: { code: 'ETH' },
              balance: { amount: '0' },
              available_balance: { amount: '0' },
            },
          ],
        }),
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.fetchHoldings({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(result.success).toBe(true);
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0]?.symbol).toBe('BTC');
    });

    it('should handle API errors', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.fetchHoldings({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('BinanceImportService', () => {
  let service: BinanceImportService;

  beforeEach(() => {
    service = new BinanceImportService();
    jest.clearAllMocks();
  });

  describe('getExchangeName', () => {
    it('should return Binance', () => {
      expect(service.getExchangeName()).toBe('Binance');
    });
  });

  describe('verifyCredentials', () => {
    it('should return false for missing credentials', async () => {
      const result = await service.verifyCredentials({
        apiKey: '',
        apiSecret: '',
      });

      expect(result).toBe(false);
    });

    it('should make API request with valid credentials', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.verifyCredentials({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('fetchHoldings', () => {
    it('should parse holdings from API response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balances: [
            {
              asset: 'BTC',
              free: '0.5',
              locked: '0',
            },
            {
              asset: 'ETH',
              free: '1.5',
              locked: '0.5',
            },
          ],
        }),
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.fetchHoldings({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(result.success).toBe(true);
      expect(result.holdings).toHaveLength(2);
      expect(result.holdings[0]).toEqual({
        symbol: 'BTC',
        amount: 0.5,
        availableAmount: 0.5,
        lockedAmount: 0,
      });
      expect(result.holdings[1]).toEqual({
        symbol: 'ETH',
        amount: 2.0,
        availableAmount: 1.5,
        lockedAmount: 0.5,
      });
    });

    it('should filter out zero balances', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balances: [
            {
              asset: 'BTC',
              free: '0.5',
              locked: '0',
            },
            {
              asset: 'ETH',
              free: '0',
              locked: '0',
            },
          ],
        }),
      });
      global.fetch = mockFetch as jest.Mock;

      const result = await service.fetchHoldings({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });

      expect(result.success).toBe(true);
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0]?.symbol).toBe('BTC');
    });
  });
});
