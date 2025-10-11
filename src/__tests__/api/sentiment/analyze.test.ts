import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sentiment/analyze/route';

// Mock the OpenRouter service
jest.mock('@/lib/api/openrouter', () => ({
  OpenRouterService: jest.fn().mockImplementation(() => ({
    analyzeSentiment: jest.fn()
  }))
}));

// Mock global fetch for CoinGecko API
global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

// Helper to create mock request
const createMockRequest = (body: unknown) => {
  return new NextRequest('http://localhost:3000/api/sentiment/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

describe('/api/sentiment/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/sentiment/analyze', () => {
    it('should return 400 when cryptocurrency is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cryptocurrency is required');
    });

    it('should return 404 when cryptocurrency is not found in CoinGecko', async () => {
      // Mock CoinGecko API returning empty response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // Empty object means cryptocurrency not found
      });

      const request = createMockRequest({ cryptocurrency: 'invalid-coin' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Cryptocurrency not found');
      expect(data.details).toContain('No price data available');
    });

    it('should return 503 when CoinGecko API fails', async () => {
      // Mock CoinGecko API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = createMockRequest({ cryptocurrency: 'bitcoin' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Failed to retrieve cryptocurrency data');
      expect(data.details).toBe('Unable to connect to price data service');
    });

    it('should successfully analyze sentiment with real price data', async () => {
      // Mock successful CoinGecko API response
      const mockPriceData = {
        bitcoin: {
          usd: 45000,
          usd_24h_change: 2.5,
          usd_24h_vol: 25000000000,
          usd_market_cap: 850000000000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceData
      });

      // Mock successful OpenRouter sentiment analysis
      const { OpenRouterService } = require('@/lib/api/openrouter');
      const mockAnalyzeSentiment = jest.fn().mockResolvedValue({
        sentiment: 'BULLISH',
        confidence: 0.85,
        score: 0.7,
        reasoning: 'Strong market performance and positive indicators',
        factors: [
          {
            type: 'technical',
            description: 'Price showing upward momentum',
            impact: 'positive',
            weight: 0.8
          }
        ]
      });

      OpenRouterService.mockImplementation(() => ({
        analyzeSentiment: mockAnalyzeSentiment
      }));

      const request = createMockRequest({ cryptocurrency: 'bitcoin' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sentiment).toBe('BULLISH');
      expect(data.confidence).toBe(0.85);
      expect(data.score).toBe(0.7);
      expect(data.dataSource).toBe('live');
      expect(data.priceData).toEqual({
        current_price: 45000,
        price_change_24h: 2.5,
        volume_24h: 25000000000,
        market_cap: 850000000000
      });
      expect(data.timestamp).toBeDefined();
      expect(data.requestId).toBeDefined();

      // Verify OpenRouter service was called with correct data
      expect(mockAnalyzeSentiment).toHaveBeenCalledWith({
        cryptocurrency: 'bitcoin',
        priceData: {
          current_price: 45000,
          price_change_24h: 2.5,
          volume_24h: 25000000000,
          market_cap: 850000000000
        }
      });
    });

    it('should handle OpenRouter service errors gracefully', async () => {
      // Mock successful CoinGecko API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: {
            usd: 45000,
            usd_24h_change: 2.5,
            usd_24h_vol: 25000000000,
            usd_market_cap: 850000000000
          }
        })
      });

      // Mock OpenRouter service error
      const { OpenRouterService } = require('@/lib/api/openrouter');
      const mockAnalyzeSentiment = jest.fn().mockRejectedValue(
        new Error('OpenRouter API error')
      );

      OpenRouterService.mockImplementation(() => ({
        analyzeSentiment: mockAnalyzeSentiment
      }));

      const request = createMockRequest({ cryptocurrency: 'bitcoin' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze sentiment');
      expect(data.details).toBe('OpenRouter API error');
    });

    it('should handle missing price data fields gracefully', async () => {
      // Mock CoinGecko API response with missing fields
      const mockPriceData = {
        bitcoin: {
          usd: 45000
          // Missing other fields
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceData
      });

      // Mock successful OpenRouter sentiment analysis
      const { OpenRouterService } = require('@/lib/api/openrouter');
      const mockAnalyzeSentiment = jest.fn().mockResolvedValue({
        sentiment: 'NEUTRAL',
        confidence: 0.6,
        score: 0.0,
        reasoning: 'Limited data available',
        factors: []
      });

      OpenRouterService.mockImplementation(() => ({
        analyzeSentiment: mockAnalyzeSentiment
      }));

      const request = createMockRequest({ cryptocurrency: 'bitcoin' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.priceData).toEqual({
        current_price: 45000,
        price_change_24h: 0,
        volume_24h: 0,
        market_cap: 0
      });
    });

    it('should make correct CoinGecko API call', async () => {
      // Mock successful CoinGecko API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ethereum: {
            usd: 3000,
            usd_24h_change: -1.5,
            usd_24h_vol: 15000000000,
            usd_market_cap: 360000000000
          }
        })
      });

      // Mock OpenRouter service
      const { OpenRouterService } = require('@/lib/api/openrouter');
      OpenRouterService.mockImplementation(() => ({
        analyzeSentiment: jest.fn().mockResolvedValue({
          sentiment: 'BEARISH',
          confidence: 0.7,
          score: -0.3,
          reasoning: 'Price decline and market uncertainty',
          factors: []
        })
      }));

      const request = createMockRequest({ cryptocurrency: 'ethereum' });

      await POST(request);

      // Verify correct CoinGecko API call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true'
      );
    });

    it('should handle malformed request body', async () => {
      // Create a request with malformed JSON
      const request = new NextRequest('http://localhost:3000/api/sentiment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});