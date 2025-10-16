import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { FeatureGateService } from '@/services/feature-gate/feature-gate.service';
import { UsageType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get usage type from query parameters
    const { searchParams } = new URL(request.url);
    const usageTypeParam = searchParams.get('type');

    if (!usageTypeParam) {
      return NextResponse.json(
        { success: false, error: 'Usage type is required' },
        { status: 400 }
      );
    }

    // Validate usage type
    if (!Object.values(UsageType).includes(usageTypeParam as UsageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid usage type' },
        { status: 400 }
      );
    }

    const usageType = usageTypeParam as UsageType;

    // Get usage information
    const featureGateService = new FeatureGateService();
    const usageInfo = await featureGateService.getUserUsage(session.user.id, usageType);

    return NextResponse.json({
      success: true,
      data: {
        currentUsage: usageInfo.currentUsage,
        limit: usageInfo.limit,
        resetDate: usageInfo.resetDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching usage limit:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage limit', details: message },
      { status: 500 }
    );
  }
}