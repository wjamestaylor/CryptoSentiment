import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { vi, describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockTRPCData = {
  onboarding: {
    getStatus: {
      useQuery: vi.fn(() => ({
        data: {
          data: {
            completed: false,
            currentStep: 1,
            completedAt: null,
            shouldShowOnboarding: true,
          },
        },
        isLoading: false,
      })),
    },
    updateStep: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
        isPending: false,
      })),
    },
    complete: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
        isPending: false,
      })),
    },
    skip: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
        isPending: false,
      })),
    },
  },
  crypto: {
    getTopCryptos: {
      useQuery: vi.fn(() => ({
        data: {
          data: [
            {
              id: 'bitcoin',
              symbol: 'btc',
              name: 'Bitcoin',
              current_price: 50000,
              price_change_percentage_24h: 2.5,
            },
            {
              id: 'ethereum',
              symbol: 'eth',
              name: 'Ethereum',
              current_price: 3000,
              price_change_percentage_24h: 1.8,
            },
          ],
        },
        isLoading: false,
      })),
    },
    addCryptoTracking: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
        isPending: false,
      })),
    },
  },
  alerts: {
    createAlert: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
        isPending: false,
      })),
    },
  },
};

vi.mock('@/lib/trpc/provider', () => ({
  api: mockTRPCData,
}));

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should call skip mutation when skip button is clicked', async () => {
    const skipMock = vi.fn().mockResolvedValue({ success: true });
    mockTRPCData.onboarding.skip.useMutation = vi.fn(() => ({
      mutate: skipMock,
      mutateAsync: skipMock,
      isPending: false,
    })) as any;

    render(<OnboardingWizard />);

    await waitFor(() => {
      const skipButton = screen.getByText(/Skip Setup/i);
      fireEvent.click(skipButton);
    });

    await waitFor(() => {
      expect(skipMock).toHaveBeenCalled();
    });
  });

  it('should show crypto selection on step 2', async () => {
    mockTRPCData.onboarding.getStatus.useQuery = vi.fn(() => ({
      data: {
        data: {
          completed: false,
          currentStep: 2,
          completedAt: null,
          shouldShowOnboarding: true,
        },
      },
      isLoading: false,
    })) as any;

    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Choose Cryptocurrencies to Track/i)).toBeInTheDocument();
    });
  });

  it('should show alert setup on step 3', async () => {
    mockTRPCData.onboarding.getStatus.useQuery = vi.fn(() => ({
      data: {
        data: {
          completed: false,
          currentStep: 3,
          completedAt: null,
          shouldShowOnboarding: true,
        },
      },
      isLoading: false,
    })) as any;

    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Set Up Your First Alert/i)).toBeInTheDocument();
    });
  });

  it('should show final step on step 4', async () => {
    mockTRPCData.onboarding.getStatus.useQuery = vi.fn(() => ({
      data: {
        data: {
          completed: false,
          currentStep: 4,
          completedAt: null,
          shouldShowOnboarding: true,
        },
      },
      isLoading: false,
    })) as any;

    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/You're All Set!/i)).toBeInTheDocument();
    });
  });

  it('should show complete setup button on final step', async () => {
    mockTRPCData.onboarding.getStatus.useQuery = vi.fn(() => ({
      data: {
        data: {
          completed: false,
          currentStep: 4,
          completedAt: null,
          shouldShowOnboarding: true,
        },
      },
      isLoading: false,
    })) as any;

    render(<OnboardingWizard />);

    await waitFor(() => {
      expect(screen.getByText(/Complete Setup/i)).toBeInTheDocument();
    });
  });

  it('should not render when onboarding is completed', () => {
    mockTRPCData.onboarding.getStatus.useQuery = vi.fn(() => ({
      data: {
        data: {
          completed: true,
          currentStep: 4,
          completedAt: new Date(),
          shouldShowOnboarding: false,
        },
      },
      isLoading: false,
    })) as any;

    render(<OnboardingWizard />);

    expect(screen.queryByText(/Get Started with CryptoSentiment/i)).not.toBeInTheDocument();
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
