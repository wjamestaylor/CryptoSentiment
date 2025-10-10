import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterService } from '@/lib/api/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { cryptocurrency } = await request.json();
    
    if (!cryptocurrency) {
      return NextResponse.json(
        { error: 'Cryptocurrency is required' },
        { status: 400 }
      );
    }

    const openRouterService = new OpenRouterService();
    
    // Create sample market context for the AI analysis
    const analysisData = {
      cryptocurrency,
      priceData: {
        current_price: 45000, // This would come from CoinGecko in real implementation
        price_change_24h: 2.5,
        volume_24h: 25000000000
      }
    };

    const analysis = await openRouterService.analyzeSentiment(analysisData);
    
    return NextResponse.json(analysis);
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