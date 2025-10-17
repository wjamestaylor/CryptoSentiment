import { useEffect, useState, useCallback } from 'react';
import { UsageType } from '@prisma/client';

interface UsageLimit {
  currentUsage: number;
  limit: number;
  resetDate: Date;
}

interface UseUsageLimitReturn {
  currentUsage: number;
  limit: number;
  resetDate: Date | null;
  allowed: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsageLimit(usageType: UsageType): UseUsageLimitReturn {
  const [data, setData] = useState<UsageLimit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageLimit = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/usage/limit?type=${usageType}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage limit: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData({
          currentUsage: result.data.currentUsage,
          limit: result.data.limit,
          resetDate: new Date(result.data.resetDate),
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage limit';
      setError(errorMessage);
      console.error('Error fetching usage limit:', err);
    } finally {
      setIsLoading(false);
    }
  }, [usageType]);

  useEffect(() => {
    fetchUsageLimit();
  }, [fetchUsageLimit]);

  return {
    currentUsage: data?.currentUsage || 0,
    limit: data?.limit || 0,
    resetDate: data?.resetDate || null,
    allowed: (data?.currentUsage || 0) < (data?.limit || 0),
    isLoading,
    error,
    refetch: fetchUsageLimit,
  };
}