import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SubscriptionIndicator } from '@/components/subscription/SubscriptionIndicator';

// Mock the dependencies
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseQuery = jest.fn();
jest.mock('@/lib/trpc/provider', () => ({
  api: {
    subscription: {
      getCurrent: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

describe('SubscriptionIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while fetching subscription data', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<SubscriptionIndicator />);
    
    const loadingElement = screen.getByTestId('subscription-loading');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveClass('animate-pulse');
  });

  it('shows free tier with upgrade button when no subscription data', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<SubscriptionIndicator />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('shows free tier with upgrade button for free subscription', () => {
    mockUseQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    render(<SubscriptionIndicator />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    
    const upgradeButton = screen.getByText('Upgrade');
    expect(upgradeButton).toBeInTheDocument();
    
    fireEvent.click(upgradeButton);
    expect(mockPush).toHaveBeenCalledWith('/pricing');
  });

  it('shows pro tier with manage button', () => {
    mockUseQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'PRO',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    render(<SubscriptionIndicator />);
    
    expect(screen.getByText('Pro')).toBeInTheDocument();
    
    const manageButton = screen.getByText('Manage');
    expect(manageButton).toBeInTheDocument();
    
    fireEvent.click(manageButton);
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('shows business tier with manage button', () => {
    mockUseQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          tier: 'BUSINESS',
          status: 'ACTIVE',
        },
      },
      isLoading: false,
    });

    render(<SubscriptionIndicator />);
    
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Manage')).toBeInTheDocument();
  });
});