/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureGate, useUsageLimit } from '@/components/feature-gating/FeatureGate';
import { UsageType } from '@prisma/client';
import { api } from '@/lib/trpc/provider';

// Mock tRPC API
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    subscription: {
      checkUsageLimit: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <h2 {...props}>{children}</h2>
  ),
  CardDescription: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <p {...props}>{children}</p>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: { value?: number; [key: string]: unknown }) => (
    <div {...props} data-testid="progress" data-value={value} />
  ),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

// Type for mocked API structure
interface MockedApi {
  subscription: {
    checkUsageLimit: {
      useQuery: jest.Mock
    }
  }
}

const mockApi = api as unknown as MockedApi;

describe('FeatureGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner when checking usage', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(
        <FeatureGate usageType={UsageType.ALERT_CREATION}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Feature Access Allowed', () => {
    it('renders children when usage limit allows', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: true,
            currentUsage: 2,
            limit: 10,
            remaining: 8,
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate usageType={UsageType.ALERT_CREATION}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows usage warning when near limit', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: true,
            currentUsage: 9,
            limit: 10,
            remaining: 1,
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate usageType={UsageType.ALERT_CREATION} showUsage={true}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('1 uses remaining (9/10 used)')).toBeInTheDocument();
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });
  });

  describe('Feature Access Denied', () => {
    it('shows upgrade prompt when limit is reached', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: false,
            currentUsage: 5,
            limit: 5,
            remaining: 0,
            resetDate: new Date('2024-12-01'),
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate usageType={UsageType.ALERT_CREATION}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Limit Reached')).toBeInTheDocument();
      expect(screen.getByText('You\'ve reached your alerts limit (5/5). Limit resets 12/1/2024.')).toBeInTheDocument();
      expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('shows fallback component when provided and limit reached', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: false,
            currentUsage: 10,
            limit: 10,
            remaining: 0,
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate 
          usageType={UsageType.WATCHLIST_ADD}
          fallback={<div>Upgrade to add more items</div>}
        >
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Upgrade to add more items')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('gracefully handles API errors', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      render(
        <FeatureGate usageType={UsageType.AI_ANALYSIS}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      // Should show children on error (graceful degradation)
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Different Usage Types', () => {
    it('shows correct feature name for AI analysis', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: false,
            currentUsage: 10,
            limit: 10,
            remaining: 0,
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate usageType={UsageType.AI_ANALYSIS}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText(/AI analyses limit/)).toBeInTheDocument();
    });

    it('shows correct feature name for watchlist', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: false,
            currentUsage: 10,
            limit: 10,
            remaining: 0,
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate usageType={UsageType.WATCHLIST_ADD}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText(/watchlist items limit/)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('shows correct progress value', () => {
      mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
        data: {
          success: true,
          data: {
            allowed: false,
            currentUsage: 7,
            limit: 10,
            remaining: 3,
          },
        },
        isLoading: false,
      });

      render(
        <FeatureGate usageType={UsageType.BOT_NOTIFICATION}>
          <div>Protected Content</div>
        </FeatureGate>
      );

      const progressBar = screen.getByTestId('progress');
      expect(progressBar).toHaveAttribute('data-value', '70'); // 7/10 * 100
    });
  });
});

describe('useUsageLimit Hook', () => {
  it('returns correct usage data', () => {
    const TestComponent = () => {
      const usage = useUsageLimit(UsageType.ALERT_CREATION);
      return (
        <div>
          <span>Allowed: {usage.allowed.toString()}</span>
          <span>Current: {usage.currentUsage}</span>
          <span>Limit: {usage.limit}</span>
          <span>Remaining: {usage.remaining}</span>
        </div>
      );
    };

    mockApi.subscription.checkUsageLimit.useQuery.mockReturnValue({
      data: {
        data: {
          allowed: true,
          currentUsage: 3,
          limit: 10,
          remaining: 7,
        },
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<TestComponent />);

    expect(screen.getByText('Allowed: true')).toBeInTheDocument();
    expect(screen.getByText('Current: 3')).toBeInTheDocument();
    expect(screen.getByText('Limit: 10')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 7')).toBeInTheDocument();
  });
});