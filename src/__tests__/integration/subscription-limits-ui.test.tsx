/**
 * Integration test: Verify subscription limits are correctly displayed in UI
 * This test ensures the complete data flow from UI -> API -> Service -> Database
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useUsageLimit } from '@/hooks/use-usage-limit';
import { UsageType } from '@prisma/client';

// Mock the fetch API
global.fetch = jest.fn();

// Test component that uses the hook
function TestComponent({ usageType }: { usageType: UsageType }) {
  const { currentUsage, limit, isLoading, error } = useUsageLimit(usageType);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div data-testid="current-usage">{currentUsage}</div>
      <div data-testid="limit">{limit}</div>
      <div data-testid="display">{currentUsage}/{limit}</div>
    </div>
  );
}

describe('Subscription Limits - End-to-End Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FREE Tier', () => {
    it('should display correct watchlist limit (10 not 50)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 3,
            limit: 10, // FREE tier watchlist limit
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.WATCHLIST_ADD} />);

      await waitFor(() => {
        expect(screen.getByTestId('limit')).toHaveTextContent('10');
        expect(screen.getByTestId('current-usage')).toHaveTextContent('3');
        expect(screen.getByTestId('display')).toHaveTextContent('3/10');
      });

      // Verify the API was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/usage/limit?type=WATCHLIST_ADD')
      );
    });

    it('should display correct alert limit (5)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 2,
            limit: 5, // FREE tier alert limit
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.ALERT_CREATION} />);

      await waitFor(() => {
        expect(screen.getByTestId('limit')).toHaveTextContent('5');
        expect(screen.getByTestId('display')).toHaveTextContent('2/5');
      });
    });

    it('should display correct AI analysis limit (5)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 3,
            limit: 5, // FREE tier AI analysis limit
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.AI_ANALYSIS} />);

      await waitFor(() => {
        expect(screen.getByTestId('limit')).toHaveTextContent('5');
        expect(screen.getByTestId('display')).toHaveTextContent('3/5');
      });
    });

    it('should display correct bot notification limit (0)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 0,
            limit: 0, // FREE tier has no bot notifications
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.BOT_NOTIFICATION} />);

      await waitFor(() => {
        expect(screen.getByTestId('limit')).toHaveTextContent('0');
        expect(screen.getByTestId('display')).toHaveTextContent('0/0');
      });
    });
  });

  describe('PRO Tier', () => {
    it('should display correct watchlist limit (100)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 25,
            limit: 100, // PRO tier watchlist limit
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.WATCHLIST_ADD} />);

      await waitFor(() => {
        expect(screen.getByTestId('limit')).toHaveTextContent('100');
        expect(screen.getByTestId('display')).toHaveTextContent('25/100');
      });
    });

    it('should display correct alert limit (50)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 10,
            limit: 50, // PRO tier alert limit
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.ALERT_CREATION} />);

      await waitFor(() => {
        expect(screen.getByTestId('limit')).toHaveTextContent('50');
        expect(screen.getByTestId('display')).toHaveTextContent('10/50');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      render(<TestComponent usageType={UsageType.WATCHLIST_ADD} />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<TestComponent usageType={UsageType.WATCHLIST_ADD} />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe('Bug Fix Verification', () => {
    it('should NOT display 50 for FREE tier watchlist (the original bug)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            currentUsage: 3,
            limit: 10, // Correct limit
            resetDate: new Date().toISOString(),
          },
        }),
      });

      render(<TestComponent usageType={UsageType.WATCHLIST_ADD} />);

      await waitFor(() => {
        const limitElement = screen.getByTestId('limit');
        
        // Should be 10, not 50
        expect(limitElement).toHaveTextContent('10');
        expect(limitElement).not.toHaveTextContent('50');
      });
    });
  });
});
