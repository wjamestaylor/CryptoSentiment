import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { OpenRouterService } from '@/lib/api/openrouter';
import { AlertService } from '@/services/notifications/alerts.service';
import { FeatureGateService } from '@/services/feature-gate/feature-gate.service';
import { UsageType, SentimentLabel } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can perform AI analysis
    const featureGateService = new FeatureGateService();
    const canAnalyze = await featureGateService.canPerformAIAnalysis(session.user.id);
    
    if (!canAnalyze) {
      // Get usage information for the error response
      const usageInfo = await featureGateService.getUserUsage(session.user.id, UsageType.AI_ANALYSIS);
      
      return NextResponse.json(
        { 
          error: 'AI analysis limit reached',
          details: 'Upgrade your subscription to continue using AI analysis',
          usageInfo: {
            currentUsage: usageInfo.currentUsage,
            limit: usageInfo.limit,
            resetDate: usageInfo.resetDate.toISOString()
          }
        },
        { status: 403 }
      );
    }

    const { cryptocurrency } = await request.json();
    
    if (!cryptocurrency) {
      return NextResponse.json(
        { error: 'Cryptocurrency is required' },
        { status: 400 }
      );
    }

    // Get real market data from CoinGecko (direct API call)
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
    
    // Track the AI analysis usage
    await featureGateService.trackUsage(session.user.id, UsageType.AI_ANALYSIS, 'sentiment_analysis', {
      cryptocurrency,
      analysisId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString()
    });
    
    // Trigger alert checking after successful sentiment analysis
    try {
      const alertService = new AlertService();
      await alertService.checkAlerts(cryptocurrency, {
        cryptoId: cryptocurrency,
        score: analysis.score || 0,
        label: analysis.sentiment as SentimentLabel,
        confidence: analysis.confidence || 0
      });
      console.log(`Alert check completed for ${cryptocurrency} after sentiment analysis`);
    } catch (alertError) {
      console.error('Failed to check alerts after sentiment analysis:', alertError);
      // Don't fail the main request if alert checking fails
    }
    
    // Return analysis with live data confirmation
    return NextResponse.json({
      ...analysis,
      dataSource: 'live',
      priceData: analysisData.priceData,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7),
      alertsChecked: true
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