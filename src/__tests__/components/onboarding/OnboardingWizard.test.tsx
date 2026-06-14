import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user', email: 'test@example.com' } },
    status: 'authenticated',
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock tRPC API
const mockOnboardingStatus = {
  data: {
    data: {
      completed: false,
      currentStep: 1,
      completedAt: null,
      shouldShowOnboarding: true,
    },
  },
  isLoading: false,
};

const mockCryptoData = {
  data: {
    data: [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        price_change_percentage_24h: 2.5,
      },
    ],
  },
  isLoading: false,
};

const mockUpdateStep = jest.fn().mockResolvedValue({ success: true });
const mockComplete = jest.fn().mockResolvedValue({ success: true });
const mockSkip = jest.fn().mockResolvedValue({ success: true });
const mockAddCrypto = jest.fn().mockResolvedValue({ success: true });
const mockCreateAlert = jest.fn().mockResolvedValue({ success: true });

jest.mock('@/lib/trpc/provider', () => ({
  api: {
    onboarding: {
      getStatus: {
        useQuery: jest.fn(() => mockOnboardingStatus),
      },
      updateStep: {
        useMutation: jest.fn(() => ({
          mutate: mockUpdateStep,
          mutateAsync: mockUpdateStep,
          isPending: false,
        })),
      },
      complete: {
        useMutation: jest.fn(() => ({
          mutate: mockComplete,
          mutateAsync: mockComplete,
          isPending: false,
        })),
      },
      skip: {
        useMutation: jest.fn(() => ({
          mutate: mockSkip,
          mutateAsync: mockSkip,
          isPending: false,
        })),
      },
    },
    crypto: {
      getTopCryptos: {
        useQuery: jest.fn(() => mockCryptoData),
      },
      addCryptoToTracking: {
        useMutation: jest.fn(() => ({
          mutate: mockAddCrypto,
          mutateAsync: mockAddCrypto,
          isPending: false,
        })),
      },
    },
    alerts: {
      createAlert: {
        useMutation: jest.fn(() => ({
          mutate: mockCreateAlert,
          mutateAsync: mockCreateAlert,
          isPending: false,
        })),
      },
    },
  },
}));

describe('OnboardingWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when onboarding is not completed', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Get Started with CryptoSentiment/i)).toBeInTheDocument();
    });
  });

  it('should show welcome step initially', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to CryptoSentiment!/i)).toBeInTheDocument();
      expect(screen.getByText(/AI-Powered Insights/i)).toBeInTheDocument();
    });
  });

  it('should display progress indicator with correct steps', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });
  });

  it('should have skip setup button', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Skip Setup/i)).toBeInTheDocument();
    });
  });

  it('should have next button', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeInTheDocument();
    });
  });

  it('should not show previous button on first step', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      const previousButton = screen.queryByRole('button', { name: /Previous/i });
      expect(previousButton).not.toBeInTheDocument();
    });
  });

  it('should be accessible with proper ARIA labels', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  it('should have responsive design classes', async () => {
    render(<OnboardingWizard />);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('sm:max-w-2xl');
    });
  });
});
