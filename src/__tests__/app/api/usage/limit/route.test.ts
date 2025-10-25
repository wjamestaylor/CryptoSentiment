/**
 * Tests for Usage Limit API Route
 * Ensures that feature gate counts reflect actual subscription plan
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/usage/limit/route';
import { UsageType } from '@prisma/client';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock authOptions
jest.mock('@/lib/auth/nextauth', () => ({
  authOptions: {},
}));

// Mock FeatureGateService
const mockCanAddToWatchlist = jest.fn();
const mockCanCreateAlert = jest.fn();
const mockCanPerformAIAnalysis = jest.fn();
const mockCanUseBotNotification = jest.fn();
const mockCheckUsageLimit = jest.fn();

jest.mock('@/services/feature-gating/feature-gate.service', () => ({
  FeatureGateService: jest.fn().mockImplementation(() => ({
    canAddToWatchlist: mockCanAddToWatchlist,
    canCreateAlert: mockCanCreateAlert,
    canPerformAIAnalysis: mockCanPerformAIAnalysis,
    canUseBotNotification: mockCanUseBotNotification,
    checkUsageLimit: mockCheckUsageLimit,
  })),
}));

import { getServerSession } from 'next-auth';

describe('/api/usage/limit', () => {
  let mockGetServerSession: jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 401 if session has no user', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should return 400 if usage type is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/usage/limit');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Usage type is required');
    });

    it('should return 400 if usage type is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=INVALID_TYPE'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid usage type');
    });
  });

  describe('WATCHLIST_ADD Usage Type', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should use canAddToWatchlist for WATCHLIST_ADD', async () => {
      mockCanAddToWatchlist.mockResolvedValue({
        allowed: true,
        currentUsage: 5,
        limit: 10,
        remaining: 5,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(mockCanAddToWatchlist).toHaveBeenCalledWith('user-123');
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.currentUsage).toBe(5);
      expect(data.data.limit).toBe(10);
      expect(data.data.resetDate).toBeDefined();
    });

    it('should return correct FREE tier limit (10)', async () => {
      mockCanAddToWatchlist.mockResolvedValue({
        allowed: true,
        currentUsage: 3,
        limit: 10, // FREE tier watchlist limit
        remaining: 7,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.limit).toBe(10); // This is the bug fix - was showing 50
    });

    it('should return correct PRO tier limit (100)', async () => {
      mockCanAddToWatchlist.mockResolvedValue({
        allowed: true,
        currentUsage: 25,
        limit: 100, // PRO tier watchlist limit
        remaining: 75,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.limit).toBe(100);
    });
  });

  describe('ALERT_CREATION Usage Type', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should use canCreateAlert for ALERT_CREATION', async () => {
      mockCanCreateAlert.mockResolvedValue({
        allowed: true,
        currentUsage: 2,
        limit: 5,
        remaining: 3,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=ALERT_CREATION'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(mockCanCreateAlert).toHaveBeenCalledWith('user-123');
      expect(data.data.limit).toBe(5); // FREE tier alert limit
    });
  });

  describe('AI_ANALYSIS Usage Type', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should use canPerformAIAnalysis for AI_ANALYSIS', async () => {
      mockCanPerformAIAnalysis.mockResolvedValue({
        allowed: true,
        currentUsage: 3,
        limit: 5,
        remaining: 2,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=AI_ANALYSIS'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(mockCanPerformAIAnalysis).toHaveBeenCalledWith('user-123');
      expect(data.data.limit).toBe(5); // FREE tier AI analysis limit
    });
  });

  describe('BOT_NOTIFICATION Usage Type', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should use canUseBotNotification for BOT_NOTIFICATION', async () => {
      mockCanUseBotNotification.mockResolvedValue({
        allowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=BOT_NOTIFICATION'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(mockCanUseBotNotification).toHaveBeenCalledWith('user-123');
      expect(data.data.limit).toBe(0); // FREE tier has no bot notifications
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should return 500 on service error', async () => {
      mockCanAddToWatchlist.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch usage limit');
    });
  });

  describe('Plan-based Limit Display', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
    });

    it('should reflect FREE tier limits correctly', async () => {
      const freeTierLimits = {
        watchlist: { limit: 10, currentUsage: 3 },
        alerts: { limit: 5, currentUsage: 2 },
        aiAnalysis: { limit: 5, currentUsage: 3 },
        botNotifications: { limit: 0, currentUsage: 0 },
      };

      mockCanAddToWatchlist.mockResolvedValue({
        allowed: true,
        currentUsage: freeTierLimits.watchlist.currentUsage,
        limit: freeTierLimits.watchlist.limit,
        remaining: 7,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      // This was the reported bug - FREE tier showing 50 instead of 10
      expect(data.data.limit).toBe(10);
      expect(data.data.currentUsage).toBe(3);
    });

    it('should reflect PRO tier limits correctly', async () => {
      const proTierLimits = {
        watchlist: { limit: 100, currentUsage: 25 },
        alerts: { limit: 50, currentUsage: 10 },
        aiAnalysis: { limit: 100, currentUsage: 30 },
        botNotifications: { limit: 50, currentUsage: 5 },
      };

      mockCanAddToWatchlist.mockResolvedValue({
        allowed: true,
        currentUsage: proTierLimits.watchlist.currentUsage,
        limit: proTierLimits.watchlist.limit,
        remaining: 75,
        resetDate: new Date('2024-02-01'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/usage/limit?type=WATCHLIST_ADD'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.limit).toBe(100);
      expect(data.data.currentUsage).toBe(25);
    });
  });
});
