/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import SettingsPage from '@/app/settings/page';
import { api } from '@/lib/trpc/provider';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/settings',
  })),
}));

// Mock tRPC API
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    auth: {
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
      getLimits: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <button className={className} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <h2 className={className} {...props}>{children}</h2>
  ),
  CardDescription: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <p {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

// Mock settings components
jest.mock('@/components/subscription/SubscriptionStatus', () => ({
  SubscriptionStatus: () => <div data-testid="subscription-status">Subscription Status</div>,
}));

jest.mock('@/components/settings/NotificationPreferences', () => ({
  NotificationPreferences: () => <button data-testid="notification-preferences" className="w-full sm:w-auto">Configure</button>,
}));

jest.mock('@/components/settings/AlertSettings', () => ({
  AlertSettings: () => <button data-testid="alert-settings" className="w-full sm:w-auto">Settings</button>,
}));

jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" className="w-full sm:w-auto">Theme</button>,
}));

// Type for mocked API structure
interface MockedApi {
  auth: {
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
    getLimits: {
      useQuery: jest.Mock
    }
  }
}

const mockApi = api as unknown as MockedApi;
const mockUseSession = useSession as jest.Mock;

describe('Settings Page - Mobile Responsiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'verylongemailaddress@exampledomain.com',
          name: 'Test User With Long Name',
          image: 'https://example.com/avatar.jpg',
        },
      },
      status: 'authenticated',
    });

    // Mock subscription API
    mockApi.subscription.getCurrent.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
      error: null,
    });

    // Mock subscription limits API
    mockApi.subscription.getLimits.useQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          limits: {
            apiCalls: 100,
            watchlist: 10,
            alerts: 5,
          },
        },
      },
      isLoading: false,
      error: null,
    });

    // Mock preferences API
    mockApi.auth.getPreferences.useQuery.mockReturnValue({
      data: {
        emailNotifications: true,
        pushNotifications: false,
        discordNotifications: false,
        telegramNotifications: false,
        sentimentThreshold: 0.7,
        priceChangeThreshold: 0.1,
        volumeThreshold: 0.5,
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

  describe('Responsive Layout Classes', () => {
    it('should have responsive padding on container', () => {
      const { container } = render(<SettingsPage />);
      const mainDiv = container.firstChild as HTMLElement;
      
      expect(mainDiv.className).toContain('py-6');
      expect(mainDiv.className).toContain('px-4');
      expect(mainDiv.className).toContain('sm:py-10');
    });

    it('should have responsive title sizing', () => {
      render(<SettingsPage />);
      const title = screen.getByRole('heading', { name: 'Settings' });
      
      expect(title.className).toContain('text-2xl');
      expect(title.className).toContain('sm:text-3xl');
    });

    it('should have responsive grid for account information', () => {
      const { container } = render(<SettingsPage />);
      const grids = container.querySelectorAll('.grid');
      
      // Find the account info grid (first one with email/name)
      const accountInfoGrid = Array.from(grids).find(grid => 
        grid.textContent?.includes('Email')
      );
      
      expect(accountInfoGrid?.className).toContain('grid-cols-1');
      expect(accountInfoGrid?.className).toContain('sm:grid-cols-2');
    });

    it('should have responsive button layout', () => {
      render(<SettingsPage />);
      const dashboardButton = screen.getByText('Back to Dashboard');
      const watchlistButton = screen.getByText('View Watchlist');
      
      // Check buttons have responsive width classes
      expect(dashboardButton.className).toContain('w-full');
      expect(dashboardButton.className).toContain('sm:w-auto');
      expect(watchlistButton.className).toContain('w-full');
      expect(watchlistButton.className).toContain('sm:w-auto');
    });

    it('should render action buttons container with responsive flex', () => {
      const { container } = render(<SettingsPage />);
      
      // Find the actions container by looking for the parent div of both buttons
      const dashboardButton = screen.getByText('Back to Dashboard');
      const actionsContainer = dashboardButton.parentElement;
      
      expect(actionsContainer?.className).toContain('flex');
      expect(actionsContainer?.className).toContain('flex-col');
      expect(actionsContainer?.className).toContain('sm:flex-row');
    });
  });

  describe('Content Overflow Prevention', () => {
    it('should handle long email addresses with break-words', () => {
      render(<SettingsPage />);
      const emailText = screen.getByText('verylongemailaddress@exampledomain.com');
      
      expect(emailText.className).toContain('break-words');
    });

    it('should use responsive text sizing for user info', () => {
      render(<SettingsPage />);
      const emailText = screen.getByText('verylongemailaddress@exampledomain.com');
      const nameText = screen.getByText('Test User With Long Name');
      
      expect(emailText.className).toContain('text-base');
      expect(emailText.className).toContain('sm:text-lg');
      expect(nameText.className).toContain('text-base');
      expect(nameText.className).toContain('sm:text-lg');
    });
  });

  describe('Preferences Section Responsiveness', () => {
    it('should have responsive layout for preferences items', () => {
      const { container } = render(<SettingsPage />);
      
      // Find preferences section by looking for the parent of the theme button
      const themeButton = screen.getByTestId('theme-toggle');
      const preferencesSection = themeButton.parentElement;
      
      expect(preferencesSection?.className).toContain('flex');
      expect(preferencesSection?.className).toContain('flex-col');
      expect(preferencesSection?.className).toContain('sm:flex-row');
    });

    it('should render preference buttons with responsive width', () => {
      render(<SettingsPage />);
      const themeButton = screen.getByTestId('theme-toggle');
      const configureButton = screen.getByTestId('notification-preferences');
      const settingsButton = screen.getByTestId('alert-settings');
      
      expect(themeButton.className).toContain('w-full');
      expect(themeButton.className).toContain('sm:w-auto');
      expect(configureButton.className).toContain('w-full');
      expect(configureButton.className).toContain('sm:w-auto');
      expect(settingsButton.className).toContain('w-full');
      expect(settingsButton.className).toContain('sm:w-auto');
    });
  });

  describe('Mobile User Experience', () => {
    it('should render all critical user information', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('verylongemailaddress@exampledomain.com')).toBeInTheDocument();
      expect(screen.getByText('Test User With Long Name')).toBeInTheDocument();
    });

    it('should render all interactive elements', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('View Watchlist')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
      expect(screen.getByTestId('alert-settings')).toBeInTheDocument();
    });

    it('should render all major sections', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-status')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });

    it('should not render followed coins or active alerts statistics', () => {
      render(<SettingsPage />);
      
      expect(screen.queryByText('Followed Coins')).not.toBeInTheDocument();
      expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
    });
  });
});
