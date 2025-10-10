import { NextRequest, NextResponse } from 'next/server';
import { coinGeckoService } from '@/services/crypto/price.service';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing CoinGecko API...');
    
    // Test the CoinGecko service
    const topCryptos = await coinGeckoService.getTopCryptos(5);
    
    return NextResponse.json({
      success: true,
      message: 'CoinGecko API test successful',
      data: topCryptos,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CoinGecko API test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'CoinGecko API test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}