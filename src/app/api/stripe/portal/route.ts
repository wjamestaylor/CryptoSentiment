import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Get return URL from request body
    const { returnUrl } = await request.json();
    
    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Return URL is required' },
        { status: 400 }
      );
    }

    // Create portal session using the subscription service
    const subscriptionService = new SubscriptionService();
    const portalSession = await subscriptionService.createPortalSession(
      session.user.id,
      returnUrl
    );

    return NextResponse.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}