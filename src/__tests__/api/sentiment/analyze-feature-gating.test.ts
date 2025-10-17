import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sentiment/analyze/route';
import { getServerSession } from 'next-auth';
import { FeatureGateService } from '@/services/feature-gating/feature-gate.service';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/services/feature-gating/feature-gate.service');

// Mock the OpenRouter service  
jest.mock('@/lib/api/openrouter', () => ({
  OpenRouterService: jest.fn().mockImplementation(() => ({
    analyzeSentiment: jest.fn().mockResolvedValue({
      sentiment: 'BULLISH',
      confidence: 0.8,
      score: 75,
      reasoning: 'Strong market indicators',
      factors: [],
    }),
  })),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const MockFeatureGateService = FeatureGateService as jest.MockedClass<typeof FeatureGateService>;

describe('/api/sentiment/analyze - Feature Gating', () => {
  let mockFeatureGateService: jest.Mocked<FeatureGateService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureGateService = {
      canPerformAIAnalysis: jest.fn(),
      trackUsage: jest.fn(),
      getUserUsage: jest.fn(),
    } as any;
    MockFeatureGateService.mockImplementation(() => mockFeatureGateService);
    
    // Setup global fetch mock
    global.fetch = jest.fn();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sentiment/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cryptocurrency: 'bitcoin' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 403 when user has reached AI analysis limit', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123' },
    } as any);

    // Mock service to return false (limit reached)
    mockFeatureGateService.canPerformAIAnalysis.mockResolvedValue({
      allowed: false,
      currentUsage: 5,
      limit: 5,
      remaining: 0,
      resetDate: new Date(),
    });

    const request = new NextRequest('http://localhost/api/sentiment/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cryptocurrency: 'bitcoin' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('AI analysis limit reached');
    expect(data.details).toBe('Upgrade your subscription to continue using AI analysis');
    expect(data.usageInfo).toEqual({
      currentUsage: 5,
      limit: 5,
      remaining: 0,
      resetDate: expect.any(String), // Dates are serialized as strings in JSON
    });
  });

  it('allows AI analysis when user has not reached limit', async () => {
    // Mock successful authentication
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123' },
    } as any);

    // Mock usage check allowing access
    mockFeatureGateService.canPerformAIAnalysis.mockResolvedValue({
      allowed: true,
      currentUsage: 2,
      limit: 5,
      remaining: 3,
    });

    // Mock successful tracking
    mockFeatureGateService.trackUsage.mockResolvedValue();

    // Mock CoinGecko API response
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bitcoin: {
            usd: 45000,
            usd_24h_change: 2.5,
            usd_24h_vol: 25000000000,
            usd_market_cap: 850000000000,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sentiment: 'BULLISH',
          confidence: 0.8,
          score: 75,
          reasoning: 'Strong market indicators',
          factors: [],
        }),
      });

    const request = new NextRequest('http://localhost/api/sentiment/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cryptocurrency: 'bitcoin' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockFeatureGateService.canPerformAIAnalysis).toHaveBeenCalledWith('user-123');
    expect(mockFeatureGateService.trackUsage).toHaveBeenCalledWith(
      'user-123',
      'AI_ANALYSIS',
      expect.objectContaining({
        cryptocurrency: 'bitcoin',
        analysisId: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });
});