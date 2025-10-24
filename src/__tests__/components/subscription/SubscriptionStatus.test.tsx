/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { api } from '@/lib/trpc/provider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/profile',
  })),
}));

// Mock tRPC API
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    subscription: {
      getCurrent: {
        useQuery: jest.fn(),
      },
      getLimits: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock UI components
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

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: { value: number; [key: string]: unknown }) => (
    <div data-testid="progress" data-value={value} {...props} />
  ),
}));

// Type for mocked API structure
interface MockedApi {
  subscription: {
    getCurrent: {
      useQuery: jest.Mock;
    };
    getLimits: {
      useQuery: jest.Mock;
    };
  };
}

const mockApi = api as unknown as MockedApi;

describe('SubscriptionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display correct format for AI Analysis with actual usage data', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          limits: {
            alerts: 5,
            watchlist: 10,
            aiAnalysisPerMonth: 10,
            botNotifications: 0,
          },
          usage: {
            aiAnalysisUsed: 3,
            aiAnalysisLimit: 10,
            alertsUsed: 2,
            alertsLimit: 5,
            watchlistUsed: 5,
            watchlistLimit: 10,
            botNotificationsUsed: 0,
            botNotificationsLimit: 0,
          },
        },
      },
      isLoading: false,
    });

    render(<SubscriptionStatus />);

    // Check AI Analysis section shows correct format: "3 / 10"
    expect(screen.getByText('AI Analyses')).toBeInTheDocument();
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('should display correct format for Watchlist with actual usage data', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          limits: {
            alerts: 5,
            watchlist: 10,
            aiAnalysisPerMonth: 10,
            botNotifications: 0,
          },
          usage: {
            aiAnalysisUsed: 0,
            aiAnalysisLimit: 10,
            alertsUsed: 0,
            alertsLimit: 5,
            watchlistUsed: 7,
            watchlistLimit: 10,
            botNotificationsUsed: 0,
            botNotificationsLimit: 0,
          },
        },
      },
      isLoading: false,
    });

    render(<SubscriptionStatus />);

    // Check Watchlist section shows correct format: "7 / 10"
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
  });

  it('should display correct format for Alerts with actual usage data', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          limits: {
            alerts: 5,
            watchlist: 10,
            aiAnalysisPerMonth: 10,
            botNotifications: 0,
          },
          usage: {
            aiAnalysisUsed: 0,
            aiAnalysisLimit: 10,
            alertsUsed: 4,
            alertsLimit: 5,
            watchlistUsed: 0,
            watchlistLimit: 10,
            botNotificationsUsed: 0,
            botNotificationsLimit: 0,
          },
        },
      },
      isLoading: false,
    });

    render(<SubscriptionStatus />);

    // Check Alerts section shows correct format: "4 / 5"
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('4 / 5')).toBeInTheDocument();
  });

  it('should display "0 / 10" format when usage is zero', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          limits: {
            alerts: 5,
            watchlist: 10,
            aiAnalysisPerMonth: 10,
            botNotifications: 0,
          },
          usage: {
            aiAnalysisUsed: 0,
            aiAnalysisLimit: 10,
            alertsUsed: 0,
            alertsLimit: 5,
            watchlistUsed: 0,
            watchlistLimit: 10,
            botNotificationsUsed: 0,
            botNotificationsLimit: 0,
          },
        },
      },
      isLoading: false,
    });

    render(<SubscriptionStatus />);

    // Check all sections show "0 / N" format - using getAllByText since watchlist and AI analysis both have "0 / 10"
    const zeroOfTen = screen.getAllByText('0 / 10');
    expect(zeroOfTen).toHaveLength(2); // AI Analysis and Watchlist
    expect(screen.getByText('0 / 5')).toBeInTheDocument(); // Alerts
  });

  it('should display infinity symbol for unlimited plans', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'BUSINESS',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'BUSINESS',
          limits: {
            alerts: -1,
            watchlist: -1,
            aiAnalysisPerMonth: 1000,
            botNotifications: -1,
          },
          usage: {
            aiAnalysisUsed: 50,
            aiAnalysisLimit: 1000,
            alertsUsed: 100,
            alertsLimit: -1,
            watchlistUsed: 200,
            watchlistLimit: -1,
            botNotificationsUsed: 30,
            botNotificationsLimit: -1,
          },
        },
      },
      isLoading: false,
    });

    render(<SubscriptionStatus />);

    // Check that unlimited sections show infinity symbol
    expect(screen.getByText(/100 \/ ∞/)).toBeInTheDocument(); // Alerts
    expect(screen.getByText(/200 \/ ∞/)).toBeInTheDocument(); // Watchlist
  });

  it('should display loading state', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      isLoading: true,
    });

    render(<SubscriptionStatus />);

    expect(screen.getByText('Subscription')).toBeInTheDocument();
  });

  it('should display error state when subscription data fails to load', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: false,
      },
      isLoading: false,
    });

    render(<SubscriptionStatus />);

    expect(screen.getByText('Unable to load subscription information.')).toBeInTheDocument();
  });

  it('should handle zero limit edge case without crashing', () => {
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          limits: {
            alerts: 0, // Edge case: zero limit
            watchlist: 0,
            aiAnalysisPerMonth: 0,
            botNotifications: 0,
          },
          usage: {
            aiAnalysisUsed: 0,
            aiAnalysisLimit: 0,
            alertsUsed: 0,
            alertsLimit: 0,
            watchlistUsed: 0,
            watchlistLimit: 0,
            botNotificationsUsed: 0,
            botNotificationsLimit: 0,
          },
        },
      },
      isLoading: false,
    });

    // Should render without crashing despite zero limits
    expect(() => render(<SubscriptionStatus />)).not.toThrow();
    
    // Should display the zero values
    expect(screen.getByText('AI Analyses')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });
});
