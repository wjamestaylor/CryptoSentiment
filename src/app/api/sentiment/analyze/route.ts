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
      console.error(`Failed to get price data for ${cryptocurrency}:`, coinGeckoError);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve cryptocurrency data',
          details: 'Unable to connect to price data service'
        },
        { status: 503 }
      );
    }

    // Ensure we have real data before proceeding
    if (!realPriceData) {
      return NextResponse.json(
        { 
          error: 'Cryptocurrency not found',
          details: `No price data available for "${cryptocurrency}". Please check the cryptocurrency ID.`
        },
        { status: 404 }
      );
    }

    const analysisData = {
      cryptocurrency,
      priceData: realPriceData
    };

    const openRouterService = new OpenRouterService();
    const analysis = await openRouterService.analyzeSentiment(analysisData);
    
    // Return analysis with live data confirmation
    return NextResponse.json({
      ...analysis,
      dataSource: 'live',
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