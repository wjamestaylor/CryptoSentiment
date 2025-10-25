import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import Constants from 'expo-constants';
import type { AppRouter } from '../types/api';

export const api = createTRPCReact<AppRouter>();

/**
 * Get the base URL for the API
 * In development, use localhost with the configured port
 * In production, use the production URL from environment
 */
function getBaseUrl() {
  // Use environment variable if available
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (apiUrl) return apiUrl;

  // Default to production URL
  return 'https://lavish-patience-production-f0a0.up.railway.app';
}

export const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers() {
        // Headers will be populated with auth token when available
        return {};
      },
    }),
  ],
});
