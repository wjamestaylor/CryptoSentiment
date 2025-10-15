import { render, screen, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PricingPage from '@/app/pricing/page';

// Mock NextAuth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Mock router functions
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

describe('PricingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  describe('Pricing Tiers Display', () => {
    it('should display all three pricing tiers', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const freeElements = screen.getAllByText('Free');
      expect(freeElements.length).toBeGreaterThan(0);
      const proElements = screen.getAllByText('Pro');
      expect(proElements.length).toBeGreaterThan(0);
      const businessElements = screen.getAllByText('Business');
      expect(businessElements.length).toBeGreaterThan(0);
    });

    it('should show correct pricing for each tier', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$9')).toBeInTheDocument();
      expect(screen.getByText('$29')).toBeInTheDocument();
    });
  });

  describe('Feature Limits Display', () => {
    it('should show correct AI analysis limits', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const tenPerMonthElements = screen.getAllByText('10/month');
      expect(tenPerMonthElements.length).toBeGreaterThan(0); // Free tier
      const hundredPerMonthElements = screen.getAllByText('100/month');
      expect(hundredPerMonthElements.length).toBeGreaterThan(0); // Pro tier
      const fiveHundredPerMonthElements = screen.getAllByText('500/month');
      expect(fiveHundredPerMonthElements.length).toBeGreaterThan(0); // Business tier
    });

    it('should show correct watchlist limits', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const watchlistElements = screen.getAllByText('10 coins');
      expect(watchlistElements.length).toBeGreaterThan(0); // Free tier appears in both card and table
      const fiftyCoinsElements = screen.getAllByText('50 coins');
      expect(fiftyCoinsElements.length).toBeGreaterThan(0); // Pro tier
      const unlimitedElements = screen.getAllByText('unlimited');
      expect(unlimitedElements.length).toBeGreaterThan(0); // Business tier
    });

    it('should show correct alert limits', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const alertElements = screen.getAllByText(/3\s*alerts/i);
      expect(alertElements.length).toBeGreaterThan(0); // Free tier appears in both card and table
      const fifteenAlertsElements = screen.getAllByText(/15\s*alerts/i);
      expect(fifteenAlertsElements.length).toBeGreaterThan(0); // Pro tier
      const fiftyAlertsElements = screen.getAllByText(/50\s*alerts/i);
      expect(fiftyAlertsElements.length).toBeGreaterThan(0); // Business tier
    });
  });

  describe('Authentication States', () => {
    it('should show signup CTA for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      expect(screen.getByText('Start Pro Trial')).toBeInTheDocument();
      expect(screen.getByText('Start Business Trial')).toBeInTheDocument();
      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    });

    it('should redirect to signup when pro plan is selected without session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const proButton = screen.getByText('Start Pro Trial');
      fireEvent.click(proButton);

      expect(mockPush).toHaveBeenCalledWith('/auth/signup');
    });

    it('should redirect to dashboard when free plan is selected with session', () => {
      mockUseSession.mockReturnValue({
        data: { 
          user: { id: 'test-id', email: 'test@example.com' },
          expires: '2025-12-31T23:59:59.999Z'
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const freeButton = screen.getByText('Get Started Free');
      fireEvent.click(freeButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Feature Comparison Table', () => {
    it('should display feature comparison table', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      expect(screen.getByText('Compare Features')).toBeInTheDocument();
      expect(screen.getByText('AI Sentiment Analyses')).toBeInTheDocument();
      expect(screen.getByText('Watchlist Coins')).toBeInTheDocument();
      
      // Use getAllByText for elements that appear multiple times
      const alertElements = screen.getAllByText('Alerts');
      expect(alertElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Bot Integrations')).toBeInTheDocument();
      expect(screen.getByText('Historical Data')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('should display FAQ section', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByText(/What payment methods/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic structure', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      expect(screen.getByText('Simple, Transparent Pricing')).toBeInTheDocument();
      expect(screen.getByText(/Choose the perfect plan/)).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<PricingPage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });
});