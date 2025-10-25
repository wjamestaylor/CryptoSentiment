/**
 * Tests for Stripe Checkout API
 * Validates annual billing and checkout session creation
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/checkout/route';

// Mock Stripe config
jest.mock('@/lib/stripe', () => ({
  STRIPE_CONFIG: {
    products: {
      pro: {
        priceIds: {
          monthly: 'price_pro_monthly_test',
          yearly: 'price_pro_yearly_test',
        },
      },
      business: {
        priceIds: {
          monthly: 'price_business_monthly_test',
          yearly: 'price_business_yearly_test',
        },
      },
    },
  },
  stripe: null,
}));

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock SubscriptionService
jest.mock('@/services/subscription/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    createCheckoutSession: jest.fn(),
  })),
}));

// Import after mocking
const { getServerSession } = require('next-auth/next');
const { SubscriptionService } = require('@/services/subscription/subscription.service');

describe('POST /api/stripe/checkout', () => {
  let mockCreateCheckoutSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock instance
    mockCreateCheckoutSession = jest.fn();
    (SubscriptionService as jest.Mock).mockImplementation(() => ({
      createCheckoutSession: mockCreateCheckoutSession,
    }));
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
    });

    it('should return 401 if session has no user ID', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {},
        expires: '2025-12-31T23:59:59.999Z'
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31T23:59:59.999Z'
      });
    });

    it('should return 400 if tier is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: tier and billing');
    });

    it('should return 400 if billing is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: tier and billing');
    });

    it('should return 400 if tier is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'invalid', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid tier. Must be "pro" or "business"');
    });

    it('should return 400 if billing is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'weekly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid billing. Must be "monthly" or "yearly"');
    });
  });

  describe('Monthly Billing', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31T23:59:59.999Z'
      });
    });

    it('should create checkout session for Pro monthly plan', async () => {
      mockCreateCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.url).toBe('https://checkout.stripe.com/test');
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        userId: 'user-123',
        priceId: 'price_pro_monthly_test',
        successUrl: expect.stringContaining('/dashboard?success=true'),
        cancelUrl: expect.stringContaining('/pricing?canceled=true'),
      });
    });

    it('should create checkout session for Business monthly plan', async () => {
      mockCreateCheckoutSession.mockResolvedValue({
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/test2',
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'business', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        userId: 'user-123',
        priceId: 'price_business_monthly_test',
        successUrl: expect.stringContaining('/dashboard?success=true'),
        cancelUrl: expect.stringContaining('/pricing?canceled=true'),
      });
    });
  });

  describe('Annual Billing', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31T23:59:59.999Z'
      });
    });

    it('should create checkout session for Pro yearly plan', async () => {
      mockCreateCheckoutSession.mockResolvedValue({
        id: 'cs_test_yearly_123',
        url: 'https://checkout.stripe.com/yearly',
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'yearly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_yearly_123');
      expect(data.url).toBe('https://checkout.stripe.com/yearly');
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        userId: 'user-123',
        priceId: 'price_pro_yearly_test',
        successUrl: expect.stringContaining('/dashboard?success=true'),
        cancelUrl: expect.stringContaining('/pricing?canceled=true'),
      });
    });

    it('should create checkout session for Business yearly plan', async () => {
      mockCreateCheckoutSession.mockResolvedValue({
        id: 'cs_test_yearly_456',
        url: 'https://checkout.stripe.com/yearly2',
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'business', billing: 'yearly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        userId: 'user-123',
        priceId: 'price_business_yearly_test',
        successUrl: expect.stringContaining('/dashboard?success=true'),
        cancelUrl: expect.stringContaining('/pricing?canceled=true'),
      });
    });

    it('should use correct yearly price ID (not monthly)', async () => {
      mockCreateCheckoutSession.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'yearly' }),
      });

      await POST(request);

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_pro_yearly_test',
        })
      );
      expect(mockCreateCheckoutSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_pro_monthly_test',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31T23:59:59.999Z'
      });
    });

    it('should return 500 if checkout session creation fails', async () => {
      mockCreateCheckoutSession.mockRejectedValue(new Error('Stripe API error'));

      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });
  });

  describe('Success and Cancel URLs', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2025-12-31T23:59:59.999Z'
      });

      mockCreateCheckoutSession.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/test',
      });
    });

    it('should include success URL with dashboard redirect', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'monthly' }),
      });

      await POST(request);

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: expect.stringMatching(/\/dashboard\?success=true$/),
        })
      );
    });

    it('should include cancel URL with pricing page redirect', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro', billing: 'monthly' }),
      });

      await POST(request);

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelUrl: expect.stringMatching(/\/pricing\?canceled=true$/),
        })
      );
    });
  });
});
