import { OpenRouterService, SentimentAnalysisSchema } from '@/lib/api/openrouter';

// Mock fetch for testing
global.fetch = jest.fn();

describe('OpenRouterService', () => {
  let openRouterService: OpenRouterService;

  beforeEach(() => {
    openRouterService = new OpenRouterService();
    jest.clearAllMocks();
    // Mock environment variable
    process.env.OPENROUTER_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('analyzeSentiment', () => {
    const mockCryptoData = {
      cryptocurrency: 'bitcoin',
      priceData: {
        current_price: 50000,
        price_change_24h: 5.5,
        price_change_7d: 10.2,
        volume_24h: 30000000000
      },
      newsArticles: [
        {
          title: 'Bitcoin reaches new highs',
          content: 'Bitcoin continues its upward trend...',
          source: 'CryptoNews',
          publishedAt: '2025-10-10T12:00:00Z'
        }
      ],
      whaleActivities: [
        {
          amount: 1000000,
          type: 'buy' as const,
          timestamp: '2025-10-10T11:00:00Z'
        }
      ]
    };

    const mockAIResponse = {
      id: 'test-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'anthropic/claude-3.5-sonnet',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              sentiment: 'BULLISH',
              confidence: 0.85,
              score: 0.7,
              reasoning: 'Strong price momentum and positive whale activity',
              factors: [
                {
                  type: 'technical',
                  description: 'Price up 5.5% in 24h',
                  impact: 'positive',
                  weight: 0.8
                }
              ]
            })
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    };

    it('should analyze sentiment successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAIResponse,
      });

      const result = await openRouterService.analyzeSentiment(mockCryptoData);

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('anthropic/claude-3.5-sonnet')
        })
      );

      expect(result).toMatchObject({
        sentiment: 'BULLISH',
        confidence: 0.85,
        score: 0.7,
        reasoning: expect.any(String),
        factors: expect.any(Array)
      });
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      await expect(openRouterService.analyzeSentiment(mockCryptoData))
        .rejects.toThrow('OpenRouter API error');
    });

    it('should handle missing API key', async () => {
      // Mock the constructor to simulate missing API key
      const originalKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      
      // Create a new service instance without API key
      const serviceWithoutKey = new OpenRouterService();

      await expect(serviceWithoutKey.analyzeSentiment(mockCryptoData))
        .rejects.toThrow(/OpenRouter API key not configured|Failed to communicate with OpenRouter/);
      
      // Restore the original key
      process.env.OPENROUTER_API_KEY = originalKey;
    });

    it('should handle invalid AI response', async () => {
      const invalidResponse = {
        ...mockAIResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Invalid JSON response'
            },
            finish_reason: 'stop'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(openRouterService.analyzeSentiment(mockCryptoData))
        .rejects.toThrow('Failed to parse AI sentiment analysis');
    });

    it('should handle empty AI response', async () => {
      const emptyResponse = {
        ...mockAIResponse,
        choices: []
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      await expect(openRouterService.analyzeSentiment(mockCryptoData))
        .rejects.toThrow('No response content from AI model');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(openRouterService.analyzeSentiment(mockCryptoData))
        .rejects.toThrow('Failed to communicate with OpenRouter');
    });
  });

  describe('generateMarketSummary', () => {
    const mockCryptos = [
      {
        name: 'Bitcoin',
        symbol: 'BTC',
        price_change_24h: 5.5,
        volume_24h: 30000000000
      },
      {
        name: 'Ethereum',
        symbol: 'ETH',
        price_change_24h: -2.1,
        volume_24h: 15000000000
      }
    ];

    const mockSummaryResponse = {
      id: 'summary-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'openai/gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'The crypto market shows mixed signals with Bitcoin leading gains while Ethereum sees minor corrections.'
          },
          finish_reason: 'stop'
        }
      ]
    };

    it('should generate market summary successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummaryResponse,
      });

      const result = await openRouterService.generateMarketSummary(mockCryptos);

      expect(result).toBe('The crypto market shows mixed signals with Bitcoin leading gains while Ethereum sees minor corrections.');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('gpt-4o-mini')
        })
      );
    });

    it('should handle empty response gracefully', async () => {
      const emptyResponse = {
        ...mockSummaryResponse,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: ''
            },
            finish_reason: 'stop'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      const result = await openRouterService.generateMarketSummary(mockCryptos);

      expect(result).toBe('Unable to generate market summary');
    });
  });

  describe('SentimentAnalysisSchema', () => {
    it('should validate correct sentiment analysis', () => {
      const validData = {
        sentiment: 'BULLISH',
        confidence: 0.85,
        score: 0.7,
        reasoning: 'Strong fundamentals',
        factors: [
          {
            type: 'news',
            description: 'Positive news coverage',
            impact: 'positive',
            weight: 0.8
          }
        ]
      };

      expect(SentimentAnalysisSchema.parse(validData)).toEqual(validData);
    });

    it('should reject invalid sentiment values', () => {
      const invalidData = {
        sentiment: 'INVALID',
        confidence: 0.85,
        score: 0.7,
        reasoning: 'Test',
        factors: []
      };

      expect(() => SentimentAnalysisSchema.parse(invalidData)).toThrow();
    });

    it('should reject out-of-range confidence values', () => {
      const invalidData = {
        sentiment: 'BULLISH',
        confidence: 1.5, // Invalid: > 1
        score: 0.7,
        reasoning: 'Test',
        factors: []
      };

      expect(() => SentimentAnalysisSchema.parse(invalidData)).toThrow();
    });
  });
});