import { useCallback } from 'react';
import { UsageType } from '@prisma/client';

interface TrackUsageOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useTrackUsage(options: TrackUsageOptions = {}) {
  const trackUsage = useCallback(async (usageType: UsageType, metadata?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/usage/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usageType,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to track usage: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        options.onSuccess?.();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track usage';
      console.error('Error tracking usage:', err);
      options.onError?.(errorMessage);
    }
  }, [options]);

  return trackUsage;
}