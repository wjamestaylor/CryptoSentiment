import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import type Stripe from 'stripe';

const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await subscriptionService.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.updated':
        await subscriptionService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await subscriptionService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}