import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { STRIPE_CONFIG } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, billing } = body;

    // Validate input
    if (!tier || !billing) {
      return NextResponse.json(
        { error: 'Missing required fields: tier and billing' },
        { status: 400 }
      );
    }

    if (!['pro', 'business'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "pro" or "business"' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json(
        { error: 'Invalid billing. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Get price ID based on tier and billing
    let priceId: string;
    if (tier === 'pro') {
      priceId = billing === 'monthly' 
        ? STRIPE_CONFIG.products.pro.priceIds.monthly
        : STRIPE_CONFIG.products.pro.priceIds.yearly;
    } else {
      priceId = billing === 'monthly'
        ? STRIPE_CONFIG.products.business.priceIds.monthly
        : STRIPE_CONFIG.products.business.priceIds.yearly;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this tier and billing cycle' },
        { status: 500 }
      );
    }

    // Create checkout session
    const subscriptionService = new SubscriptionService();
    const checkoutSession = await subscriptionService.createCheckoutSession({
      userId: session.user.id,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}