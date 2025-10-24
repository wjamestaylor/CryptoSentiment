/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import ProfilePage from '@/app/profile/page';
import { api } from '@/lib/trpc/provider';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

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
    auth: {
      getUserStats: {
        useQuery: jest.fn(),
      },
      getPreferences: {
        useQuery: jest.fn(),
      },
      updatePreferences: {
        useMutation: jest.fn(),
      },
    },
    subscription: {
      getCurrent: {
        useQuery: jest.fn(),
      },
    },
  },
}));

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

// Mock profile components
jest.mock('@/components/subscription/SubscriptionStatus', () => ({
  SubscriptionStatus: () => <div data-testid="subscription-status">Subscription Status</div>,
}));

jest.mock('@/components/profile/NotificationPreferences', () => ({
  NotificationPreferences: () => <button data-testid="notification-preferences">Notification Preferences</button>,
}));

jest.mock('@/components/profile/AlertSettings', () => ({
  AlertSettings: () => <button data-testid="alert-settings">Alert Settings</button>,
}));

// Type for mocked API structure
interface MockedApi {
  auth: {
    getUserStats: {
      useQuery: jest.Mock
    }
    getPreferences: {
      useQuery: jest.Mock
    }
    updatePreferences: {
      useMutation: jest.Mock
    }
  }
  subscription: {
    getCurrent: {
      useQuery: jest.Mock
    }
  }
}

const mockApi = api as unknown as MockedApi;
const mockUseSession = useSession as jest.Mock;

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        },
      },
    });

    // Mock getUserStats API
    mockApi.auth.getUserStats.useQuery.mockReturnValue({
      data: { followedCoins: 5, activeAlerts: 3 },
      isLoading: false,
      error: null,
    });

    // Mock subscription API
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        tier: 'FREE',
        status: 'ACTIVE',
      },
      isLoading: false,
      error: null,
    });

    // Mock preferences API
    mockApi.auth.getPreferences.useQuery.mockReturnValue({
      data: {
        emailNotifications: true,
        pushNotifications: false,
        botNotifications: true,
        priceAlertThreshold: 5,
        sentimentThreshold: 'HIGH',
        volumeThreshold: 10,
      },
      isLoading: false,
      error: null,
    });

    // Mock update preferences mutation
    mockApi.auth.updatePreferences.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  it('should render profile page with user information', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
  });

  it('should render subscription status component', () => {
    render(<ProfilePage />);

    expect(screen.getByTestId('subscription-status')).toBeInTheDocument();
  });

  it('should render preferences section with functional buttons', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
    expect(screen.getByTestId('alert-settings')).toBeInTheDocument();
  });

  it('should render user information correctly', () => {
    render(<ProfilePage />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(<ProfilePage />);

    const dashboardButton = screen.getByText('Back to Dashboard');
    const watchlistButton = screen.getByText('View Watchlist');

    expect(dashboardButton).toBeInTheDocument();
    expect(watchlistButton).toBeInTheDocument();
  });
});