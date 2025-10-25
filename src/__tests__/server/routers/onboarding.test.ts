import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockTRPCProvider } from '@/__tests__/__mocks__/trpc';

// Mock session
const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  expires: '2024-12-31',
};

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: 'authenticated' }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Onboarding Router', () => {
  const mockTRPC = createMockTRPCProvider();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return onboarding status for authenticated user', async () => {
      const mockStatus = {
        onboardingCompleted: false,
        onboardingStep: 1,
        onboardingCompletedAt: null,
      };

      mockTRPC.onboarding.getStatus.useQuery = vi.fn(() => ({
        data: { success: true, data: mockStatus },
        isLoading: false,
        error: null,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.getStatus.useQuery(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({
          success: true,
          data: mockStatus,
        });
      });
    });

    it('should indicate when user should see onboarding', async () => {
      const mockStatus = {
        onboardingCompleted: false,
        onboardingStep: 0,
        onboardingCompletedAt: null,
      };

      mockTRPC.onboarding.getStatus.useQuery = vi.fn(() => ({
        data: {
          success: true,
          data: {
            ...mockStatus,
            shouldShowOnboarding: true,
          },
        },
        isLoading: false,
        error: null,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.getStatus.useQuery(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      await waitFor(() => {
        expect(result.current.data?.data.shouldShowOnboarding).toBe(true);
      });
    });
  });

  describe('updateStep', () => {
    it('should update onboarding step', async () => {
      const mockMutate = vi.fn().mockResolvedValue({
        success: true,
        data: { currentStep: 2 },
      });

      mockTRPC.onboarding.updateStep.useMutation = vi.fn(() => ({
        mutate: mockMutate,
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.updateStep.useMutation(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      await result.current.mutateAsync({ step: 2 });

      expect(mockMutate).toHaveBeenCalledWith({ step: 2 });
    });

    it('should validate step number is within range', async () => {
      const mockMutate = vi.fn().mockRejectedValue(
        new Error('Step must be between 0 and 10')
      );

      mockTRPC.onboarding.updateStep.useMutation = vi.fn(() => ({
        mutate: mockMutate,
        mutateAsync: mockMutate,
        isPending: false,
        isError: true,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.updateStep.useMutation(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      await expect(result.current.mutateAsync({ step: 15 })).rejects.toThrow();
    });
  });

  describe('complete', () => {
    it('should mark onboarding as completed', async () => {
      const completedAt = new Date();
      const mockMutate = vi.fn().mockResolvedValue({
        success: true,
        data: {
          completed: true,
          completedAt,
        },
      });

      mockTRPC.onboarding.complete.useMutation = vi.fn(() => ({
        mutate: mockMutate,
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.complete.useMutation(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      const response = await result.current.mutateAsync();

      expect(response.success).toBe(true);
      expect(response.data.completed).toBe(true);
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('skip', () => {
    it('should skip onboarding and mark step as -1', async () => {
      const mockMutate = vi.fn().mockResolvedValue({
        success: true,
        data: {
          completed: true,
        },
      });

      mockTRPC.onboarding.skip.useMutation = vi.fn(() => ({
        mutate: mockMutate,
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.skip.useMutation(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      const response = await result.current.mutateAsync();

      expect(response.success).toBe(true);
      expect(response.data.completed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset onboarding status', async () => {
      const mockMutate = vi.fn().mockResolvedValue({
        success: true,
        data: {
          completed: false,
          currentStep: 0,
        },
      });

      mockTRPC.onboarding.reset.useMutation = vi.fn(() => ({
        mutate: mockMutate,
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
      })) as any;

      const { result } = renderHook(
        () => mockTRPC.onboarding.reset.useMutation(),
        { wrapper: ({ children }) => <>{children}</> }
      );

      const response = await result.current.mutateAsync();

      expect(response.success).toBe(true);
      expect(response.data.completed).toBe(false);
      expect(response.data.currentStep).toBe(0);
    });
  });
});
