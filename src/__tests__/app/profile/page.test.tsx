import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProfilePage from '@/app/profile/page';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.Mock;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.Mock;

describe('ProfilePage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  describe('Authentication', () => {
    it('redirects to sign in when user is not authenticated', () => {
      mockUseSession.mockReturnValue({ data: null });

      render(<ProfilePage />);

      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });

    it('renders nothing when user is not authenticated', () => {
      mockUseSession.mockReturnValue({ data: null });

      const { container } = render(<ProfilePage />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Authenticated User Interface', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession });
    });

    it('displays the profile page title and free tier badge', () => {
      render(<ProfilePage />);

      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByText('Free Tier')).toBeInTheDocument();
    });

    it('displays account information card with title and description', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Your account details and subscription information')).toBeInTheDocument();
    });

    it('displays user email correctly', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays user name correctly', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays "Not set" when user name is not available', () => {
      const sessionWithoutName = {
        user: {
          email: 'test@example.com',
          name: null,
        },
      };
      mockUseSession.mockReturnValue({ data: sessionWithoutName });

      render(<ProfilePage />);

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });

    it('displays "Not set" when user name is empty string', () => {
      const sessionWithEmptyName = {
        user: {
          email: 'test@example.com',
          name: '',
        },
      };
      mockUseSession.mockReturnValue({ data: sessionWithEmptyName });

      render(<ProfilePage />);

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession });
    });

    it('displays followed coins statistic', () => {
      render(<ProfilePage />);

      const followedCoinsValues = screen.getAllByText('0');
      expect(followedCoinsValues[0]).toBeInTheDocument();
      expect(screen.getByText('Followed Coins')).toBeInTheDocument();
    });

    it('displays active alerts statistic', () => {
      render(<ProfilePage />);

      const activeAlertsValues = screen.getAllByText('0');
      expect(activeAlertsValues[1]).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    });

    it('displays subscription status', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Subscription')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  describe('Preferences Section', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession });
    });

    it('displays preferences card with title and description', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Customize your CryptoSentiment experience')).toBeInTheDocument();
    });

    it('displays email notifications preference', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Receive email alerts for price changes and sentiment updates')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
    });

    it('displays alert frequency preference', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Alert Frequency')).toBeInTheDocument();
      expect(screen.getByText('How often you want to receive notifications')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  describe('Navigation Actions', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession });
    });

    it('displays back to dashboard button', () => {
      render(<ProfilePage />);

      expect(screen.getByRole('button', { name: 'Back to Dashboard' })).toBeInTheDocument();
    });

    it('displays view watchlist button', () => {
      render(<ProfilePage />);

      expect(screen.getByRole('button', { name: 'View Watchlist' })).toBeInTheDocument();
    });

    it('navigates to dashboard when back button is clicked', async () => {
      render(<ProfilePage />);

      const backButton = screen.getByRole('button', { name: 'Back to Dashboard' });
      fireEvent.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('navigates to watchlist when watchlist button is clicked', async () => {
      render(<ProfilePage />);

      const watchlistButton = screen.getByRole('button', { name: 'View Watchlist' });
      fireEvent.click(watchlistButton);

      expect(mockPush).toHaveBeenCalledWith('/watchlist');
    });
  });

  describe('Edge Cases', () => {
    it('handles session with undefined user object', () => {
      const sessionWithUndefinedUser = {
        user: undefined,
      };
      mockUseSession.mockReturnValue({ data: sessionWithUndefinedUser });

      render(<ProfilePage />);

      // Should still render the page structure but with fallback values
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('handles completely empty session object', () => {
      mockUseSession.mockReturnValue({ data: {} });

      render(<ProfilePage />);

      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('handles session loading state', () => {
      mockUseSession.mockReturnValue({ data: undefined, status: 'loading' });

      const { container } = render(<ProfilePage />);

      // Component returns null for loading state when no session
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Responsive Design', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession });
    });

    it('applies container and spacing classes', () => {
      const { container } = render(<ProfilePage />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('container', 'mx-auto', 'py-10', 'space-y-6');
    });

    it('applies grid layouts for information display', () => {
      render(<ProfilePage />);

      // Check for grid classes in the component structure
      const gridElements = screen.getByText('Email').closest('.grid');
      expect(gridElements).toHaveClass('grid-cols-2');
    });
  });

  describe('Accessibility', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession });
    });

    it('has proper heading hierarchy', () => {
      render(<ProfilePage />);

      expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    });

    it('has proper label associations for user information', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('has proper button roles and names', () => {
      render(<ProfilePage />);

      expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Back to Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Watchlist' })).toBeInTheDocument();
    });
  });
});