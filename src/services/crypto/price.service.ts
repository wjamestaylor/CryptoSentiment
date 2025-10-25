interface CoinGeckoResponse {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  price_change_24h?: number
  total_volume: number
  image: string
}

export interface CoinGeckoPriceData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  last_updated: string
}

export class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3'
  private apiKey?: string
  private lastRequestTime = 0
  private requestCache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds cache
  private readonly RATE_LIMIT_DELAY = 1200 // 1.2 seconds between requests for free tier

  constructor(apiKey?: string) {
    // Only use API key if it's not a placeholder
    this.apiKey = apiKey && apiKey !== 'your-coingecko-api-key' ? apiKey : undefined
  }

  async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Check cache first
    const cached = this.requestCache.get(url)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Using cached data for: ${endpoint}`)
      return cached.data
    }

    // Rate limiting for free tier
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest
      console.log(`Rate limiting: waiting ${delay}ms before request`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    // Only add API key if it exists and is not a placeholder
    if (this.apiKey) {
      headers['x-cg-demo-api-key'] = this.apiKey
    }

    try {
      this.lastRequestTime = Date.now()
      const response = await fetch(url, { 
        headers,
        cache: 'no-store',
      })

      if (!response.ok) {
        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          console.warn(`Rate limited by CoinGecko API. Waiting before retry...`)
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
          
          // Try once more after delay
          const retryResponse = await fetch(url, { headers, cache: 'no-store' })
          if (!retryResponse.ok) {
            console.error(`CoinGecko API error after retry: ${retryResponse.status} ${retryResponse.statusText}`)
            console.error(`URL: ${url}`)
            throw new Error(`CoinGecko API error: ${retryResponse.statusText}`)
          }
          
          const data = await retryResponse.json()
          this.requestCache.set(url, { data, timestamp: Date.now() })
          return data
        }

        // Log other errors
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`)
        console.error(`URL: ${url}`)
        
        throw new Error(`CoinGecko API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Cache successful response
      this.requestCache.set(url, { data, timestamp: Date.now() })
      
      return data
    } catch (error) {
      // Clear cache on error to avoid stale data
      this.requestCache.delete(url)
      throw error
    }
  }

  async getTopCryptos(limit: number = 10, currency: string = 'usd'): Promise<CoinGeckoResponse[]> {
    return this.request<CoinGeckoResponse[]>(
      `/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
    )
  }

  async getCryptoById(id: string, currency: string = 'usd'): Promise<CoinGeckoResponse> {
    const response = await this.request<CoinGeckoResponse[]>(
      `/coins/markets?vs_currency=${currency.toLowerCase()}&ids=${id}&sparkline=false`
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

  async getCurrentPrices(coinGeckoIds: string[], currency: string = 'usd'): Promise<CoinGeckoPriceData[]> {
    if (coinGeckoIds.length === 0) {
      return []
    }

    // CoinGecko API accepts up to 250 ids per request
    const chunks = this.chunkArray(coinGeckoIds, 250)
    const allResults: CoinGeckoPriceData[] = []

    for (const chunk of chunks) {
      const idsParam = chunk.join(',')
      const response = await this.request<CoinGeckoResponse[]>(
        `/coins/markets?vs_currency=${currency.toLowerCase()}&ids=${idsParam}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`
      )

      const priceData: CoinGeckoPriceData[] = response.map(coin => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.current_price,
        price_change_24h: coin.price_change_24h || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        last_updated: new Date().toISOString(),
      }))

      allResults.push(...priceData)
    }

    return allResults
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

export const coinGeckoService = new CoinGeckoService(process.env.COINGECKO_API_KEY)