import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'Missing required environment variables',
          missing: missingEnvVars,
        },
        { status: 500 }
      );
    }
    
    // Check external API connectivity (non-blocking)
    const externalChecks = {
      coingecko: !!process.env.COINGECKO_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      email: !!process.env.EMAIL_SERVER_HOST,
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      external_services: externalChecks,
      uptime: process.uptime(),
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}