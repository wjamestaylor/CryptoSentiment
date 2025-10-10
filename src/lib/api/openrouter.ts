import { z } from 'zod';

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Response schemas for type safety
export const OpenRouterChatCompletionSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.string(),
      content: z.string(),
    }),
    finish_reason: z.string(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});

export const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']),
  confidence: z.number().min(0).max(1),
  score: z.number().min(-1).max(1),
  reasoning: z.string(),
  factors: z.array(z.object({
    type: z.enum(['news', 'whale_activity', 'technical', 'market']),
    description: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    weight: z.number().min(0).max(1),
  })),
});

export type OpenRouterChatCompletion = z.infer<typeof OpenRouterChatCompletionSchema>;
export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

class OpenRouterError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class OpenRouterService {
  private baseUrl = OPENROUTER_BASE_URL;
  private apiKey = OPENROUTER_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. AI features will be disabled.');
    }
  }

  private async request<T>(
    endpoint: string,
    data: Record<string, any>
  ): Promise<T> {
    if (!this.apiKey) {
      throw new OpenRouterError('OpenRouter API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'CryptoSentiment',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new OpenRouterError(
          `OpenRouter API error: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`,
          response.status
        );
      }

      const result = await response.json();
      return result as T;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(`Failed to communicate with OpenRouter: ${error}`);
    }
  }

  /**
   * Analyze cryptocurrency sentiment using AI
   */
  async analyzeSentiment(data: {
    cryptocurrency: string;
    priceData?: {
      current_price: number;
      price_change_24h: number;
      price_change_7d?: number;
      volume_24h: number;
    };
    newsArticles?: Array<{
      title: string;
      content: string;
      source: string;
      publishedAt: string;
    }>;
    whaleActivities?: Array<{
      amount: number;
      type: 'buy' | 'sell';
      timestamp: string;
    }>;
  }): Promise<SentimentAnalysis> {
    const prompt = this.buildSentimentPrompt(data);

    const completion = await this.request<OpenRouterChatCompletion>('/chat/completions', {
      model: 'anthropic/claude-3.5-sonnet', // High-quality model for analysis
      messages: [
        {
          role: 'system',
          content: `You are a professional cryptocurrency analyst with expertise in sentiment analysis. 
          Analyze the provided data and return a JSON response with sentiment analysis.
          Be objective, data-driven, and consider multiple factors.
          
          Response format:
          {
            "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
            "confidence": 0.0-1.0,
            "score": -1.0 to 1.0 (negative = bearish, positive = bullish),
            "reasoning": "Brief explanation of analysis",
            "factors": [
              {
                "type": "news" | "whale_activity" | "technical" | "market",
                "description": "Factor description",
                "impact": "positive" | "negative" | "neutral",
                "weight": 0.0-1.0
              }
            ]
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new OpenRouterError('No response content from AI model');
    }

    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
      const parsed = JSON.parse(jsonStr);
      
      return SentimentAnalysisSchema.parse(parsed);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseContent);
      throw new OpenRouterError(`Failed to parse AI sentiment analysis: ${parseError}`);
    }
  }

  /**
   * Build a comprehensive prompt for sentiment analysis
   */
  private buildSentimentPrompt(data: {
    cryptocurrency: string;
    priceData?: any;
    newsArticles?: any[];
    whaleActivities?: any[];
  }): string {
    let prompt = `Analyze the sentiment for ${data.cryptocurrency.toUpperCase()} based on the following data:\n\n`;

    // Price data analysis
    if (data.priceData) {
      prompt += `PRICE DATA:\n`;
      prompt += `- Current Price: $${data.priceData.current_price.toLocaleString()}\n`;
      prompt += `- 24h Change: ${data.priceData.price_change_24h?.toFixed(2)}%\n`;
      if (data.priceData.price_change_7d) {
        prompt += `- 7d Change: ${data.priceData.price_change_7d.toFixed(2)}%\n`;
      }
      prompt += `- 24h Volume: $${data.priceData.volume_24h?.toLocaleString()}\n\n`;
    }

    // News articles analysis
    if (data.newsArticles && data.newsArticles.length > 0) {
      prompt += `NEWS ARTICLES:\n`;
      data.newsArticles.slice(0, 5).forEach((article, index) => {
        prompt += `${index + 1}. Title: ${article.title}\n`;
        prompt += `   Source: ${article.source}\n`;
        prompt += `   Content: ${article.content.substring(0, 200)}...\n`;
        prompt += `   Published: ${article.publishedAt}\n\n`;
      });
    }

    // Whale activity analysis
    if (data.whaleActivities && data.whaleActivities.length > 0) {
      prompt += `WHALE ACTIVITIES:\n`;
      data.whaleActivities.slice(0, 5).forEach((activity, index) => {
        prompt += `${index + 1}. ${activity.type.toUpperCase()}: $${activity.amount.toLocaleString()}\n`;
        prompt += `   Time: ${activity.timestamp}\n\n`;
      });
    }

    prompt += `Please analyze this data and provide a comprehensive sentiment analysis with confidence scores.`;

    return prompt;
  }

  /**
   * Generate a quick sentiment summary for multiple cryptocurrencies
   */
  async generateMarketSummary(cryptos: Array<{
    name: string;
    symbol: string;
    price_change_24h: number;
    volume_24h: number;
  }>): Promise<string> {
    const prompt = `Generate a brief market sentiment summary for these cryptocurrencies:

${cryptos.map(crypto => 
  `${crypto.name} (${crypto.symbol}): ${crypto.price_change_24h >= 0 ? '+' : ''}${crypto.price_change_24h.toFixed(2)}% (Volume: $${crypto.volume_24h?.toLocaleString()})`
).join('\n')}

Provide a 2-3 sentence overall market sentiment summary.`;

    const completion = await this.request<OpenRouterChatCompletion>('/chat/completions', {
      model: 'openai/gpt-4o-mini', // Faster, cheaper model for summaries
      messages: [
        {
          role: 'system',
          content: 'You are a cryptocurrency market analyst. Provide concise, professional market summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate market summary';
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();