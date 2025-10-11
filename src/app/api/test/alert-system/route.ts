import { NextRequest, NextResponse } from 'next/server';
import { AlertService } from '@/services/notifications/alerts.service';
import { AlertType } from '@prisma/client';

const alertService = new AlertService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create-alert':
        return await createTestAlert(params);
      
      case 'check-alert':
        return await checkTestAlert(params);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Available actions: create-alert, check-alert' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Alert system test error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to test alert system: ${message}` },
      { status: 500 }
    );
  }
}

async function createTestAlert(params: any) {
  const { 
    userId = 'test-user-id',
    cryptoSymbol = 'btc',
    cryptoName = 'Bitcoin',
    alertType = AlertType.SENTIMENT_CHANGE,
    condition = { sentimentThreshold: 0.7, direction: 'bullish' }
  } = params;
  
  try {
    const alert = await alertService.createAlertWithSymbol({
      userId,
      cryptoSymbol,
      cryptoName,
      type: alertType,
      condition,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test alert created successfully',
      alert: {
        id: alert.id,
        cryptoSymbol,
        cryptoName,
        type: alertType,
        condition,
        isActive: alert.isActive,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create test alert: ${message}` },
      { status: 500 }
    );
  }
}

async function checkTestAlert(params: any) {
  const { 
    cryptoSymbol = 'btc',
    sentimentData = {
      score: 0.8,
      label: 'BULLISH',
      confidence: 0.9
    }
  } = params;
  
  try {
    // This will need to be updated to work with symbols instead of IDs
    // For now, let's just return a test response
    return NextResponse.json({
      success: true,
      message: `Alert check would be performed for ${cryptoSymbol}`,
      sentimentData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to check test alert: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Alert system testing endpoint',
    usage: {
      method: 'POST',
      actions: [
        {
          action: 'create-alert',
          description: 'Create a test alert',
          params: {
            userId: 'optional (default: test-user-id)',
            cryptoSymbol: 'optional (default: btc)',
            cryptoName: 'optional (default: Bitcoin)',
            alertType: 'optional (default: SENTIMENT_CHANGE)',
            condition: 'optional (default: sentiment alert)',
          },
        },
        {
          action: 'check-alert',
          description: 'Test alert checking',
          params: {
            cryptoSymbol: 'optional (default: btc)',
            sentimentData: 'optional (default test data)',
          },
        },
      ],
    },
  });
}