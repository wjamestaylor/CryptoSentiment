import { api } from '@/lib/trpc/provider';

/**
 * Hook to get user's locale preferences (currency and timezone)
 * Returns default values if not authenticated or preferences not set
 */
export function useUserPreferences() {
  const { data: preferences } = api.auth.getPreferences.useQuery(undefined, {
    retry: false,
  });

  return {
    currency: preferences?.currency ?? 'USD',
    timezone: preferences?.timezone ?? 'UTC',
    theme: preferences?.theme ?? 'dark',
  };
}
