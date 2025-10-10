import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterService } from '@/lib/api/openrouter';
import { CoinGeckoService } from '@/lib/api/coingecko';

export async function POST(request: NextRequest) {
  try {
    const { cryptocurrency } = await request.json();
    
    if (!cryptocurrency) {
      return NextResponse.json(
        { error: 'Cryptocurrency is required' },
        { status: 400 }
      );
    }

    // Get real market data from CoinGecko
    const coinGeckoService = new CoinGeckoService();
    let realPriceData = null;
    
    try {
      // Try to get real price data using the simple/price endpoint (no auth required)
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );
      
      if (response.ok) {
        const priceData = await response.json();
        const coinData = priceData[cryptocurrency];
        
        if (coinData) {
          realPriceData = {
            current_price: coinData.usd,
            price_change_24h: coinData.usd_24h_change || 0,
            volume_24h: coinData.usd_24h_vol || 0,
            market_cap: coinData.usd_market_cap || 0
          };
        }
      }
    } catch (coinGeckoError) {
      console.warn(`Failed to get real data for ${cryptocurrency}, using sample data:`, coinGeckoError);
    }

    // Fallback to sample data if CoinGecko fails
    const analysisData = {
      cryptocurrency,
      priceData: realPriceData || {
        current_price: 45000, // Fallback data
        price_change_24h: 2.5,
        volume_24h: 25000000000
      }
    };

    const openRouterService = new OpenRouterService();
    const analysis = await openRouterService.analyzeSentiment(analysisData);
    
    // Add a flag to indicate if we used real data
    return NextResponse.json({
      ...analysis,
      dataSource: realPriceData ? 'live' : 'sample',
      priceData: analysisData.priceData,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7)
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}