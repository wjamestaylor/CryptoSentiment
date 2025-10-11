import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are loaded
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  return NextResponse.json({
    hasOpenRouterKey: !!openRouterKey,
    keyPrefix: openRouterKey ? `${openRouterKey.substring(0, 10)}...` : 'Not found',
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.APP_URL
  });
}