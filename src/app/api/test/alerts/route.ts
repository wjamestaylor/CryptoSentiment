import { NextRequest, NextResponse } from 'next/server';
import { AlertService } from '@/services/notifications/alerts.service';
import { SentimentLabel } from '@prisma/client';

const alertService = new AlertService();

export async function POST(request: NextRequest) {
  try {
    const { cryptocurrency, sentiment } = await request.json();
    
    if (!cryptocurrency || !sentiment) {
      return NextResponse.json(
        { error: 'Cryptocurrency and sentiment data are required' },
        { status: 400 }
      );
    }

    // Test the alert checking with sample sentiment data
    const sentimentData = {
      cryptoId: cryptocurrency,
      score: sentiment.score || 0.8,
      label: sentiment.label || SentimentLabel.BULLISH,
      confidence: sentiment.confidence || 0.85,
    };

    await alertService.checkAlerts(cryptocurrency, sentimentData);

    return NextResponse.json({
      success: true,
      message: `Alert check completed for ${cryptocurrency}`,
      sentimentData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Alert test error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to test alerts',
        details: message,
      },
      { status: 500 }
    );
  }
}