interface CoinGeckoResponse {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  total_volume: number
  image: string
}

export class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    // Only add API key if it exists (free tier doesn't need it)
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey
    }

    const response = await fetch(url, { 
      headers,
      // Add rate limiting delay for free tier
      cache: 'no-store',
    })

    if (!response.ok) {
      // Log the error for debugging
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      console.error(`URL: ${url}`)
      
      throw new Error(`CoinGecko API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getTopCryptos(limit: number = 10): Promise<CoinGeckoResponse[]> {
    return this.request<CoinGeckoResponse[]>(
      `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
    )
  }

  async getCryptoById(id: string): Promise<CoinGeckoResponse> {
    const response = await this.request<CoinGeckoResponse[]>(
      `/coins/markets?vs_currency=usd&ids=${id}&sparkline=false`
    )
    
    if (response.length === 0) {
      throw new Error(`Cryptocurrency not found: ${id}`)
    }
    
    return response[0]
  }

  async searchCryptos(query: string): Promise<{
    coins: Array<{ id: string; name: string; symbol: string; thumb: string }>;
    exchanges: Array<{ id: string; name: string; thumb: string }>;
    categories: Array<{ id: string; name: string }>;
  }> {
    return this.request(`/search?query=${encodeURIComponent(query)}`)
  }
}

export const coinGeckoService = new CoinGeckoService(process.env.COINGECKO_API_KEY)