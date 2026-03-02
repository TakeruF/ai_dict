import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour — AI responses are stable
      gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors or not found errors
        const errorCode = (error as any)?.code;
        if (errorCode === 'invalid_api_key' || 
            errorCode === 'not_found' ||
            errorCode === 'missing_api_key' ||
            errorCode === 'invalid_invitation_code') {
          return false;
        }
        return failureCount < 2; // Max 2 retries
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Add timeout to prevent hanging requests
      networkMode: 'online',
      // Prevent infinite loading with timeout
      meta: {
        timeout: 30000, // 30 second timeout for all queries
      },
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});
