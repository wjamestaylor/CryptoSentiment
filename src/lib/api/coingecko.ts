import { z } from 'zod';

// Environment variable for CoinGecko API key (optional for free tier)
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Response schemas for type safety
export const CoinGeckoCoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  price_change_percentage_7d: z.number().nullable(),
  price_change_percentage_30d: z.number().nullable(),
  total_volume: z.number(),
  circulating_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
});

export const CoinGeckoListResponseSchema = z.array(CoinGeckoCoinSchema);
export const CoinGeckoDetailSchema = CoinGeckoCoinSchema.extend({
  description: z.object({
    en: z.string(),
  }),
  links: z.object({
    homepage: z.array(z.string()),
    blockchain_site: z.array(z.string()),
  }),
  market_data: z.object({
    current_price: z.object({
      usd: z.number(),
    }),
    price_change_percentage_24h: z.number().nullable(),
    price_change_percentage_7d: z.number().nullable(),
    price_change_percentage_30d: z.number().nullable(),
    market_cap: z.object({
      usd: z.number(),
    }),
    total_volume: z.object({
      usd: z.number(),
    }),
  }),
});

export type CoinGeckoCoin = z.infer<typeof CoinGeckoCoinSchema>;
export type CoinGeckoDetail = z.infer<typeof CoinGeckoDetailSchema>;

class CoinGeckoError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'CoinGeckoError';
  }
}

export class CoinGeckoService {
  private baseUrl = COINGECKO_BASE_URL;
  private apiKey = COINGECKO_API_KEY;

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.set('x_cg_demo_api_key', this.apiKey);
    }

    // Add other parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new CoinGeckoError(
          `CoinGecko API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof CoinGeckoError) {
        throw error;
      }
      throw new CoinGeckoError(`Failed to fetch from CoinGecko: ${error}`);
    }
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit: number = 50): Promise<CoinGeckoCoin[]> {
    const data = await this.request<unknown>('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'false',
      price_change_percentage: '24h,7d,30d',
    });

    return CoinGeckoListResponseSchema.parse(data);
  }

  /**
   * Get detailed information about a specific cryptocurrency
   */
  async getCoinById(coinId: string): Promise<CoinGeckoDetail> {
    const data = await this.request<unknown>(`/coins/${coinId}`, {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false',
      sparkline: 'false',
    });

    return CoinGeckoDetailSchema.parse(data);
  }

  /**
   * Search for cryptocurrencies by name or symbol
   */
  async searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string }>> {
    const data = await this.request<{ coins: Array<{ id: string; name: string; symbol: string }> }>('/search', {
      query,
    });

    return data.coins || [];
  }

  /**
   * Get price data for multiple cryptocurrencies
   */
  async getMultiplePrices(coinIds: string[]): Promise<Record<string, { usd: number }>> {
    const data = await this.request<Record<string, { usd: number }>>('/simple/price', {
      ids: coinIds.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true',
    });

    return data;
  }

  /**
   * Get historical price data for a cryptocurrency
   */
  async getHistoricalPrices(coinId: string, days: number = 30): Promise<Array<[number, number]>> {
    const data = await this.request<{ prices: Array<[number, number]> }>(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days.toString(),
      interval: days > 90 ? 'daily' : 'hourly',
    });

    return data.prices || [];
  }
}

// Export singleton instance
export const coinGeckoService = new CoinGeckoService();