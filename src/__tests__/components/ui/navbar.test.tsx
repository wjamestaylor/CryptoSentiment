import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSession, signOut } from 'next-auth/react';
import { Navbar } from '@/components/ui/navbar';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.Mock;
const mockSignOut = signOut as jest.Mock;

// Mock next/link
jest.mock('next/link', () => {
  interface MockLinkProps {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }
  
  return function MockLink({ children, href, ...props }: MockLinkProps) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window size for each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('renders the logo with correct link', () => {
      render(<Navbar />);

      const logo = screen.getByRole('link', { name: /crypto.*sentiment/i });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('href', '/');
    });

    it('displays basic navigation links for unauthenticated users', () => {
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: 'AI Analysis' })).toHaveAttribute('href', '/sentiment');
      expect(screen.getByRole('link', { name: 'Alerts' })).toHaveAttribute('href', '/alerts');
      expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    });

    it('does not display crypto manager link for unauthenticated users', () => {
      render(<Navbar />);

      expect(screen.queryByRole('link', { name: 'Crypto Manager' })).not.toBeInTheDocument();
    });

    it('displays sign in and upgrade buttons', () => {
      render(<Navbar />);

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();
    });

    it('sign in button links to signin page', () => {
      render(<Navbar />);

      const signInLink = screen.getByRole('button', { name: 'Sign In' }).closest('a');
      expect(signInLink).toHaveAttribute('href', '/auth/signin');
    });

    it('upgrade button links to pricing page', () => {
      render(<Navbar />);

      const getStartedLink = screen.getByRole('button', { name: 'Upgrade to Pro' }).closest('a');
      expect(getStartedLink).toHaveAttribute('href', '/pricing');
    });

    it('does not display settings link for unauthenticated users', () => {
      render(<Navbar />);

      expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
    });

    it('displays crypto manager link for authenticated users', () => {
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'Crypto Manager' })).toHaveAttribute('href', '/crypto');
    });

    it('displays settings link for authenticated users', () => {
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    });

    it('displays welcome message with username', () => {
      render(<Navbar />);

      expect(screen.getByText('Welcome, test')).toBeInTheDocument();
    });

    it('displays sign out button', () => {
      render(<Navbar />);

      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    });

    it('calls signOut when sign out button is clicked', () => {
      render(<Navbar />);

      const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('handles user email without @ symbol gracefully', () => {
      const sessionWithoutAt = {
        user: {
          email: 'testuser',
          name: 'Test User',
        },
      };

      mockUseSession.mockReturnValue({
        data: sessionWithoutAt,
        status: 'authenticated',
      });

      render(<Navbar />);

      expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    });

    it('handles undefined user email gracefully', () => {
      const sessionWithoutEmail = {
        user: {
          email: undefined,
          name: 'Test User',
        },
      };

      mockUseSession.mockReturnValue({
        data: sessionWithoutEmail,
        status: 'authenticated',
      });

      render(<Navbar />);

      // Should not crash and should not display welcome message
      expect(screen.queryByText(/Welcome,/)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });
    });

    it('displays loading spinner during authentication check', () => {
      render(<Navbar />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('does not display auth buttons during loading', () => {
      render(<Navbar />);

      expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Upgrade to Pro' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('displays mobile menu toggle button', () => {
      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('opens mobile menu when toggle button is clicked', () => {
      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      // Check that mobile navigation is visible
      expect(screen.getAllByRole('link', { name: 'Dashboard' })).toHaveLength(2); // Desktop + Mobile
    });

    it('closes mobile menu when toggle button is clicked again', () => {
      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      
      // Open menu
      fireEvent.click(toggleButton);
      expect(screen.getAllByRole('link', { name: 'Dashboard' })).toHaveLength(2);

      // Close menu
      fireEvent.click(toggleButton);
      expect(screen.getAllByRole('link', { name: 'Dashboard' })).toHaveLength(1); // Only desktop
    });

    it('displays menu icon when mobile menu is closed', () => {
      render(<Navbar />);

      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument();
    });

    it('displays close icon when mobile menu is open', () => {
      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-icon')).not.toBeInTheDocument();
    });

    it('closes mobile menu when navigation link is clicked', () => {
      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      // Click on a mobile navigation link
      const mobileLinks = screen.getAllByRole('link', { name: 'Dashboard' });
      const mobileLink = mobileLinks[1]; // Second one is mobile
      fireEvent.click(mobileLink);

      // Menu should be closed
      expect(screen.getAllByRole('link', { name: 'Dashboard' })).toHaveLength(1);
    });
  });

  describe('Mobile Authentication States', () => {
    it('displays mobile auth buttons for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      // Should have both desktop and mobile auth buttons
      expect(screen.getAllByRole('button', { name: 'Sign In' })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: 'Upgrade to Pro' })).toHaveLength(2);
    });

    it('displays mobile welcome message and sign out for authenticated users', () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      // Should have both desktop and mobile welcome messages
      expect(screen.getAllByText('Welcome, test')).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: 'Sign Out' })).toHaveLength(2);
    });

    it('displays mobile loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('closes mobile menu when mobile sign out is clicked', () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      const mobileSignOutButtons = screen.getAllByRole('button', { name: 'Sign Out' });
      const mobileSignOutButton = mobileSignOutButtons[1]; // Second one is mobile
      fireEvent.click(mobileSignOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('closes mobile menu when mobile auth buttons are clicked', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      fireEvent.click(toggleButton);

      const mobileSignInButtons = screen.getAllByRole('button', { name: 'Sign In' });
      const mobileSignInButton = mobileSignInButtons[1]; // Second one is mobile
      fireEvent.click(mobileSignInButton);

      // Menu should be closed
      expect(screen.getAllByRole('button', { name: 'Sign In' })).toHaveLength(1);
    });
  });

  describe('Navigation Links Dynamic Behavior', () => {
    it('includes all navigation links for authenticated users', () => {
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'AI Analysis' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Crypto Manager' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Alerts' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument();
    });

    it('excludes authenticated-only links for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'AI Analysis' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Crypto Manager' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Alerts' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('has proper aria-label for mobile menu toggle', () => {
      render(<Navbar />);

      const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle menu');
    });

    it('has proper role attributes for navigation elements', () => {
      render(<Navbar />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has proper link roles and attributes', () => {
      render(<Navbar />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('applies proper navigation classes', () => {
      const { container } = render(<Navbar />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('border-b', 'bg-card/95', 'backdrop-blur', 'fixed', 'top-0', 'z-50');
    });

    it('applies responsive classes for mobile/desktop differences', () => {
      render(<Navbar />);

      // Check for md:hidden class on mobile menu button
      const mobileToggle = screen.getByRole('button', { name: 'Toggle menu' });
      expect(mobileToggle.parentElement).toHaveClass('md:hidden');
    });
  });
});